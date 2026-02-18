/**
 * GitLab API 类型定义
 */

/**
 * GitLab 配置
 */
export interface GitLabConfig {
  baseUrl: string;
  token: string;
  timeout?: number;
}

/**
 * GitLab 用户
 */
export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar_url: string;
  web_url: string;
}

/**
 * GitLab 仓库
 */
export interface GitLabRepository {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  default_branch: string;
  visibility: 'public' | 'internal' | 'private';
  namespace: {
    id: number;
    name: string;
    path: string;
    kind: string;
    full_path: string;
  };
  owner?: GitLabUser;
  created_at: string;
  last_activity_at: string;
}

/**
 * GitLab 文件
 */
export interface GitLabFile {
  file_name: string;
  file_path: string;
  size: number;
  encoding: string;
  content: string;
  content_sha256: string;
  ref: string;
  blob_id: string;
  commit_id: string;
  last_commit_id: string;
  execute_filemode?: boolean;
}

/**
 * GitLab 提交
 */
export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  created_at: string;
  message: string;
  parent_ids: string[];
  web_url: string;
}

/**
 * GitLab 分支
 */
export interface GitLabBranch {
  name: string;
  merged: boolean;
  protected: boolean;
  default: boolean;
  developers_can_push: boolean;
  developers_can_merge: boolean;
  can_push: boolean;
  web_url: string;
  commit: GitLabCommit;
}

/**
 * 创建文件选项
 */
export interface CreateFileOptions {
  branch: string;
  content: string;
  commitMessage: string;
  encoding?: 'text' | 'base64';
  authorEmail?: string;
  authorName?: string;
}

/**
 * 更新文件选项
 */
export interface UpdateFileOptions {
  branch: string;
  content: string;
  commitMessage: string;
  encoding?: 'text' | 'base64';
  authorEmail?: string;
  authorName?: string;
  lastCommitId?: string;
}

/**
 * 获取文件选项
 */
export interface GetFileOptions {
  ref?: string;
}

/**
 * 文件树项
 */
export interface GitLabTreeItem {
  id: string;
  name: string;
  type: 'tree' | 'blob';
  path: string;
  mode: string;
}

/**
 * 差异
 */
export interface GitLabDiff {
  old_path: string;
  new_path: string;
  a_mode: string;
  b_mode: string;
  diff: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
}

/**
 * 比较
 */
export interface GitLabCompare {
  commit: GitLabCommit;
  commits: GitLabCommit[];
  diffs: GitLabDiff[];
  compare_timeout: boolean;
  compare_same_ref: boolean;
}
