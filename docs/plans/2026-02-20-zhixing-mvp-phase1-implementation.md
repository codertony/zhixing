# 知行平台 MVP Phase 1 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 4 周内完成知行平台 MVP Phase 1：项目级 Spec 规则管理 + CLI 自动分发，支持营销采购系统试点接入

**Architecture:** Monorepo (Turborepo + pnpm) 架构，Fastify 后端 + React 前端 + Node.js CLI，PostgreSQL 存储，GitLab API 集成，Handlebars 模板渲染 CLAUDE.md

**Tech Stack:** Node.js 20, Fastify, React 18, Vite, Tailwind CSS, Drizzle ORM, PostgreSQL 15, Handlebars, Commander.js

---

## Week 1: 基础设施与工程脚手架

### Task 1: 初始化 Monorepo 项目结构

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.npmrc`

**Step 1: 创建根 package.json**

```json
{
  "name": "zhixing",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "db:generate": "pnpm --filter @zhixing/db generate",
    "db:migrate": "pnpm --filter @zhixing/db migrate"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.4.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

**Step 2: 创建 pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 3: 创建 turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Step 4: 创建 .npmrc**

```
shamefully-hoist=true
strict-peer-dependencies=false
```

**Step 5: 初始化 git 并提交**

```bash
git init
git add .
git commit -m "chore: init monorepo with turborepo"
```

---

### Task 2: 配置共享包结构与 ESLint/Prettier

**Files:**
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/base.js`
- Create: `packages/typescript-config/package.json`
- Create: `packages/typescript-config/base.json`

**Step 1: 创建 ESLint 共享配置**

```bash
mkdir -p packages/eslint-config
```

`packages/eslint-config/package.json`:
```json
{
  "name": "@zhixing/eslint-config",
  "version": "0.1.0",
  "private": true,
  "files": ["*.js"],
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-config-prettier": "^9.1.0"
  }
}
```

`packages/eslint-config/base.js`:
```javascript
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  env: {
    node: true,
    es2022: true
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
};
```

**Step 2: 创建 TypeScript 共享配置**

```bash
mkdir -p packages/typescript-config
```

`packages/typescript-config/package.json`:
```json
{
  "name": "@zhixing/typescript-config",
  "version": "0.1.0",
  "private": true,
  "files": ["*.json"]
}
```

`packages/typescript-config/base.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Step 3: 提交**

```bash
git add packages/
git commit -m "chore: add shared eslint and typescript configs"
```

---

### Task 3: 创建数据库包（Drizzle ORM + Schema）

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/tsconfig.json`

**Step 1: 创建包结构**

```bash
mkdir -p packages/db/src
```

`packages/db/package.json`:
```json
{
  "name": "@zhixing/db",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "drizzle-orm": "^0.30.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "@zhixing/typescript-config": "workspace:*",
    "drizzle-kit": "^0.22.0",
    "typescript": "^5.4.0"
  }
}
```

**Step 2: 定义数据库 Schema**

`packages/db/src/schema.ts`:
```typescript
import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const ruleStatusEnum = pgEnum("rule_status", ["draft", "published"]);
export const distributionStatusEnum = pgEnum("distribution_status", ["pending", "success", "failed"]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  gitlabRepo: varchar("gitlab_repo", { length: 500 }).notNull().unique(),
  gitlabToken: text("gitlab_token").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const specRules = pgTable("spec_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  status: ruleStatusEnum("status").default("draft").notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const distributionLogs = pgTable("distribution_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  triggeredBy: varchar("triggered_by", { length: 50 }).notNull(),
  status: distributionStatusEnum("status").default("pending").notNull(),
  gitlabCommitSha: varchar("gitlab_commit_sha", { length: 100 }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});
```

**Step 3: 创建数据库连接入口**

`packages/db/src/index.ts`:
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";

export function createDatabaseClient(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDatabaseClient>;
```

**Step 4: 配置 Drizzle Kit**

`packages/db/drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://localhost:5432/zhixing",
  },
});
```

**Step 5: TypeScript 配置**

`packages/db/tsconfig.json`:
```json
{
  "extends": "@zhixing/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 6: 提交**

```bash
git add packages/db/
git commit -m "feat(db): add drizzle orm with core schema"
```

---

### Task 4: 创建 GitLab API 客户端包

**Files:**
- Create: `packages/gitlab-client/package.json`
- Create: `packages/gitlab-client/src/index.ts`
- Create: `packages/gitlab-client/src/client.ts`
- Create: `packages/gitlab-client/src/types.ts`
- Create: `packages/gitlab-client/tsconfig.json`

**Step 1: 创建包结构**

```bash
mkdir -p packages/gitlab-client/src
```

`packages/gitlab-client/package.json`:
```json
{
  "name": "@zhixing/gitlab-client",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@zhixing/typescript-config": "workspace:*",
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0"
  }
}
```

**Step 2: 定义类型**

`packages/gitlab-client/src/types.ts`:
```typescript
export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  default_branch: string;
}

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  created_at: string;
}

export interface CommitFileAction {
  action: "create" | "update" | "delete";
  file_path: string;
  content?: string;
  encoding?: "text" | "base64";
}

export interface CreateCommitPayload {
  branch: string;
  commit_message: string;
  actions: CommitFileAction[];
}
```

**Step 3: 实现 GitLab 客户端**

`packages/gitlab-client/src/client.ts`:
```typescript
import axios, { AxiosInstance } from "axios";
import { GitLabProject, GitLabCommit, CreateCommitPayload } from "./types";

export class GitLabClient {
  private client: AxiosInstance;

  constructor(baseURL: string, privateToken: string) {
    this.client = axios.create({
      baseURL: baseURL.replace(/\/$/, ""),
      headers: {
        "PRIVATE-TOKEN": privateToken,
        "Content-Type": "application/json",
      },
    });
  }

