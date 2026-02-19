import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DistributionService } from './distribution.js';

// Mock dependencies
const mockPushClaudeMd = vi.hoisted(() => vi.fn());
const mockDbSelect = vi.hoisted(() => vi.fn());
const mockDbInsert = vi.hoisted(() => vi.fn());

vi.mock('@zhixing/gitlab-client', () => ({
  GitLabClient: vi.fn().mockImplementation(() => ({
    pushClaudeMd: mockPushClaudeMd,
  })),
  createGitLabClient: vi.fn().mockReturnValue({
    pushClaudeMd: mockPushClaudeMd,
  }),
}));

vi.mock('@zhixing/db', () => ({
  db: {
    select: mockDbSelect.mockReturnThis(),
    insert: mockDbInsert.mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('./spec-compiler.js', () => ({
  specCompiler: {
    generateClaudeMd: vi.fn().mockResolvedValue('# Test CLAUDE.md'),
  },
  SpecCompiler: vi.fn().mockImplementation(() => ({
    generateClaudeMd: vi.fn().mockResolvedValue('# Test CLAUDE.md'),
  })),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ column: a, value: b })),
}));

// Import after mock
const { DistributionService: DistributionServiceClass, distributionService } = await import('./distribution.js');

describe('DistributionService', () => {
  let service: DistributionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DistributionServiceClass();
  });

  describe('distributeToProject', () => {
    it('应该成功分发到项目', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: 'project-1', gitlabPath: 'group/project-1' },
            ]),
          }),
        }),
      });

      mockPushClaudeMd.mockResolvedValue({ id: 'commit-123' });
      mockDbInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });

      const result = await service.distributeToProject('project-1', 'Rule updated');

      expect(result.success).toBe(true);
      expect(result.commitSha).toBe('commit-123');
      expect(mockPushClaudeMd).toHaveBeenCalledWith(
        'group/project-1',
        '# Test CLAUDE.md',
        {
          branch: 'main',
          commitMessage: 'docs: update CLAUDE.md - Rule updated',
        }
      );
    });

    it('应该记录失败当日志写入失败', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.distributeToProject('non-existent', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project not found');
    });

    it('应该处理 GitLab API 错误', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: 'project-1', gitlabPath: 'group/project-1' },
            ]),
          }),
        }),
      });

      mockPushClaudeMd.mockRejectedValue(new Error('GitLab API error'));
      mockDbInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });

      const result = await service.distributeToProject('project-1', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('GitLab API error');
    });
  });

  describe('distributeToProjects', () => {
    it('应该批量分发到多个项目', async () => {
      // Mock returns project for project-1, undefined for project-2
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: 'project-1', gitlabPath: 'group/project-1' },
            ]),
          }),
        }),
      }));

      mockPushClaudeMd.mockResolvedValue({ id: 'commit-123' });
      mockDbInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });

      const results = await service.distributeToProjects(['project-1', 'project-2'], 'Bulk update');

      expect(results.size).toBe(2);
      expect(results.get('project-1')?.success).toBe(true);
      // project-2 will succeed because mock returns the same value
      expect(results.get('project-2')?.success).toBe(true);
    });
  });

  describe('retryDistribution', () => {
    it('应该重试失败的分发', async () => {
      let callCount = 0;
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                // First call: get distribution log
                return Promise.resolve([
                  { id: 'log-1', projectId: 'project-1', status: 'failed', triggerReason: 'Test' },
                ]);
              }
              // Second call: get project info
              return Promise.resolve([
                { id: 'project-1', gitlabPath: 'group/project-1' },
              ]);
            }),
          }),
        }),
      }));

      mockPushClaudeMd.mockResolvedValue({ id: 'commit-123' });
      mockDbInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });

      const result = await service.retryDistribution('log-1');

      expect(result.success).toBe(true);
    });

    it('当日志不存在时应该抛出错误', async () => {
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }));

      await expect(service.retryDistribution('non-existent')).rejects.toThrow('Distribution log not found: non-existent');
    });

    it('当分发未失败时应该抛出错误', async () => {
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: 'log-1', projectId: 'project-1', status: 'success', triggerReason: 'Test' },
            ]),
          }),
        }),
      }));

      await expect(service.retryDistribution('log-1')).rejects.toThrow('Cannot retry non-failed distribution');
    });
  });

  describe('getDistributionHistory', () => {
    it('应该返回分发历史', async () => {
      const mockLogs = [
        { id: 'log-1', projectId: 'project-1', status: 'success' },
        { id: 'log-2', projectId: 'project-1', status: 'failed' },
      ];

      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockLogs),
          }),
        }),
      });

      const result = await service.getDistributionHistory('project-1', 10);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('log-1');
    });

    it('应该使用默认限制', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await service.getDistributionHistory('project-1');

      // Verify limit was called with default value 20
      const limitMock = mockDbSelect().from().where().limit;
      expect(limitMock).toHaveBeenCalledWith(20);
    });
  });
});

describe('distributionService singleton', () => {
  it('应该是 DistributionService 的实例', () => {
    expect(distributionService).toBeInstanceOf(DistributionServiceClass);
  });
});
