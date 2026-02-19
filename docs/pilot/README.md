# 知行平台试点验证指南

本文档指导如何完成知行平台的端到端试点验证。

## 试点目标

验证知行平台的核心能力：
1. Spec 分层编译与分发
2. 认知层代码理解与问答
3. CLI 工具链集成
4. CI 合规扫描

## 试点项目要求

- **类型**: Java 后端项目（Spring Boot）
- **规模**: 中等规模（5-10万行代码）
- **活跃度**: 近期有活跃开发
- **GitLab**: 已托管在 GitLab 上

## 验证步骤

### 10.1 项目接入

#### 1. 选择试点仓库

选择一个满足以下条件的 Java 后端仓库：
- [ ] 使用 Maven 或 Gradle 构建
- [ ] 代码结构清晰（Controller/Service/DAO 分层）
- [ ] 有完整的 README 文档

#### 2. 在平台注册项目

在知行 Web 控制台中：
1. 进入「项目管理」页面
2. 点击「新建项目」
3. 填写项目信息：
   - 项目名称: `pilot-java-service`
   - GitLab 仓库路径: `group/pilot-java-service`
   - 所属领域: `backend`
   - 订阅领域: `backend`, `infrastructure`

#### 3. 本地初始化

```bash
# 克隆试点仓库
git clone https://gitlab.example.com/group/pilot-java-service.git
cd pilot-java-service

# 安装知行 CLI
npm install -g @zhixing/cli

# 初始化项目
zhixing init
```

验证 `CLAUDE.md` 生成：
```bash
ls -la CLAUDE.md
cat CLAUDE.md
```

**预期输出**:
- CLAUDE.md 文件存在
- 包含项目基本信息、分层规则、约束条件

---

### 10.2 代码索引

#### 1. 触发全量索引

在知行 Web 控制台：
1. 进入试点项目详情页
2. 点击「认知层」标签
3. 点击「立即索引」按钮

或通过 API：
```bash
curl -X POST https://api.zhixing.example.com/api/projects/pilot-java-service/index \
  -H "Authorization: Bearer $API_TOKEN"
```

#### 2. 验证索引状态

```bash
# 检查索引状态
curl https://api.zhixing.example.com/api/projects/pilot-java-service/index/status \
  -H "Authorization: Bearer $API_TOKEN"
```

**预期输出**:
```json
{
  "status": "completed",
  "filesIndexed": 150,
  "chunksCreated": 450,
  "lastIndexedAt": "2025-02-19T10:30:00Z"
}
```

#### 3. 验证问答功能

```bash
zhixing ask "用户认证流程是如何实现的？"
```

**预期输出**:
- 返回与认证相关的代码片段
- 包含文件路径和行号
- 回答准确且相关

---

### 10.3 迁移现有 CLAUDE.md

如果试点项目已有本地 `CLAUDE.md`：

#### 1. 分析现有内容

```bash
# 查看现有 CLAUDE.md 结构
cat CLAUDE.md | head -100
```

#### 2. 在平台创建项目级规则

在知行 Web 控制台：
1. 进入「规则管理」→「项目级」
2. 选择试点项目
3. 创建新规则：
   - 从本地 CLAUDE.md 提取关键约束
   - 每条规则创建一个条目

#### 3. 验证分发

修改一条规则后：
1. 观察分发状态页面
2. 确认 `CLAUDE.md` 已更新
3. 本地运行 `zhixing status` 验证一致性

---

### 10.4 录入公司级规则

在平台创建至少 5 条公司级基础规则：

#### 示例规则清单

1. **API 响应格式规范**
   ```markdown
   ## API Response Format

   所有 API 响应必须遵循统一格式：
   ```json
   {
     "code": 200,
     "message": "success",
     "data": { ... }
   }
   ```
   ```

2. **日志规范**
   ```markdown
   ## Logging Standards

   - 使用 SLF4J 日志门面
   - 禁止直接使用 System.out.println
   - 敏感信息必须脱敏
   ```

3. **异常处理规范**
   ```markdown
   ## Exception Handling

   - 业务异常使用 BusinessException
   - 系统异常统一捕获并记录
   - 禁止吞掉异常
   ```

4. **数据库访问规范**
   ```markdown
   ## Database Access

   - 使用 MyBatis-Plus 进行数据库操作
   - SQL 必须写在 XML 中，禁止硬编码
   - 大表查询必须加 limit
   ```

5. **代码注释规范**
   ```markdown
   ## Code Documentation

   - 所有 public 方法必须有 Javadoc
   - 复杂业务逻辑必须添加注释说明
   - 使用 TODO 标记待办事项
   ```

#### 验证三层编译

