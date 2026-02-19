import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SpecCompiler, CompilationResult } from './spec-compiler.js';

// Mock database with proper chain
const createMockDb = () => {
  const mockLimit = vi.fn();
  const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

  return {
    select: mockSelect,
    from: mockFrom,
    where: mockWhere,
    limit: mockLimit,
    mockChain: { select: mockSelect, from: mockFrom, where: mockWhere, limit: mockLimit }
  };
};

let mockDb = createMockDb();

vi.mock('@zhixing/db', () => ({
  db: {
    select: () => mockDb.select(),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ column: a, value: b })),
  and: vi.fn((...conditions) => ({ conditions })),
  inArray: vi.fn((column, values) => ({ column, values })),
}));

// Import after mock
const { SpecCompiler: SpecCompilerClass, specCompiler } = await import('./spec-compiler.js');

describe('SpecCompiler', () => {
  let compiler: SpecCompiler;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockDb();
    compiler = new SpecCompilerClass();
  });

  describe('compileForProject', () => {
    it('应该抛出错误当项目不存在', async () => {
      mockDb.limit.mockResolvedValue([]);

      await expect(compiler.compileForProject('non-existent')).rejects.toThrow('Project not found: non-existent');
    });

    it('应该抛出错误当领域不存在', async () => {
      mockDb.limit
        .mockResolvedValueOnce([{ id: 'project-1', name: 'Test Project', domainId: 'domain-1', subscriptions: [] }])
        .mockResolvedValueOnce([]);

      await expect(compiler.compileForProject('project-1')).rejects.toThrow('Domain not found: domain-1');
    });
  });

  describe('generateClaudeMd', () => {
    it('应该生成格式正确的 CLAUDE.md', async () => {
      // 使用 spy 来 mock compileForProject
      const mockResult: CompilationResult = {
        rules: [
          { id: 'rule-1', level: 'company', content: 'Use TypeScript', source: 'company' },
          { id: 'rule-2', level: 'domain', content: 'Follow standards', source: 'Backend', domainId: 'domain-1' },
          { id: 'rule-3', level: 'project', content: 'Project specific', source: 'My Project' },
        ],
        metadata: {
          projectId: 'project-1',
          projectName: 'My Project',
          domainId: 'domain-1',
          domainName: 'Backend',
          subscriptions: ['domain-2'],
          compiledAt: '2024-01-01T00:00:00Z',
          totalRules: 3,
          overriddenRules: 0,
        },
      };

      vi.spyOn(compiler, 'compileForProject').mockResolvedValue(mockResult);

      const content = await compiler.generateClaudeMd('project-1');

      expect(content).toContain('# 项目规范 (CLAUDE.md)');
      expect(content).toContain('My Project');
      expect(content).toContain('Backend');
      expect(content).toContain('## 公司级规范');
      expect(content).toContain('Use TypeScript');
      expect(content).toContain('## 领域级规范');
      expect(content).toContain('Follow standards');
      expect(content).toContain('## 项目级规范');
      expect(content).toContain('Project specific');
      expect(content).toContain('## 订阅领域');
      expect(content).toContain('- domain-2');
      expect(content).toContain('总规则数: 3');
    });

    it('当没有规则时不应显示规则章节', async () => {
      const mockResult: CompilationResult = {
        rules: [],
        metadata: {
          projectId: 'project-1',
          projectName: 'Empty Project',
          domainId: 'domain-1',
          domainName: 'Backend',
          subscriptions: [],
          compiledAt: '2024-01-01T00:00:00Z',
          totalRules: 0,
          overriddenRules: 0,
        },
      };

      vi.spyOn(compiler, 'compileForProject').mockResolvedValue(mockResult);

      const content = await compiler.generateClaudeMd('project-1');

      expect(content).toContain('# 项目规范 (CLAUDE.md)');
      expect(content).not.toContain('## 公司级规范');
      expect(content).not.toContain('## 领域级规范');
      expect(content).not.toContain('## 项目级规范');
    });

    it('当没有订阅领域时不应显示订阅章节', async () => {
      const mockResult: CompilationResult = {
        rules: [{ id: 'rule-1', level: 'company', content: 'Rule 1', source: 'company' }],
        metadata: {
          projectId: 'project-1',
          projectName: 'Test Project',
          domainId: 'domain-1',
          domainName: 'Backend',
          subscriptions: [],
          compiledAt: '2024-01-01T00:00:00Z',
          totalRules: 1,
          overriddenRules: 0,
        },
      };

      vi.spyOn(compiler, 'compileForProject').mockResolvedValue(mockResult);

      const content = await compiler.generateClaudeMd('project-1');

      expect(content).not.toContain('## 订阅领域');
    });

    it('应该正确标记已覆盖的规则', async () => {
      const mockResult: CompilationResult = {
        rules: [{ id: 'rule-1', level: 'company', content: 'Rule 1', source: 'company' }],
        metadata: {
          projectId: 'project-1',
          projectName: 'Test Project',
          domainId: 'domain-1',
          domainName: 'Backend',
          subscriptions: [],
          compiledAt: '2024-01-01T00:00:00Z',
          totalRules: 1,
          overriddenRules: 2,
        },
      };

      vi.spyOn(compiler, 'compileForProject').mockResolvedValue(mockResult);

      const content = await compiler.generateClaudeMd('project-1');

      expect(content).toContain('已覆盖规则: 2');
    });
  });

  describe('specCompiler singleton', () => {
    it('应该是 SpecCompiler 的实例', () => {
      expect(specCompiler).toBeInstanceOf(SpecCompilerClass);
    });
  });
});