  async getProject(projectId: string): Promise<GitLabProject> {
    const response = await this.client.get(`/api/v4/projects/${encodeURIComponent(projectId)}`);
    return response.data;
  }

  async getFileContent(projectId: string, filePath: string, ref: string = "main"): Promise<string> {
    const response = await this.client.get(
      `/api/v4/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}/raw`,
      { params: { ref } }
    );
    return response.data;
  }

  async createCommit(projectId: string, payload: CreateCommitPayload): Promise<GitLabCommit> {
    const response = await this.client.post(
      `/api/v4/projects/${encodeURIComponent(projectId)}/repository/commits`,
      payload
    );
    return response.data;
  }

  async fileExists(projectId: string, filePath: string, ref: string = "main"): Promise<boolean> {
    try {
      await this.client.head(
        `/api/v4/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}`,
        { params: { ref } }
      );
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }
}
```

**Step 4: 导出入口**

`packages/gitlab-client/src/index.ts`:
```typescript
export { GitLabClient } from "./client";
export * from "./types";
```

**Step 5: TypeScript 配置**

`packages/gitlab-client/tsconfig.json`:
```json
{
  "extends": "@zhixing/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 6: 提交**

```bash
git add packages/gitlab-client/
git commit -m "feat(gitlab-client): add gitlab api client with commit operations"
```

---

### Task 5: 创建共享工具包

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/tsconfig.json`

**Step 1: 创建包结构**

```bash
mkdir -p packages/shared/src
```

`packages/shared/package.json`:
```json
{
  "name": "@zhixing/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@zhixing/typescript-config": "workspace:*",
    "typescript": "^5.4.0"
  }
}
```

**Step 2: 定义共享类型**

`packages/shared/src/types.ts`:
```typescript
export interface SpecRule {
  id: string;
  projectId: string;
  title: string;
  content: string;
  status: "draft" | "published";
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  gitlabRepo: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DistributionResult {
  success: boolean;
  commitSha?: string;
  error?: string;
}

export interface CompiledSpec {
  projectName: string;
  generatedAt: Date;
  rules: Array<{
    title: string;
    content: string;
  }>;
}
```

**Step 3: 导出入口**

`packages/shared/src/index.ts`:
```typescript
export * from "./types";
```

**Step 4: TypeScript 配置**

`packages/shared/tsconfig.json`:
```json
{
  "extends": "@zhixing/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 5: 提交**

```bash
git add packages/shared/
git commit -m "chore(shared): add shared types package"
```

---

### Task 6: 安装依赖并构建包

**Step 1: 安装所有依赖**

```bash
pnpm install
```

**Step 2: 构建所有包**

```bash
pnpm build
```

**Step 3: 类型检查**

```bash
pnpm typecheck
```

**Step 4: Week 1 完成提交**

```bash
git add pnpm-lock.yaml
git commit -m "chore: install dependencies and build packages"
```

---

## Week 2: 后端 API 开发

### Task 7: 初始化后端 API 项目

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/.env.example`

**Step 1: 创建 API 包**

```bash
mkdir -p apps/api/src
```

`apps/api/package.json`:
```json
{
  "name": "@zhixing/api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@zhixing/db": "workspace:*",
    "@zhixing/gitlab-client": "workspace:*",
    "@zhixing/shared": "workspace:*",
    "fastify": "^4.26.0",
    "handlebars": "^4.7.8",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@zhixing/eslint-config": "workspace:*",
    "@zhixing/typescript-config": "workspace:*",
    "@types/handlebars": "^4.1.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.57.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0",
    "vitest": "^1.3.0"
  }
}
```

**Step 2: 创建 Fastify 服务器**

`apps/api/src/server.ts`:
```typescript
import Fastify from "fastify";
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
```

**Step 3: 创建入口文件**

`apps/api/src/index.ts`:
```typescript
import { buildServer } from "./server";

const PORT = parseInt(process.env.PORT || "3001");

async function main() {
  const app = await buildServer();
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Server running at http://localhost:${PORT}`);
}

main().catch(console.error);
```

**Step 4: TypeScript 配置**

`apps/api/tsconfig.json`:
```json
{
  "extends": "@zhixing/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 5: 环境变量模板**

`apps/api/.env.example`:
```
PORT=3001
DATABASE_URL=postgres://localhost:5432/zhixing
```

**Step 6: 安装依赖并提交**

```bash
pnpm install
git add apps/api/
git commit -m "feat(api): init fastify server"
```

---

### Task 8: 实现项目 CRUD API

**Files:**
- Create: `apps/api/src/routes/projects.ts`
- Modify: `apps/api/src/server.ts`

**Step 1: 创建项目路由**

`apps/api/src/routes/projects.ts`:
```typescript
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { createDatabaseClient } from "@zhixing/db";

const databaseUrl = process.env.DATABASE_URL || "postgres://localhost:5432/zhixing";
const db = createDatabaseClient(databaseUrl);

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  gitlabRepo: z.string().min(1),
  gitlabToken: z.string().min(1),
});

export async function projectRoutes(app: FastifyInstance) {
  // GET /api/projects - 列出所有项目
  app.get("/api/projects", async () => {
    return await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });
  });

  // GET /api/projects/:id - 获取单个项目
  app.get("/api/projects/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.id, id),
    });
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }
    return project;
  });

  // POST /api/projects - 创建项目
  app.post("/api/projects", async (request, reply) => {
    const body = createProjectSchema.parse(request.body);
    const result = await db.insert(db.projects).values(body).returning();
    return reply.status(201).send(result[0]);
  });

  // DELETE /api/projects/:id - 删除项目
  app.delete("/api/projects/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(db.projects).where(eq(db.projects.id, id));
    return reply.status(204).send();
  });
}

import { eq } from "drizzle-orm";
import { projects } from "@zhixing/db";
```

**Step 2: 修复导入问题，重构路由文件**

`apps/api/src/routes/projects.ts`:
```typescript
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDatabaseClient, projects } from "@zhixing/db";

const databaseUrl = process.env.DATABASE_URL || "postgres://localhost:5432/zhixing";

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  gitlabRepo: z.string().min(1),
  gitlabToken: z.string().min(1),
});

export async function projectRoutes(app: FastifyInstance) {
  const db = createDatabaseClient(databaseUrl);

  app.get("/api/projects", async () => {
    return await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });
  });

  app.get("/api/projects/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await db.query.projects.findFirst({
      where: (p, { eq }) => eq(p.id, id),
    });
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }
    return project;
  });

  app.post("/api/projects", async (request, reply) => {
    const body = createProjectSchema.parse(request.body);
    const result = await db.insert(projects).values(body).returning();
    return reply.status(201).send(result[0]);
  });

  app.delete("/api/projects/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(projects).where(eq(projects.id, id));
    return reply.status(204).send();
  });
}
```

**Step 3: 注册路由到服务器**

修改 `apps/api/src/server.ts`:
```typescript
import Fastify from "fastify";
import { projectRoutes } from "./routes/projects";

export async function buildServer() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(projectRoutes);

  return app;
}
```

**Step 4: 安装 fastify-type-provider-zod**

```bash
cd apps/api
pnpm add fastify-type-provider-zod
```

**Step 5: 提交**

```bash
git add apps/api/src/
git commit -m "feat(api): add project CRUD endpoints"
```

---

### Task 9: 实现 Spec 规则 CRUD API

**Files:**
- Create: `apps/api/src/routes/rules.ts`
- Modify: `apps/api/src/server.ts`

**Step 1: 创建规则路由**

`apps/api/src/routes/rules.ts`:
```typescript
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createDatabaseClient, specRules, projects } from "@zhixing/db";

const databaseUrl = process.env.DATABASE_URL || "postgres://localhost:5432/zhixing";

const createRuleSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  status: z.enum(["draft", "published"]).default("draft"),
  createdBy: z.string().min(1),
});

const updateRuleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export async function ruleRoutes(app: FastifyInstance) {
  const db = createDatabaseClient(databaseUrl);

  // GET /api/rules?projectId=xxx - 列出规则
  app.get("/api/rules", async (request) => {
    const { projectId } = request.query as { projectId?: string };

    if (!projectId) {
      return await db.query.specRules.findMany({
        orderBy: (rules, { desc }) => [desc(rules.createdAt)],
      });
    }

    return await db.query.specRules.findMany({
      where: (rules, { eq }) => eq(rules.projectId, projectId),
      orderBy: (rules, { desc }) => [desc(rules.createdAt)],
    });
  });

  // GET /api/rules/:id - 获取单个规则
  app.get("/api/rules/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const rule = await db.query.specRules.findFirst({
      where: (r, { eq }) => eq(r.id, id),
    });
    if (!rule) {
      return reply.status(404).send({ error: "Rule not found" });
    }
    return rule;
  });

  // POST /api/rules - 创建规则
  app.post("/api/rules", async (request, reply) => {
    const body = createRuleSchema.parse(request.body);

    // 验证项目存在
    const project = await db.query.projects.findFirst({
      where: (p, { eq }) => eq(p.id, body.projectId),
    });
    if (!project) {
      return reply.status(400).send({ error: "Project not found" });
    }

    const result = await db.insert(specRules).values({
      ...body,
      updatedAt: new Date(),
    }).returning();

    return reply.status(201).send(result[0]);
  });

  // PUT /api/rules/:id - 更新规则
  app.put("/api/rules/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateRuleSchema.parse(request.body);

    const existing = await db.query.specRules.findFirst({
      where: (r, { eq }) => eq(r.id, id),
    });
    if (!existing) {
      return reply.status(404).send({ error: "Rule not found" });
    }

    const result = await db.update(specRules)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(specRules.id, id))
      .returning();

    return result[0];
  });

  // DELETE /api/rules/:id - 删除规则
  app.delete("/api/rules/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(specRules).where(eq(specRules.id, id));
    return reply.status(204).send();
  });
}
```

**Step 2: 注册路由**

修改 `apps/api/src/server.ts`:
```typescript
import Fastify from "fastify";
import { projectRoutes } from "./routes/projects";
import { ruleRoutes } from "./routes/rules";

export async function buildServer() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(projectRoutes);
  await app.register(ruleRoutes);

  return app;
}
```

**Step 3: 提交**

```bash
git add apps/api/src/
git commit -m "feat(api): add spec rules CRUD endpoints"
```

---

### Task 10: 实现 CLAUDE.md 编译与分发逻辑

**Files:**
- Create: `apps/api/src/services/compiler.ts`
- Create: `apps/api/src/services/distributor.ts`
- Create: `apps/api/src/routes/distribute.ts`
- Create: `apps/api/templates/claude.md.hbs`

**Step 1: 创建 Handlebars 模板**

```bash
mkdir -p apps/api/templates
```

`apps/api/templates/claude.md.hbs`:
```handlebars
# {{projectName}} - AI 编程规范

> 本文件由知行平台自动生成，请勿手动修改
> 生成时间: {{generatedAt}}
> 规则数量: {{ruleCount}}

---

{{#each rules}}
## {{title}}

{{{content}}}

---

{{/each}}

*Powered by 知行平台*
```

**Step 2: 实现编译服务**

`apps/api/src/services/compiler.ts`:
```typescript
import Handlebars from "handlebars";
import { readFileSync } from "fs";
import { join } from "path";
import type { SpecRule } from "@zhixing/shared";

const templatePath = join(__dirname, "../../templates/claude.md.hbs");
const templateSource = readFileSync(templatePath, "utf-8");
const template = Handlebars.compile(templateSource);

export interface CompileOptions {
  projectName: string;
  rules: Array<{
    title: string;
    content: string;
  }>;
}

export function compileClaudeMd(options: CompileOptions): string {
  return template({
    projectName: options.projectName,
    generatedAt: new Date().toISOString(),
    ruleCount: options.rules.length,
    rules: options.rules,
  });
}
```

**Step 3: 实现分发服务**

`apps/api/src/services/distributor.ts`:
```typescript
import { GitLabClient } from "@zhixing/gitlab-client";
import type { DistributionResult } from "@zhixing/shared";

export interface DistributeOptions {
  gitlabBaseUrl: string;
  gitlabToken: string;
  gitlabRepo: string;
  branch: string;
  content: string;
  commitMessage: string;
}

export async function distributeToGitLab(options: DistributeOptions): Promise<DistributionResult> {
  const client = new GitLabClient(options.gitlabBaseUrl, options.gitlabToken);

  try {
    // 检查文件是否存在
    const fileExists = await client.fileExists(options.gitlabRepo, "CLAUDE.md", options.branch);

    // 创建或更新文件
    const result = await client.createCommit(options.gitlabRepo, {
      branch: options.branch,
      commit_message: options.commitMessage,
      actions: [
        {
          action: fileExists ? "update" : "create",
          file_path: "CLAUDE.md",
          content: options.content,
          encoding: "text",
        },
      ],
    });

    return {
      success: true,
      commitSha: result.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

**Step 4: 实现分发路由**

`apps/api/src/routes/distribute.ts`:
```typescript
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createDatabaseClient, projects, specRules, distributionLogs } from "@zhixing/db";
import { compileClaudeMd } from "../services/compiler";
import { distributeToGitLab } from "../services/distributor";

const databaseUrl = process.env.DATABASE_URL || "postgres://localhost:5432/zhixing";
const gitlabBaseUrl = process.env.GITLAB_BASE_URL || "https://gitlab.company.com";

const distributeSchema = z.object({
  branch: z.string().default("main"),
});

export async function distributeRoutes(app: FastifyInstance) {
  const db = createDatabaseClient(databaseUrl);

  // POST /api/projects/:id/distribute - 手动触发分发
  app.post("/api/projects/:id/distribute", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { branch } = distributeSchema.parse(request.body);

    // 获取项目信息
    const project = await db.query.projects.findFirst({
      where: (p, { eq }) => eq(p.id, id),
    });
    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }

    // 获取已发布的规则
    const rules = await db.query.specRules.findMany({
      where: (r, { eq, and }) => and(
        eq(r.projectId, id),
        eq(r.status, "published")
      ),
    });

    if (rules.length === 0) {
      return reply.status(400).send({ error: "No published rules found" });
    }

    // 创建分发记录
    const logResult = await db.insert(distributionLogs).values({
      projectId: id,
      triggeredBy: "manual",
      status: "pending",
    }).returning();
    const logId = logResult[0].id;

    try {
      // 编译 CLAUDE.md
      const claudeMdContent = compileClaudeMd({
        projectName: project.name,
        rules: rules.map(r => ({ title: r.title, content: r.content })),
      });

      // 分发到 GitLab
      const result = await distributeToGitLab({
        gitlabBaseUrl,
        gitlabToken: project.gitlabToken,
        gitlabRepo: project.gitlabRepo,
        branch,
        content: claudeMdContent,
        commitMessage: "docs: update CLAUDE.md from ZhiXing platform",
      });

      // 更新分发记录
      await db.update(distributionLogs)
        .set({
          status: result.success ? "success" : "failed",
          gitlabCommitSha: result.commitSha,
          errorMessage: result.error,
          completedAt: new Date(),
        })
        .where(eq(distributionLogs.id, logId));

      if (!result.success) {
        return reply.status(500).send({ error: result.error });
      }

      return {
        success: true,
        commitSha: result.commitSha,
        ruleCount: rules.length,
      };
    } catch (error) {
      await db.update(distributionLogs)
        .set({
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        })
        .where(eq(distributionLogs.id, logId));

      throw error;
    }
  });