```bash
# 在试点项目中拉取编译后的规则
zhixing init

# 验证 CLAUDE.md 包含所有三层规则
cat CLAUDE.md
```

---

### 10.5 端到端 Feature 开发

#### 场景：新增用户积分功能

**目标**: 实现一个完整的用户积分查询接口

**流程**:

1. **理解上下文**
   ```bash
   zhixing ask "项目中的积分模块是如何设计的？有哪些相关表和类？"
   ```

2. **查看相关代码**
   ```bash
   zhixing ask "积分的核心计算逻辑在哪里实现？"
   ```

3. **基于规范开发**
   - 参考 CLAUDE.md 中的 API 规范
   - 遵循异常处理规范
   - 添加必要的日志

4. **验证合规性**
   ```bash
   zhixing status
   ```

**成功标准**:
- [ ] 能正确理解现有代码结构
- [ ] 生成的代码符合规范
- [ ] CI 扫描通过

---

### 10.6 CI 合规扫描

#### 1. 配置 GitLab CI

在项目根目录创建 `.gitlab-ci.yml`：

```yaml
stages:
  - compliance

zhixing-compliance:
  stage: compliance
  image: node:20-alpine
  before_script:
    - npm install -g @zhixing/cli
  script:
    - zhixing compliance check
  allow_failure: false
```

#### 2. 提交并触发 Pipeline

```bash
git add .gitlab-ci.yml
git commit -m "ci: add zhixing compliance check"
git push
```

#### 3. 验证扫描结果

在 GitLab CI 页面查看扫描结果：
- [ ] Pipeline 成功执行
- [ ] 无 CLAUDE.md 版本不一致警告
- [ ] 无 override 违规

#### 4. 查看平台上报记录

在知行 Web 控制台：
1. 进入「合规追踪」页面
2. 选择试点项目
3. 验证扫描记录已上报

---

### 10.7 反馈收集

#### Open Questions 实测答案

根据 design.md 中的 Q1-Q4 进行实测：

**Q1: 规则 override 在多少项目发生后需要触发重构？**

实测方法：
1. 在多个试点项目中 override 同一条规则
2. 观察平台标记逻辑
3. 记录触发重构建议的阈值

**实测答案**: __________

**Q2: Embedding 模型选择对检索质量的影响？**

实测方法：
1. 使用不同模型进行索引
2. 对比问答准确率
3. 记录响应延迟

**实测答案**: __________

**Q3: 代码分块粒度如何影响理解效果？**

实测方法：
1. 对比函数级 vs 类级分块
2. 测试复杂查询的召回率

**实测答案**: __________

**Q4: CLAUDE.md 内容过长时如何优化？**

实测方法：
1. 测试不同长度的 CLAUDE.md
2. 观察 AI 工具的使用效果
3. 记录最优长度范围

**实测答案**: __________

#### 开发者反馈模板

请试点开发者填写：

```markdown
## 开发者反馈

### 基本信息
- 角色: [后端开发/前端开发/架构师]
- 使用频率: [每天/每周/偶尔]
- 使用场景: [新功能开发/Code Review/问题排查]

### 功能评价（1-5分）
- zhixing init: ___
- zhixing ask: ___
- 规则分发: ___
- Web 控制台: ___

### 遇到的问题
1.
2.

### 改进建议
1.
2.

### 整体满意度
[非常满意/满意/一般/不满意]
```

---

## 验收标准

试点验证通过的标准：

| 检查项 | 要求 | 状态 |
|--------|------|------|
| 项目接入 | zhixing init 成功执行 | [ ] |
| 代码索引 | 全量索引完成，问答可用 | [ ] |
| 规则录入 | 5+ 条公司级规则 | [ ] |
| 分层编译 | 三层规则正确合并 | [ ] |
| 端到端流程 | 完成一个 feature 开发 | [ ] |
| CI 集成 | 合规扫描通过 | [ ] |
| 反馈收集 | 3+ 开发者反馈 | [ ] |

---

## 附录

### 常见问题

**Q: zhixing init 失败怎么办？**

检查：
1. Git 仓库是否正确初始化
2. API 配置是否正确
3. 项目在平台是否已注册

**Q: 问答返回结果不准确？**

检查：
1. 代码是否已索引
2. 问题是否清晰具体
3. 领域订阅是否正确

**Q: CLAUDE.md 未自动更新？**

检查：
1. 分发任务是否触发
2. GitLab 权限是否配置
3. 查看分发日志

### 相关文档

- [CLI 使用指南](../../apps/cli/README.md)
- [API 文档](../api/README.md)
- [架构设计](../../openspec/changes/zhixing-mvp-architecture/design.md)
