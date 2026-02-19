import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { GitLabClient } from './client.js';
import { GitLabError } from './errors.js';
import type {
  GitLabUser,
  GitLabRepository,
  GitLabFile,
  GitLabCommit,
  GitLabBranch,
} from './types.js';

// Mock axios using vi.hoisted
const mockGet = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());
const mockPut = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockAxiosCreate = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: {
    create: (...args: unknown[]) => mockAxiosCreate(...args),
  },
}));

// Import after mock
const { GitLabClient: GitLabClientClass, createGitLabClient } = await import('./client.js');

describe('GitLabClient', () => {
  const mockConfig = {
    baseUrl: 'https://gitlab.example.com',
    token: 'test-token',
    timeout: 30000,
  };

  let client: GitLabClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup axios mock
    mockAxiosCreate.mockReturnValue({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
      interceptors: {
        response: {
          use: vi.fn(),
        },
      },
    });

    client = new GitLabClientClass(mockConfig);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('构造函数', () => {
    it('应该使用提供的配置创建客户端', () => {
      expect(mockAxiosCreate).toHaveBeenCalledWith({
        baseURL: 'https://gitlab.example.com/api/v4',
        headers: {
          'Private-Token': 'test-token',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    });

    it('应该使用默认超时', () => {
      mockAxiosCreate.mockClear();
      new GitLabClientClass({
        baseUrl: 'https://gitlab.example.com',
        token: 'test-token',
      });

      expect(mockAxiosCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
        })
      );
    });
  });

  describe('getCurrentUser', () => {
    it('应该返回当前用户信息', async () => {
      const mockUser: GitLabUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.png',
        web_url: 'https://gitlab.example.com/testuser',
      };

      mockGet.mockResolvedValue({ data: mockUser });

      const result = await client.getCurrentUser();

      expect(mockGet).toHaveBeenCalledWith('/user');
      expect(result).toEqual(mockUser);
    });
  });

  describe('getRepository', () => {
    it('应该返回仓库信息', async () => {
      const mockRepo: GitLabRepository = {
        id: 1,
        name: 'test-repo',
        path_with_namespace: 'group/test-repo',
        web_url: 'https://gitlab.example.com/group/test-repo',
        ssh_url_to_repo: 'git@gitlab.example.com:group/test-repo.git',
        http_url_to_repo: 'https://gitlab.example.com/group/test-repo.git',
        default_branch: 'main',
        visibility: 'private',
        namespace: {
          id: 1,
          name: 'Group',
          path: 'group',
          kind: 'group',
          full_path: 'group',
        },
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-01T00:00:00Z',
      };

      mockGet.mockResolvedValue({ data: mockRepo });

      const result = await client.getRepository('group/test-repo');

      expect(mockGet).toHaveBeenCalledWith('/projects/group%2Ftest-repo');
      expect(result).toEqual(mockRepo);
    });

    it('应该正确处理包含特殊字符的项目路径', async () => {
      mockGet.mockResolvedValue({ data: {} });

      await client.getRepository('group/subgroup/project');

      expect(mockGet).toHaveBeenCalledWith('/projects/group%2Fsubgroup%2Fproject');
    });
  });

  describe('getFile', () => {
    it('应该返回文件内容', async () => {
      const mockFile: GitLabFile = {
        file_name: 'test.ts',
        file_path: 'src/test.ts',
        size: 100,
        encoding: 'base64',
        content: 'Y29uc29sZS5sb2coJ2hlbGxvJyk7',
        content_sha256: 'abc123',
        ref: 'main',
        blob_id: 'def456',
        commit_id: 'ghi789',
        last_commit_id: 'jkl012',
      };

      mockGet.mockResolvedValue({ data: mockFile });

      const result = await client.getFile('group/project', 'src/test.ts');

      expect(mockGet).toHaveBeenCalledWith(
        '/projects/group%2Fproject/repository/files/src%2Ftest.ts',
        { params: { ref: 'main' } }
      );
      expect(result).toEqual(mockFile);
    });

    it('应该支持自定义 ref', async () => {
      mockGet.mockResolvedValue({ data: {} });

      await client.getFile('group/project', 'test.ts', { ref: 'develop' });

      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        { params: { ref: 'develop' } }
      );
    });
  });

  describe('createFile', () => {
    it('应该创建新文件', async () => {
      const mockCommit: GitLabCommit = {
        id: 'abc123',
        short_id: 'abc',
        title: 'Create test.ts',
        author_name: 'Test User',
        author_email: 'test@example.com',
        authored_date: '2024-01-01T00:00:00Z',
        committer_name: 'Test User',
        committer_email: 'test@example.com',
        committed_date: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        message: 'Create test.ts',
        parent_ids: [],
        web_url: 'https://gitlab.example.com/commit/abc123',
      };

      mockPost.mockResolvedValue({ data: mockCommit });

      const result = await client.createFile('group/project', 'test.ts', {
        branch: 'main',
        content: 'console.log("hello")',
        commitMessage: 'Create test.ts',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/projects/group%2Fproject/repository/files/test.ts',
        {
          branch: 'main',
          content: 'console.log("hello")',
          commit_message: 'Create test.ts',
          encoding: 'text',
          author_email: undefined,
          author_name: undefined,
        }
      );
      expect(result).toEqual(mockCommit);
    });

    it('应该支持自定义作者信息', async () => {
      mockPost.mockResolvedValue({ data: {} });

      await client.createFile('group/project', 'test.ts', {
        branch: 'main',
        content: 'content',
        commitMessage: 'Create file',
        authorEmail: 'author@example.com',
        authorName: 'Author Name',
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          author_email: 'author@example.com',
          author_name: 'Author Name',
        })
      );
    });
  });

  describe('updateFile', () => {
    it('应该更新现有文件', async () => {
      const mockCommit: GitLabCommit = {
        id: 'abc123',
        short_id: 'abc',
        title: 'Update test.ts',
        author_name: 'Test User',
        author_email: 'test@example.com',
        authored_date: '2024-01-01T00:00:00Z',
        committer_name: 'Test User',
        committer_email: 'test@example.com',
        committed_date: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        message: 'Update test.ts',
        parent_ids: ['def456'],
        web_url: 'https://gitlab.example.com/commit/abc123',
      };

      mockPut.mockResolvedValue({ data: mockCommit });

      const result = await client.updateFile('group/project', 'test.ts', {
        branch: 'main',
        content: 'console.log("updated")',
        commitMessage: 'Update test.ts',
      });

      expect(mockPut).toHaveBeenCalledWith(
        '/projects/group%2Fproject/repository/files/test.ts',
        {
          branch: 'main',
          content: 'console.log("updated")',
          commit_message: 'Update test.ts',
          encoding: 'text',
          author_email: undefined,
          author_name: undefined,
          last_commit_id: undefined,
        }
      );
      expect(result).toEqual(mockCommit);
    });
  });

  describe('deleteFile', () => {
    it('应该删除文件', async () => {
      mockDelete.mockResolvedValue({ data: {} });

      await client.deleteFile('group/project', 'test.ts', {
        branch: 'main',
        commitMessage: 'Delete test.ts',
      });

      expect(mockDelete).toHaveBeenCalledWith(
        '/projects/group%2Fproject/repository/files/test.ts',
        {
          data: {
            branch: 'main',
            commit_message: 'Delete test.ts',
            author_email: undefined,
            author_name: undefined,
          },
        }
      );
    });
  });

  describe('getBranches', () => {
    it('应该返回分支列表', async () => {
      const mockBranches: GitLabBranch[] = [
        {
          name: 'main',
          merged: false,
          protected: true,
          default: true,
          developers_can_push: false,
          developers_can_merge: false,
          can_push: true,
          web_url: 'https://gitlab.example.com/group/project/-/tree/main',
          commit: {
            id: 'abc123',
            short_id: 'abc',
            title: 'Initial commit',
            author_name: 'Test',
            author_email: 'test@example.com',
            authored_date: '2024-01-01T00:00:00Z',
            committer_name: 'Test',
            committer_email: 'test@example.com',
            committed_date: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            message: 'Initial commit',
            parent_ids: [],
            web_url: 'https://gitlab.example.com/commit/abc123',
          },
        },
      ];

      mockGet.mockResolvedValue({ data: mockBranches });

      const result = await client.getBranches('group/project');

      expect(mockGet).toHaveBeenCalledWith('/projects/group%2Fproject/repository/branches');
      expect(result).toEqual(mockBranches);
    });
  });

  describe('getCommits', () => {
    it('应该返回提交列表', async () => {
      const mockCommits: GitLabCommit[] = [
        {
          id: 'abc123',
          short_id: 'abc',
          title: 'First commit',
          author_name: 'Test User',
          author_email: 'test@example.com',
          authored_date: '2024-01-01T00:00:00Z',
          committer_name: 'Test User',
          committer_email: 'test@example.com',
          committed_date: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          message: 'First commit',
          parent_ids: [],
          web_url: 'https://gitlab.example.com/commit/abc123',
        },
      ];

      mockGet.mockResolvedValue({ data: mockCommits });

      const result = await client.getCommits('group/project');

      expect(mockGet).toHaveBeenCalledWith(
        '/projects/group%2Fproject/repository/commits',
        {
          params: {
            ref_name: undefined,
            since: undefined,
            until: undefined,
            path: undefined,
            per_page: 20,
            page: 1,
          },
        }
      );
      expect(result).toEqual(mockCommits);
    });

    it('应该支持分页和过滤参数', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await client.getCommits('group/project', {
        refName: 'main',
        path: 'src/',
        perPage: 10,
        page: 2,
      });

      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        {
          params: expect.objectContaining({
            ref_name: 'main',
            path: 'src/',
            per_page: 10,
            page: 2,
          }),
        }
      );
    });
  });

  describe('getCommit', () => {
    it('应该返回单个提交信息', async () => {
      const mockCommit: GitLabCommit = {
        id: 'abc123',
        short_id: 'abc',
        title: 'Test commit',
        author_name: 'Test User',
        author_email: 'test@example.com',
        authored_date: '2024-01-01T00:00:00Z',
        committer_name: 'Test User',
        committer_email: 'test@example.com',
        committed_date: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        message: 'Test commit',
        parent_ids: ['def456'],
        web_url: 'https://gitlab.example.com/commit/abc123',
      };

      mockGet.mockResolvedValue({ data: mockCommit });

      const result = await client.getCommit('group/project', 'abc123');

      expect(mockGet).toHaveBeenCalledWith(
        '/projects/group%2Fproject/repository/commits/abc123'
      );
      expect(result).toEqual(mockCommit);
    });
  });

  describe('getTree', () => {
    it('应该返回文件树', async () => {
      const mockTree = [
        { id: 'abc', name: 'src', type: 'tree', path: 'src', mode: '040000' },
        { id: 'def', name: 'test.ts', type: 'blob', path: 'src/test.ts', mode: '100644' },
      ];

      mockGet.mockResolvedValue({ data: mockTree });

      const result = await client.getTree('group/project');

      expect(mockGet).toHaveBeenCalledWith(
        '/projects/group%2Fproject/repository/tree',
        {
          params: {
            path: undefined,
            ref: 'main',
            recursive: false,
            per_page: 20,
            page: 1,
          },
        }
      );
      expect(result).toEqual(mockTree);
    });

    it('应该支持递归获取', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await client.getTree('group/project', { recursive: true });

      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        {
          params: expect.objectContaining({
            recursive: true,
          }),
        }
      );
    });
  });

  describe('getDiff', () => {
    it('应该返回文件差异', async () => {
      const mockDiff = {
        diff: '--- a/test.ts\n+++ b/test.ts\n@@ -1 +1 @@\n-old\n+new',
      };

      mockGet.mockResolvedValue({ data: mockDiff });

      const result = await client.getDiff('group/project', 'v1.0.0', 'v1.1.0');

      expect(mockGet).toHaveBeenCalledWith(
        '/projects/group%2Fproject/repository/compare',
        { params: { from: 'v1.0.0', to: 'v1.1.0' } }
      );
      expect(result).toEqual(mockDiff);
    });
  });

  describe('pushClaudeMd', () => {
    it('当文件不存在时应该创建新文件', async () => {
      const mockCommit: GitLabCommit = {
        id: 'abc123',
        short_id: 'abc',
        title: 'docs: update CLAUDE.md from ZhiXing Platform',
        author_name: 'Test',
        author_email: 'test@example.com',
        authored_date: '2024-01-01T00:00:00Z',
        committer_name: 'Test',
        committer_email: 'test@example.com',
        committed_date: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        message: 'docs: update CLAUDE.md from ZhiXing Platform',
        parent_ids: [],
        web_url: 'https://gitlab.example.com/commit/abc123',
      };

      // 文件不存在（404）
      const gitLabError = new GitLabError('Not Found', 404, {});
      mockGet.mockRejectedValue(gitLabError);
      mockPost.mockResolvedValue({ data: mockCommit });

      const result = await client.pushClaudeMd('group/project', '# Test Content');

      expect(mockGet).toHaveBeenCalledWith(
        '/projects/group%2Fproject/repository/files/CLAUDE.md',
        { params: { ref: 'main' } }
      );
      expect(mockPost).toHaveBeenCalled();
      expect(result).toEqual(mockCommit);
    });

    it('当文件存在时应该更新文件', async () => {
      const mockCommit: GitLabCommit = {
        id: 'abc123',
        short_id: 'abc',
        title: 'Custom commit message',
        author_name: 'Test',
        author_email: 'test@example.com',
        authored_date: '2024-01-01T00:00:00Z',
        committer_name: 'Test',
        committer_email: 'test@example.com',
        committed_date: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        message: 'Custom commit message',
        parent_ids: ['def456'],
        web_url: 'https://gitlab.example.com/commit/abc123',
      };

      mockGet.mockResolvedValue({ data: { file_path: 'CLAUDE.md' } });
      mockPut.mockResolvedValue({ data: mockCommit });

      const result = await client.pushClaudeMd('group/project', '# Updated Content', {
        branch: 'develop',
        commitMessage: 'Custom commit message',
      });

      expect(mockPut).toHaveBeenCalledWith(
        '/projects/group%2Fproject/repository/files/CLAUDE.md',
        expect.objectContaining({
          branch: 'develop',
          content: '# Updated Content',
          commit_message: 'Custom commit message',
        })
      );
      expect(result).toEqual(mockCommit);
    });

    it('应该使用默认提交信息', async () => {
      mockGet.mockResolvedValue({ data: {} });
      mockPut.mockResolvedValue({ data: {} });

      await client.pushClaudeMd('group/project', '# Content');

      expect(mockPut).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          commit_message: 'docs: update CLAUDE.md from ZhiXing Platform',
        })
      );
    });
  });

  describe('错误处理', () => {
    it('应该抛出错误当 API 返回错误', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(client.getCurrentUser()).rejects.toThrow('Network error');
    });
  });
});

describe('createGitLabClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockAxiosCreate.mockReturnValue({
      interceptors: { response: { use: vi.fn() } },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('应该使用环境变量创建客户端', () => {
    vi.stubEnv('GITLAB_URL', 'https://gitlab.env.com');
    vi.stubEnv('GITLAB_TOKEN', 'env-token');

    createGitLabClient();

    expect(mockAxiosCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://gitlab.env.com/api/v4',
        headers: expect.objectContaining({
          'Private-Token': 'env-token',
        }),
      })
    );
  });

  it('应该使用默认配置并合并传入的配置', () => {
    createGitLabClient({ token: 'custom-token' });

    expect(mockAxiosCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'Private-Token': 'custom-token',
        }),
      })
    );
  });

  it('应该使用默认值当环境变量未设置', () => {
    vi.unstubAllEnvs();
    createGitLabClient();

    expect(mockAxiosCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://gitlab.com/api/v4',
        headers: expect.objectContaining({
          'Private-Token': '',
        }),
      })
    );
  });
});