  // GET /api/projects/:id/distributions - 获取分发历史
  app.get("/api/projects/:id/distributions", async (request, reply) => {
    const { id } = request.params as { id: string };

    const logs = await db.query.distributionLogs.findMany({
      where: (l, { eq }) => eq(l.projectId, id),
      orderBy: (l, { desc }) => [desc(l.createdAt)],
      limit: 10,
    });

    return logs;
  });
}
```

**Step 5: 注册路由**

修改 `apps/api/src/server.ts`:
```typescript
import Fastify from "fastify";
import { projectRoutes } from "./routes/projects";
import { ruleRoutes } from "./routes/rules";
import { distributeRoutes } from "./routes/distribute";

export async function buildServer() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(projectRoutes);
  await app.register(ruleRoutes);
  await app.register(distributeRoutes);

  return app;
}
```

**Step 6: 提交**

```bash
git add apps/api/
git commit -m "feat(api): add claude.md compilation and distribution"
```

---

### Task 11: Week 2 总结与测试

**Step 1: 创建数据库迁移**

```bash
cd packages/db
pnpm generate
```

**Step 2: 启动开发服务器测试**

```bash
cd apps/api
pnpm dev
```

访问 `http://localhost:3001/health` 应该返回 `{ status: "ok" }`

**Step 3: Week 2 完成提交**

