---
title: 社区 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: 社区 - Vafast
  - - meta
    - name: 'description'
      content: 加入 Vafast 社区，获取帮助、分享经验、参与讨论和贡献代码。
  - - meta
    - property: 'og:description'
      content: 加入 Vafast 社区，获取帮助、分享经验、参与讨论和贡献代码。
---

# 社区

欢迎加入 Vafast 社区！我们是一个开放、友好的开发者社区，致力于构建高性能的 TypeScript Web 框架。

## 获取帮助

### 常见问题 (FAQ)

在提问之前，请先查看我们的常见问题：

**Q: Vafast 支持哪些运行时？**
A: Vafast 主要针对 Bun 优化，但也支持 Node.js 和任何支持 Web 标准的运行时。

**Q: 如何迁移现有的 Express/Fastify 应用？**
A: 查看我们的 [迁移指南](/migrate) 了解详细的迁移步骤。

**Q: 支持 TypeScript 吗？**
A: 是的！Vafast 完全使用 TypeScript 编写，提供完整的类型安全。

**Q: 性能如何？**
A: Vafast 经过精心优化，在 Bun 运行时上表现优异，支持高并发请求。

### 提问指南

当您需要帮助时，请遵循以下指南：

1. **搜索现有问题** - 在提问前先搜索是否已有类似问题
2. **提供详细信息** - 包括错误信息、代码示例、环境信息等
3. **使用清晰的标题** - 简洁描述问题
4. **包含最小复现示例** - 帮助快速定位问题

### 提问模板

```
## 问题描述
[简要描述您遇到的问题]

## 环境信息
- 运行时: [Bun/Node.js/其他]
- 版本: [具体版本号]
- 操作系统: [OS 信息]

## 代码示例
```typescript
// 您的代码
```

## 错误信息
[完整的错误堆栈]

## 期望行为
[描述您期望的结果]

## 实际行为
[描述实际发生的情况]
```

## 参与讨论

### 社区渠道

