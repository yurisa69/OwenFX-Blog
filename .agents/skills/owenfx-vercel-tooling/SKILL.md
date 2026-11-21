---
name: owenfx-vercel-tooling
description: OwenFX Vercel 工具使用规范，涵盖临时 Sandbox 隔离验证与彻底清理、Speed Insights 性能监测、Web Analytics 流量分析及 Vercel Toolbar 前端诊断。
---

# OwenFX Vercel 工具使用规范

本 Skill 用于决定何时使用 Vercel 工具、如何执行、如何验收以及结束后如何清理。遵循仓库根目录 AGENTS.md 和 docs/DEVELOPMENT_GUIDELINES.md；不得覆盖用户最新明确要求。

## 1. 总体原则

- 只在工具能实质改善任务质量时使用，不为使用工具而使用工具。
- 不把 Vercel 平台工具当成 GitHub 源码仓库、Supabase 数据库或 Cloudflare R2 的替代品。
- 不擅自创建 Preview Deployment、触发额外部署、购买资源、升级套餐或扩大权限。
- Hobby 额度不足、平台报错或可能产生费用时立即暂停，不重复试错。
- 工具结果、平台设置和网站运行状态分别核实；不能把代码接入等同于平台启用，也不能把部署 READY 等同于网站功能正常。

## 2. Vercel Sandbox：隔离开发与验证

### 2.1 何时创建

以下情况优先使用全新 Sandbox：
- 需要安装依赖、运行 lint、TypeScript、测试或 Next.js build。
- 需要验证 AI 生成或拟议的源码修改。
- 需要检查 Next.js、Node.js、依赖升级或构建环境兼容性。
- 需要在不污染正式工作区的情况下复现构建或运行问题。

以下情况通常不需要创建：
- 纶��q�^