```bash
git add .
git commit -m "feat(api): complete week 2 backend api development"
```

---

## Week 3: Web UI 与 CLI 开发

### Task 12: 初始化前端项目

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`

**Step 1: 创建前端包**

```bash
mkdir -p apps/web/src
```

`apps/web/package.json`:
```json
{
  "name": "@zhixing/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "@tanstack/react-query": "^5.20.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.4.0",
    "vite": "^5.1.0"
  }
}
```

**Step 2: 配置 Vite**

`apps/web/vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

**Step 3: 配置 Tailwind**

`apps/web/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

`apps/web/postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

`apps/web/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: 创建入口文件**

`apps/web/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>知行平台 - AI 编程规范管理</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`apps/web/src/main.tsx`:
```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

`apps/web/src/App.tsx`:
```typescript
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link to="/" className="text-xl font-bold text-blue-600">
              知行平台
            </Link>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

**Step 5: 提交**

```bash
pnpm install
git add apps/web/
git commit -m "feat(web): init react frontend with tailwind"
```

---

### Task 13: 实现项目管理页面

**Files:**
- Create: `apps/web/src/pages/ProjectsPage.tsx`
- Create: `apps/web/src/components/CreateProjectModal.tsx`
- Create: `apps/web/src/api/client.ts`

**Step 1: 创建 API 客户端**

