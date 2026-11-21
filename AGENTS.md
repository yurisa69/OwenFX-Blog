# OwenFX 项目统一开发入口

本文件是 OwenFX 仓库级 AI 开发指令入口，适用于 Codex、其他 AI 编程工具及参与本仓库工作的开发者。开始任务前先阅读本文件，并按任务类型加载对应的正式规范和 Skill。

## 1. 规范优先级

1. 用户在当前任务中最新明确提出的要求与授权。
2. 仓库正式规范及安全、数据保护文件。
3. 当前 `main` 分支的实际源码、数据库结构、接口契约、依赖和测试。
4. 对应的专项 Skill。
5. README、历史说明和其他概述性文档。

- 每次开发任务开始前，阅读 `docs/DEVELOPMENT_GUIDELINES.md`。
- 涉及文章写作或文章系统时，阅读 `docs/ARTICLE-WRITING-GUIDELINES.md` 及 `.agents/skills/owenfx-article-system/SKILL.md`。
- 涉及数据库、Supabase、RLS 或迁移时，阅读 `.agents/skills/owenfx-database-security/SKILL.md` 和相关 `supabase/docs/` 正式文件；涉及 R2 媒体上传、对象路径或 CORS 时，还应阅读 `docs/R2-MEDIA.md`。
- README 仅作项目概览和辅助导航。若 README 与当前源码、正式规范或测试不一致，以实际源码和正式规范为准；不得根据过时 README 推断当前功能、目录、接口或依赖。
- 专项 Skill 是任务执行指引，不得替代或覆盖正式规范。发现源码、正式规范和测试之间存在冲突时，先定位证据并说明，不擅自选择会改变用户行为的规则。

## 2. 项目保护原则

- 先棶��q�^