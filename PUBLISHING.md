# Vafast 文档发布指南

## 概述

本文档描述 `vafast-doc` 文档站点的发布流程。

## 自动部署

文档站点通过 GitHub Actions 自动部署到 GitHub Pages。

### 触发条件

- 推送到 `main` 分支
- 手动触发（workflow_dispatch）

### 部署流程

1. 代码推送到 `main` 分支
2. GitHub Actions 自动运行 `Deploy Docs (GitHub Pages)` 工作流
3. 构建 VitePress 文档
4. 部署到 GitHub Pages

### 访问地址

- **自定义域名**: https://vafast.huyooo.com
- **GitHub Pages**: https://vafast.github.io/vafast-docs/

## 手动发布步骤

### 1. 本地修改并提交

```bash
cd vafast-doc

# 修改文档内容
# ...

# 提交更改
git add .
git commit -m "docs: 更新文档内容"
```

### 2. 创建 PR（仓库启用了分支保护）

```bash
# 创建新分支
git checkout -b docs/update-xxx

# 推送分支
git push -u origin docs/update-xxx

# 创建 PR
gh pr create --title "docs: 更新文档内容" --body "描述更改内容" --base main
```

### 3. 等待 CI 通过并合并

```bash
# 检查 PR 状态
gh pr view <PR_NUMBER> --json state,statusCheckRollup

# 合并 PR（CI 通过后）
gh pr merge <PR_NUMBER> --merge --delete-branch
```

### 4. 验证部署

```bash
# 检查部署状态
gh run list --workflow="Deploy Docs (GitHub Pages)" --limit 1

# 访问网站验证
open https://vafast.huyooo.com
```

## 自定义域名配置

### DNS 配置

在域名注册商处添加 CNAME 记录：

| 类型 | 主机名 | 值 | TTL |
|------|--------|-----|-----|
| CNAME | vafast | vafast.github.io | 3600 |

### GitHub Pages 配置

1. 访问仓库设置：https://github.com/vafast/vafast-docs/settings/pages
2. 在 "Custom domain" 输入：`vafast.huyooo.com`
3. 勾选 "Enforce HTTPS"
4. 保存

### VitePress 配置

自定义域名部署时，`base` 应设置为 `/`：

```typescript
// docs/.vitepress/config.ts
const base = '/'
```

如果使用 GitHub Pages 子路径（无自定义域名），设置为仓库名：

```typescript
const base = '/vafast-docs/'
```

## 故障排除

### 资源路径 404

**问题**: CSS/JS/图片等静态资源加载失败

**解决方案**:
1. 检查 `base` 配置是否正确
2. 确保资源路径使用正确的前缀
3. 对于自定义域名，使用 `base = '/'`
4. 对于子路径部署，使用 `base = '/vafast-docs/'`

### 样式丢失

**问题**: 页面内容正常但无样式

**原因**: `base` 配置与实际部署路径不匹配

**解决方案**:
1. 确认部署方式（自定义域名 vs 子路径）
2. 相应调整 `base` 配置
3. 重新部署

### CI 检查失败

**问题**: PR 无法合并，CI 检查失败

**解决方案**:
1. 查看 CI 日志：https://github.com/vafast/vafast-docs/actions
2. 修复构建错误
3. 重新推送代码

## 相关文件

- `.github/workflows/deploy-pages.yml` - 部署工作流配置
- `.github/workflows/ci.yml` - CI 检查工作流
- `docs/.vitepress/config.ts` - VitePress 配置
- `package.json` - 项目依赖和脚本

## 常用命令

```bash
# 本地开发
bun run dev

# 本地构建
bun run build

# 预览构建结果
bun run preview

# 检查部署状态
gh run list --workflow="Deploy Docs (GitHub Pages)" --limit 5

# 手动触发部署
gh workflow run "Deploy Docs (GitHub Pages)"
```