```bash
mkdir -p apps/web/src/api apps/web/src/components apps/web/src/pages
```

`apps/web/src/api/client.ts`:
```typescript
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

export interface Project {
  id: string;
  name: string;
  gitlabRepo: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  gitlabRepo: string;
  gitlabToken: string;
}

export const projectsApi = {
  list: () => api.get<Project[]>("/projects").then(r => r.data),
  create: (data: CreateProjectInput) => api.post<Project>("/projects", data).then(r => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export default api;
```

**Step 2: 创建项目列表页面**

`apps/web/src/pages/ProjectsPage.tsx`:
```typescript
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { projectsApi } from "../api/client";
import CreateProjectModal from "../components/CreateProjectModal";

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  if (isLoading) return <div>加载中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">项目管理</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          新建项目
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">项目名称</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">GitLab 仓库</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">创建时间</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projects?.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4">
                  <Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">
                    {project.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{project.gitlabRepo}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(project.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => deleteMutation.mutate(project.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CreateProjectModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["projects"] });
          }}
        />
      )}
    </div>
  );
}
```

**Step 3: 创建新建项目弹窗**

`apps/web/src/components/CreateProjectModal.tsx`:
```typescript
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { projectsApi } from "../api/client";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({ onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    gitlabRepo: "",
    gitlabToken: "",
  });

  const mutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">新建项目</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">项目名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">GitLab 仓库</label>
            <input
              type="text"
              value={formData.gitlabRepo}
              onChange={(e) => setFormData({ ...formData, gitlabRepo: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="group/project-name"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">GitLab Token</label>
            <input
              type="password"
              value={formData.gitlabToken}
              onChange={(e) => setFormData({ ...formData, gitlabToken: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? "创建中..." : "创建"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 4: 提交**

```bash
git add apps/web/src/
git commit -m "feat(web): add projects list and creation page"
```

---

### Task 14: 实现项目详情与规则管理页面

**Files:**
- Create: `apps/web/src/pages/ProjectDetailPage.tsx`
- Create: `apps/web/src/components/CreateRuleModal.tsx`
- Create: `apps/web/src/components/MarkdownEditor.tsx`

**Step 1: 扩展 API 客户端**

修改 `apps/web/src/api/client.ts`，添加规则相关 API:

```typescript
export interface SpecRule {
  id: string;
  projectId: string;
  title: string;
  content: string;
  status: "draft" | "published";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRuleInput {
  projectId: string;
  title: string;
  content: string;
  status: "draft" | "published";
  createdBy: string;
}

export const rulesApi = {
  list: (projectId: string) =>
    api.get<SpecRule[]>("/rules", { params: { projectId } }).then(r => r.data),
  create: (data: CreateRuleInput) => api.post<SpecRule>("/rules", data).then(r => r.data),
  update: (id: string, data: Partial<CreateRuleInput>) =>
    api.put<SpecRule>(`/rules/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/rules/${id}`),
};

export const distributeApi = {
  distribute: (projectId: string, branch: string = "main") =>
    api.post(`/projects/${projectId}/distribute`, { branch }).then(r => r.data),
  list: (projectId: string) =>
    api.get(`/projects/${projectId}/distributions`).then(r => r.data),
};
```

**Step 2: 创建项目详情页面**

`apps/web/src/pages/ProjectDetailPage.tsx`:
```typescript
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi, rulesApi, distributeApi } from "../api/client";
import CreateRuleModal from "../components/CreateRuleModal";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.list().then(p => p.find(x => x.id === id)),
    enabled: !!id,
  });

  const { data: rules } = useQuery({
    queryKey: ["rules", id],
    queryFn: () => rulesApi.list(id!),
    enabled: !!id,
  });

  const { data: distributions } = useQuery({
    queryKey: ["distributions", id],
    queryFn: () => distributeApi.list(id!),
    enabled: !!id,
  });

  const distributeMutation = useMutation({
    mutationFn: () => distributeApi.distribute(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributions", id] });
      alert("分发成功！");
    },
    onError: (error: any) => {
      alert(`分发失败: ${error.response?.data?.error || error.message}`);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (ruleId: string) => rulesApi.update(ruleId, { status: "published" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules", id] }),
  });

  if (!project) return <div>加载中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-gray-600">{project.gitlabRepo}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            新建规则
          </button>
          <button
            onClick={() => distributeMutation.mutate()}
            disabled={distributeMutation.isPending}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {distributeMutation.isPending ? "分发中..." : "生成分发"}
          </button>
        </div>
      </div>

      {/* 规则列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Spec 规则</h2>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">标题</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">创建人</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">更新时间</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rules?.map((rule) => (
              <tr key={rule.id}>
                <td className="px-6 py-4">{rule.title}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    rule.status === "published"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {rule.status === "published" ? "已发布" : "草稿"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{rule.createdBy}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(rule.updatedAt).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  {rule.status === "draft" && (
                    <button
                      onClick={() => publishMutation.mutate(rule.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm mr-2"
                    >
                      发布
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分发历史 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">分发历史</h2>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">时间</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">触发方式</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Commit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {distributions?.map((log: any) => (
              <tr key={log.id}>
                <td className="px-6 py-4 text-sm">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm">{log.triggeredBy}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    log.status === "success"
                      ? "bg-green-100 text-green-800"
                      : log.status === "failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {log.status === "success" ? "成功" : log.status === "failed" ? "失败" : "进行中"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono">
                  {log.gitlabCommitSha ? log.gitlabCommitSha.slice(0, 8) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CreateRuleModal
          projectId={id!}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["rules", id] });
          }}
        />
      )}
    </div>
  );
}
```

**Step 3: 创建新建规则弹窗**

`apps/web/src/components/CreateRuleModal.tsx`:
```typescript
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { rulesApi } from "../api/client";

interface Props {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRuleModal({ projectId, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    status: "draft" as "draft" | "published",
    createdBy: "",
  });

  const mutation = useMutation({
    mutationFn: rulesApi.create,
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ ...formData, projectId });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4">新建规则</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">标题</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">创建人</label>
            <input
              type="text"
              value={formData.createdBy}
              onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="你的名字"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">内容 (Markdown)</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full border rounded px-3 py-2 h-64 font-mono text-sm"
              placeholder="# 规范标题&#10;&#10;规范内容..."
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">状态</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "draft" | "published" })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="draft">草稿</option>
              <option value="published">发布</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? "创建中..." : "创建"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 4: 提交**

```bash
git add apps/web/src/
git commit -m "feat(web): add project detail and rules management"
```

---

### Task 15: 初始化 CLI 项目

**Files:**
- Create: `apps/cli/package.json`
- Create: `apps/cli/tsconfig.json`
- Create: `apps/cli/src/index.ts`
- Create: `apps/cli/src/commands/init.ts`
- Create: `apps/cli/src/utils/git.ts`

**Step 1: 创建 CLI 包**

```bash
mkdir -p apps/cli/src/commands apps/cli/src/utils
```

`apps/cli/package.json`:
```json
{
  "name": "@zhixing/cli",
  "version": "0.1.0",
  "private": true,
  "bin": {
    "zhixing": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc && chmod +x dist/index.js",
    "dev": "tsx src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@zhixing/shared": "workspace:*",
    "axios": "^1.6.0",
    "commander": "^12.0.0",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "@zhixing/typescript-config": "workspace:*",
    "@types/node": "^20.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0"
  }
}
```

**Step 2: 实现 Git 工具函数**

`apps/cli/src/utils/git.ts`:
```typescript
import { execSync } from "child_process";

export function getGitRemoteUrl(): string | null {
  try {
    const remoteUrl = execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
    return remoteUrl;
  } catch {
    return null;
  }
}

export function extractGitLabRepo(remoteUrl: string): string | null {
  // 支持 HTTPS: https://gitlab.company.com/group/project.git
  // 支持 SSH: git@gitlab.company.com:group/project.git
  const httpsMatch = remoteUrl.match(/gitlab[^/]+\/(.*)\.git?$/);
  if (httpsMatch) return httpsMatch[1];

  const sshMatch = remoteUrl.match(/gitlab[^:]+:(.*)\.git?$/);
  if (sshMatch) return sshMatch[1];

  return null;
}

export function getCurrentBranch(): string | null {
  try {
    return execSync("git branch --show-current", { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}
```

**Step 3: 实现 init 命令**

`apps/cli/src/commands/init.ts`:
```typescript
import { writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import axios from "axios";
import chalk from "chalk";
import { getGitRemoteUrl, extractGitLabRepo } from "../utils/git";

const API_BASE_URL = process.env.ZHIXING_API_URL || "http://localhost:3001";

export async function initCommand() {
  console.log(chalk.blue("🚀 初始化知行平台...\n"));

  // 1. 检测 Git 仓库
  const remoteUrl = getGitRemoteUrl();
  if (!remoteUrl) {
    console.error(chalk.red("❌ 未检测到 Git 仓库，请在 Git 仓库目录中运行此命令"));
    process.exit(1);
  }

  const gitlabRepo = extractGitLabRepo(remoteUrl);
  if (!gitlabRepo) {
    console.error(chalk.red("❌ 无法解析 GitLab 仓库地址"));
    process.exit(1);
  }

  console.log(chalk.gray(`📦 检测到 GitLab 仓库: ${gitlabRepo}`));

  // 2. 从平台获取项目信息
  try {
    console.log(chalk.gray("📡 从知行平台拉取 Spec 规则..."));

    // 先获取项目列表，找到匹配的
    const projectsRes = await axios.get(`${API_BASE_URL}/api/projects`);
    const project = projectsRes.data.find((p: any) => p.gitlabRepo === gitlabRepo);

    if (!project) {
      console.error(chalk.red(`❌ 项目 "${gitlabRepo}" 未在知行平台注册`));
      console.log(chalk.gray("请先联系架构师在平台创建项目"));
      process.exit(1);
    }

    console.log(chalk.green(`✓ 找到项目: ${project.name}`));

    // 3. 获取规则列表
    const rulesRes = await axios.get(`${API_BASE_URL}/api/rules`, {
      params: { projectId: project.id },
    });
    const rules = rulesRes.data.filter((r: any) => r.status === "published");

    if (rules.length === 0) {
      console.warn(chalk.yellow("⚠️  该项目暂无已发布的规则"));
      return;
    }

    console.log(chalk.green(`✓ 发现 ${rules.length} 条已发布规则`));

    // 4. 生成 CLAUDE.md
    const claudeMdContent = generateClaudeMd(project.name, rules);
    const claudeMdPath = join(process.cwd(), "CLAUDE.md");

    // 检查本地版本
    let existingContent: string | null = null;
    if (existsSync(claudeMdPath)) {
      existingContent = readFileSync(claudeMdPath, "utf-8");
      console.log(chalk.yellow("⚠️  本地已存在 CLAUDE.md"));
      // TODO: 版本对比提示
    }

    // 5. 写入文件
    writeFileSync(claudeMdPath, claudeMdContent);
    console.log(chalk.green(`✓ 生成 CLAUDE.md`));

    // 6. 完成提示
    console.log(chalk.blue("\n✅ 初始化完成！\n"));
    console.log("下一步:");
    console.log("  1. 检查 CLAUDE.md 内容是否正确");
    console.log("  2. 提交 CLAUDE.md 到 Git 仓库（根据团队约定）");
    console.log("  3. 启动你的 AI 编程工具，享受统一的规范上下文\n");

  } catch (error: any) {
    console.error(chalk.red(`❌ 请求失败: ${error.message}`));
    if (error.response) {
      console.error(chalk.red(`   ${error.response.data?.error || error.response.statusText}`));
    }
    process.exit(1);
  }
}

function generateClaudeMd(projectName: string, rules: any[]): string {
  const ruleSections = rules.map(r =>
    `## ${r.title}\n\n${r.content}\n\n---\n`
  ).join("\n");

  return `# ${projectName} - AI 编程规范

> 本文件由知行平台自动生成，请勿手动修改
> 生成时间: ${new Date().toISOString()}
> 规则数量: ${rules.length}

---

${ruleSections}

*Powered by 知行平台*
`;
}
```

**Step 4: 创建 CLI 入口**

`apps/cli/src/index.ts`:
```typescript
#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init";

const program = new Command();

program
  .name("zhixing")
  .description("知行平台 CLI - AI 编程规范管理")
  .version("0.1.0");

program
  .command("init")
  .description("初始化项目，从知行平台拉取 Spec 规则生成 CLAUDE.md")
  .action(initCommand);

program.parse();
```

**Step 5: TypeScript 配置**

`apps/cli/tsconfig.json`:
```json
{
  "extends": "@zhixing/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 6: 安装依赖并提交**

```bash
pnpm install
git add apps/cli/
git commit -m "feat(cli): add zhixing init command"
```

---

### Task 16: Week 3 总结

**Step 1: 构建所有包**

```bash
pnpm build
```

**Step 2: 类型检查**

```bash
pnpm typecheck
```

**Step 3: Week 3 完成提交**

```bash
git add .
git commit -m "feat: complete week 3 web ui and cli development"
```

---

## Week 4: 集成测试与试点验证

### Task 17: 配置开发环境脚本

**Files:**
- Create: `scripts/init.sh`
- Create: `scripts/podman-compose.yml`
- Create: `.env.example`

**Step 1: 创建 Podman Compose 配置**

```bash
mkdir -p scripts
```

`scripts/podman-compose.yml`:
```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: zhixing-postgres
    environment:
      POSTGRES_USER: zhixing
      POSTGRES_PASSWORD: zhixing
      POSTGRES_DB: zhixing
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Step 2: 创建初始化脚本**

`scripts/init.sh`:
```bash
#!/bin/bash

set -e

echo "🚀 初始化知行平台开发环境..."

# 启动数据库
echo "📦 启动 PostgreSQL..."
cd scripts
podman-compose up -d

# 等待数据库就绪
echo "⏳ 等待数据库就绪..."
sleep 3

# 运行迁移
echo "🔄 运行数据库迁移..."
cd ../packages/db
pnpm migrate

echo "✅ 环境初始化完成！"
echo ""
echo "启动开发服务器:"
echo "  API:   pnpm --filter @zhixing/api dev"
echo "  Web:   pnpm --filter @zhixing/web dev"
```

**Step 3: 使脚本可执行**

```bash
chmod +x scripts/init.sh
```

**Step 4: 创建环境变量模板**

`.env.example`:
```bash
# 数据库
DATABASE_URL=postgres://zhixing:zhixing@localhost:5432/zhixing

# GitLab
GITLAB_BASE_URL=https://gitlab.company.com

# API 服务
PORT=3001

# CLI
ZHIXING_API_URL=http://localhost:3001
```

**Step 5: 提交**

```bash
git add scripts/ .env.example
git commit -m "chore: add development environment scripts"
```

---

### Task 18: 创建端到端测试脚本

**Files:**
- Create: `scripts/e2e-test.sh`

**Step 1: 创建 E2E 测试脚本**

`scripts/e2e-test.sh`:
```bash
#!/bin/bash

set -e

echo "🧪 知行平台 MVP Phase 1 E2E 测试"
echo "=================================="

API_URL="http://localhost:3001"

# 1. 健康检查
echo ""
echo "1. 测试 API 健康检查..."
curl -s ${API_URL}/health | grep -q "ok" && echo "   ✓ API 运行正常" || (echo "   ✗ API 未启动" && exit 1)

# 2. 创建测试项目
echo ""
echo "2. 创建测试项目..."
PROJECT_RESPONSE=$(curl -s -X POST ${API_URL}/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "营销采购系统",
    "gitlabRepo": "marketing-group/marketing-procurement",
    "gitlabToken": "test-token-12345"
  }')
PROJECT_ID=$(echo $PROJECT_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   ✓ 项目创建成功，ID: $PROJECT_ID"

# 3. 创建规则
echo ""
echo "3. 创建测试规则..."
RULE_RESPONSE=$(curl -s -X POST ${API_URL}/api/rules \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"$PROJECT_ID\",
    \"title\": \"Java 异常处理规范\",
    \"content\": \"所有异常必须记录日志，禁止直接吞掉异常。\",
    \"status\": \"published\",
    \"createdBy\": \"架构师\"
  }")
RULE_ID=$(echo $RULE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   ✓ 规则创建成功，ID: $RULE_ID"

# 4. 查询规则列表
echo ""
echo "4. 查询项目规则..."
RULES=$(curl -s "${API_URL}/api/rules?projectId=${PROJECT_ID}")
echo "   ✓ 项目有 $(echo $RULES | grep -o '"id"' | wc -l) 条规则"

# 5. 查询分发历史（应该为空）
echo ""
echo "5. 查询分发历史..."
DISTS=$(curl -s "${API_URL}/api/projects/${PROJECT_ID}/distributions")
echo "   ✓ 分发历史: $(echo $DISTS | grep -o '"id"' | wc -l) 条记录"

echo ""
echo "=================================="
echo "✅ E2E 测试通过！"
echo ""
echo "接下来可以:"
echo "  1. 在 Web UI 中查看项目: http://localhost:3000"
echo "  2. 测试分发功能（需要真实 GitLab Token）"
echo "  3. 测试 CLI: pnpm --filter @zhixing/cli dev init"
```

**Step 2: 使脚本可执行并提交**

```bash
chmod +x scripts/e2e-test.sh
git add scripts/e2e-test.sh
git commit -m "test: add e2e test script"
```

---

### Task 19: 修复问题与优化

**Step 1: 修复类型问题**

检查并修复发现的类型错误：

```bash
pnpm typecheck
```

**Step 2: 添加缺失的依赖**

如果发现依赖缺失，安装它们：

```bash
pnpm add -D @types/node --filter @zhixing/api
```

**Step 3: 测试构建**

```bash
pnpm build
```

**Step 4: 提交修复**

```bash
git add .
git commit -m "fix: resolve type errors and build issues"
```

---

### Task 20: 创建 README 文档

**Files:**
- Modify: `README.md`

**Step 1: 编写项目 README**

```markdown
# 知行平台 (ZhiXing)

> AI 编程规范管理平台 - 让意图即交付，让架构即护栏

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 9+
- Podman (本地开发)
- PostgreSQL 15+

### 开发环境初始化

```bash
# 1. 克隆仓库
git clone <repository>
cd zhixing

# 2. 安装依赖
pnpm install

# 3. 启动开发环境（数据库 + 迁移）
./scripts/init.sh

# 4. 启动 API 服务
cd apps/api
pnpm dev

# 5. 启动 Web 前端（新终端）
cd apps/web
pnpm dev
```

### 运行测试

```bash
# E2E 测试
./scripts/e2e-test.sh
```

### CLI 使用

```bash
# 开发模式运行
cd apps/cli
pnpm dev init

# 或使用构建后的版本
pnpm build
./dist/index.js init
```

## 项目结构

```
zhixing/
├── apps/
│   ├── api/          # Fastify 后端 API
│   ├── web/          # React 管理后台
│   └── cli/          # zhixing CLI
├── packages/
│   ├── db/           # Drizzle ORM + Schema
│   ├── gitlab-client/# GitLab API 封装
│   └── shared/       # 共享类型
└── scripts/          # 开发脚本
```

## MVP Phase 1 功能

- ✅ 项目级 Spec 规则管理（Web UI）
- ✅ 规则草稿/发布状态流转
- ✅ CLAUDE.md 编译与分发
- ✅ 分发状态记录与查询
- ✅ CLI `init` 命令

## 路线图

- Phase 2: 三层规则继承、认知层 MCP、自动分发
- Phase 3: Skill 体系、合规追踪、领域订阅
```

**Step 2: 提交**

```bash
git add README.md
git commit -m "docs: add project readme"
```

---

### Task 21: Week 4 完成与归档

**Step 1: 最终构建验证**

```bash
pnpm build
pnpm typecheck
```

**Step 2: 创建 Git Tag**

```bash
git tag -a v0.1.0-mvp-phase1 -m "MVP Phase 1 完成"
```

**Step 3: 最终提交**

```bash
git add .
git commit -m "chore: final polish for mvp phase 1"
```

---

## 验收检查清单

### 功能验收

- [ ] 架构师能在 Web UI 创建项目
- [ ] 架构师能创建并发布 Spec 规则
- [ ] 架构师能手动触发 CLAUDE.md 分发
- [ ] 开发者运行 `zhixing init` 能生成 CLAUDE.md
- [ ] CLAUDE.md 内容包含平台发布的规则

### 技术验收

- [ ] TypeScript 编译无错误
- [ ] 所有包能正常构建
- [ ] E2E 测试通过
- [ ] 代码已提交到 Git

### 试点验收

- [ ] 营销采购系统项目已接入
- [ ] 已有至少 1 条已发布规则
- [ ] 开发团队确认可用

---

## 紧急回滚方案

如遇到无法修复的问题，可回滚到上一个稳定版本：

```bash
git log --oneline -20          # 查看提交历史
git revert <commit-hash>       # 回滚特定提交
# 或
git reset --hard HEAD~N        # 回滚 N 个提交（谨慎使用）
```

---

*计划生成时间: 2026-02-20*
*执行周期: 4 周*
*试点项目: 营销采购系统*
