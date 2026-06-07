# Coffli

一个基于 Cloudflare Workers + Vue 3 的轻量级博客平台。

## 技术栈

- **前端**: Vue 3 + TypeScript + Pinia + Vue Router + Vite
- **后端**: Hono (Cloudflare Workers) + TypeScript
- **存储**: Cloudflare D1 (SQLite) + KV + R2
- **国际化**: vue-i18n (中/英)
- **包管理**: pnpm monorepo

## 项目结构

```
coffli/
├── frontend/          # 前端应用 (Vue 3 + Vite)
├── backend/           # 后端 API (Cloudflare Workers)
└── pnpm-workspace.yaml
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 同时启动前后端
pnpm dev

# 或分别启动
pnpm dev:frontend  # 前端 http://localhost:5173
pnpm dev:backend   # 后端 http://localhost:8787
```

## 功能特性

- 用户注册、登录、个人信息管理
- 博客文章浏览与搜索
- 中英文国际化
- 后台管理面板（基于 Basic Auth）
- 维护模式控制

## 部署

```bash
# 部署后端
pnpm -F coffli-backend run deploy

# 构建前端
pnpm -F coffli-frontend run build-only
```