#### GitHub Discussions
- **主要讨论平台**: [GitHub Discussions](https://github.com/vafast/vafast/discussions)
- **功能请求**: 分享您的想法和建议
- **使用讨论**: 讨论最佳实践和解决方案
- **公告**: 获取最新更新和重要通知

#### Discord 服务器
- **实时交流**: [Vafast Discord](https://discord.gg/vafast)
- **技术讨论**: 实时技术问答
- **项目展示**: 分享您的项目
- **社区活动**: 参与线上活动

#### 微信群
- **中文社区**: 扫描二维码加入微信群
- **本地化支持**: 中文技术讨论
- **项目合作**: 寻找合作伙伴

### 讨论主题

我们欢迎讨论以下主题：

- **技术问题** - 框架使用、最佳实践、性能优化
- **功能建议** - 新功能提案、改进建议
- **项目展示** - 使用 Vafast 构建的项目
- **教程分享** - 技术文章、视频教程
- **社区活动** - 线下聚会、技术分享会

## 贡献代码

### 贡献指南

我们欢迎所有形式的贡献！无论您是经验丰富的开发者还是初学者，都可以为项目做出贡献。

#### 贡献类型

1. **代码贡献**
   - Bug 修复
   - 新功能开发
   - 性能优化
   - 代码重构

2. **文档贡献**
   - 文档改进
   - 示例代码
   - 翻译工作
   - 教程编写

3. **测试贡献**
   - 单元测试
   - 集成测试
   - 性能测试
   - 测试覆盖率提升

4. **社区贡献**
   - 回答问题
   - 代码审查
   - 项目管理
   - 社区建设

### 开发环境设置

#### 前置要求

```bash
# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 克隆仓库
git clone https://github.com/vafast/vafast.git
cd vafast

# 安装依赖
bun install
```

#### 运行测试

```bash
# 运行所有测试
bun test

# 运行特定测试
bun test --grep "user"

# 运行性能测试
bun run test:perf
```

#### 代码规范

我们使用以下工具确保代码质量：

- **ESLint** - 代码风格检查
- **Prettier** - 代码格式化
- **TypeScript** - 类型检查
- **Husky** - Git hooks

```bash
# 代码检查
bun run lint

# 代码格式化
bun run format

# 类型检查
bun run type-check
```

### 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 添加新功能
fix: 修复 Bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

### 拉取请求流程

1. **Fork 仓库** - 创建您的 Fork
2. **创建分支** - 为您的功能创建新分支
3. **开发功能** - 实现您的功能或修复
4. **运行测试** - 确保所有测试通过
5. **提交代码** - 使用规范的提交信息
6. **创建 PR** - 提交拉取请求
7. **代码审查** - 等待维护者审查
8. **合并代码** - 审查通过后合并

## 项目展示

### 优秀项目

展示使用 Vafast 构建的优秀项目：

#### 个人博客系统
- **项目**: [Vafast Blog](https://github.com/example/vafast-blog)
- **描述**: 基于 Vafast 的现代化博客系统
- **特性**: 支持 Markdown、评论系统、SEO 优化

#### 电商 API
- **项目**: [Vafast Shop](https://github.com/example/vafast-shop)
- **描述**: 完整的电商后端 API
- **特性**: 用户管理、商品管理、订单系统、支付集成

#### 实时聊天应用
- **项目**: [Vafast Chat](https://github.com/example/vafast-chat)
- **描述**: 支持 WebSocket 的实时聊天应用
- **特性**: 实时消息、用户在线状态、群组聊天

### 提交您的项目

如果您有使用 Vafast 构建的项目，欢迎提交展示：

1. 在 [GitHub Discussions](https://github.com/vafast/vafast/discussions) 中创建新帖子
2. 使用 "Show and Tell" 标签
3. 包含项目描述、截图、技术栈等信息
4. 提供项目链接和源代码

## 学习资源

### 官方资源

- **文档**: [docs.vafast.dev](https://docs.vafast.dev)
- **API 参考**: [api.vafast.dev](https://api.vafast.dev)
- **示例代码**: [examples.vafast.dev](https://examples.vafast.dev)
- **性能基准**: [benchmarks.vafast.dev](https://benchmarks.vafast.dev)

### 第三方资源

#### 视频教程
- **Bilibili**: Vafast 入门教程系列
- **YouTube**: Vafast Framework Tutorials
- **腾讯视频**: Vafast 实战开发

#### 博客文章
- **掘金**: Vafast 相关技术文章
- **CSDN**: Vafast 开发经验分享
- **知乎**: Vafast 技术讨论

#### 开源项目
- **GitHub**: 搜索 "vafast" 标签
- **GitLab**: Vafast 相关项目
- **Gitee**: 国内镜像项目

## 社区活动

### 线上活动

#### 技术分享会
- **时间**: 每月最后一个周六
- **主题**: 轮换的技术主题
- **形式**: 线上直播 + 互动讨论
- **报名**: [活动报名链接]

#### 代码审查日
- **时间**: 每周三晚上
- **内容**: 开源代码审查
- **参与**: 提交代码或参与审查
- **奖励**: 优秀贡献者奖励

#### 问答时间
- **时间**: 每周五下午
- **形式**: 在线问答
- **专家**: 框架维护者和社区专家
- **记录**: 问答内容会整理成文档

### 线下活动

#### 技术聚会
- **北京**: 每月一次技术分享
- **上海**: 开发者交流聚会
- **深圳**: 创业公司技术分享
- **其他城市**: 根据需求组织

#### 技术大会
- **Vafast Conf**: 年度技术大会
- **JSConf China**: JavaScript 大会
- **Node.js 开发者大会**: Node.js 生态大会

## 社区规范

### 行为准则

我们致力于创建一个友好、包容的社区环境：

1. **尊重他人** - 尊重所有社区成员
2. **建设性讨论** - 保持积极、建设性的讨论氛围
3. **包容性** - 欢迎不同背景和经验的开发者
4. **专业态度** - 保持专业的技术讨论态度

### 禁止行为

以下行为在社区中是不被允许的：

- 人身攻击或侮辱性言论
- 垃圾信息或广告
- 恶意代码或安全漏洞利用
- 违反法律法规的内容

### 举报机制

如果您遇到不当行为：

1. **私信管理员** - 通过私信联系社区管理员
2. **举报内容** - 使用平台提供的举报功能
3. **邮件举报** - 发送邮件到 [community@vafast.dev](mailto:community@vafast.dev)

## 联系信息

### 官方联系方式

- **邮箱**: [hello@vafast.dev](mailto:hello@vafast.dev)
- **Twitter**: [@vafast_dev](https://twitter.com/vafast_dev)
- **GitHub**: [github.com/vafast](https://github.com/vafast)
- **Discord**: [discord.gg/vafast](https://discord.gg/vafast)

### 社区管理员

- **技术负责人**: [@tech-lead](https://github.com/tech-lead)
- **社区经理**: [@community-manager](https://github.com/community-manager)
- **文档维护者**: [@docs-maintainer](https://github.com/docs-maintainer)

### 反馈渠道

- **功能建议**: [GitHub Issues](https://github.com/vafast/vafast/issues)
- **Bug 报告**: [Bug Report Template](https://github.com/vafast/vafast/issues/new?template=bug_report.md)
- **文档反馈**: [Documentation Issues](https://github.com/vafast/vafast/issues?q=label%3Adocumentation)

## 总结

Vafast 社区是一个充满活力的开发者社区，我们致力于：

- ✅ 提供技术支持和帮助
- ✅ 促进知识分享和交流
- ✅ 鼓励代码贡献和参与
- ✅ 组织技术活动和聚会
- ✅ 维护友好的社区环境

### 加入我们

无论您是经验丰富的开发者还是初学者，我们都欢迎您加入 Vafast 社区！

- **立即加入**: [GitHub Discussions](https://github.com/vafast/vafast/discussions)
- **实时交流**: [Discord 服务器](https://discord.gg/vafast)
- **贡献代码**: [贡献指南](/contributing)
- **学习资源**: [文档中心](/docs)

让我们一起构建更好的 Web 开发体验！🚀
