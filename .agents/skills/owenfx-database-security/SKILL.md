---
name: owenfx-database-security
description: OwenFX Supabase、PostgreSQL、RLS、Auth、API 权限、Cloudflare R2 媒体安全、密钥管理、迁移和数据保护规范。处理数据库或安全相关任务时使用。
---

# OwenFX 数据库与安全规范

## 1. 系统职责边界

- GitHub：应用源码、独立 Markdown 文章、SQL migration 与数据库文档。
- Supabase：用户身份认证、用户资料、文章/软件等业务元数据、业务关系和 PostgreSQL 数据。
- Cloudflare R2：图片、GIF、头像、背景、软件图标、视频等媒体二进制；Supabase `media_assets` 保存元数据和引用关系。
- Vercel：网站构建与部署。普通网站部署不得自动执行 SQL migration、重置数据库或修改生产数据。

OwenFX 不在网站或 R2 托管软件安装包。软件条目只保存介绍、官方 HTTPS 下载入口和经审核的外部网盘分享链接。

## 2. 修改前必须检查

涉及数据库、API、身份、媒体或权限时：
1. 确认目标环境和项目，不凭环境变量名称猜测生产/测试环境。
2. 阅读 `supabase/docs/DATABASE_CHANGE_POLICY.md`、`supabase/docs/MIGRATION_HISTORY.md`、`supabase/docs/BACKUP_AND_RECOVERY.md` 和适用的 `supabase/docs/PLATFORM_DEPENDENCIES.md`。
3. 检查当前 schema、相关 migration、表/列/约束/索引/函数/触发器/grants/RLS，以及引用这些对象的 API、组件和测试。
4. 检查数据库生产迁移账本与 `supabase/migration-ledger.json`。不要仅凭本地文件存在就认定迁移已应用。
5. 先判断是否可以只修改应用代码；网站功能调整不应默认引入数据库变更。

## 3. 数据保护原则

- 不擅自删除表、列、记录、用户、评论、文章、软件、下载链接、媒体对象或有效 API。
- 不擅自清空、重建、重置或覆盖生产数据库。
- 删除、数据迁移、权限扩大、不可逆操作必须先说明影响并取得明确授权。
- 已在生产执行的 migration 不得改写、重命名或删除；修正应新增前向 migration。
- 不使用 `CASCADE` 规避依赖审查。
- 历史 SQL 缺失时明确记录缺失；不得按 migration 名称猜写 SQL。
- `supabase/schema/production-baseline.sql` 是结构参考快照，不是可直接执行的生产迁移，也不是完整备份。
- 不把数据库 dump、用户导出、Auth 数据或业务行数据提交到 GitHub。

## 4. RLS、身份与权限

- 对暴露给客户端的业务表，检查 RLS 是否启用，以及每条 SELECT/INSERT/UPDATE/DELETE policy 是否限制到正确用户、管理员或服务端角色。
- 用户归属必须基于服务端验证的当前身份，不信任请求体中传入的 user ID、role、owner ID 或管理员标志。
- 需要管理员权限时，使用仓库现有服务端权限检查函数/模式；不能只隐藏前端按钮。
- `service_role` 只能在可信服务端使用，绝不能使用 `NEXT_PUBLIC_` 前缀或放进浏览器 bundle。
- 服务端 Supabase 客户端与浏览器客户端必须沿用 `lib/supabase/` 现有封装，不能为了绕过 RLS 把管理客户端改成全局共享或客户端可访问。
- SECURITY DEFINER 函数需审查固定 `search_path`、执行权限、输入校验、数据范围和调用者边界。
- 不因页面报错或查询为空而关闭 RLS、扩大匿名权限或公开敏感字段。

## 5. API 与输入安全

- 所有写操作服务端重新验证身份、角色、资源归属和请求参数。
- 对外部输入进行类型、长度、格式、枚举、URL 协议和边界检查；不要直接信任客户端校验。
- 管理 API 必须在服务端鉴权；不能仅依赖路由隐藏、前端状态或 middleware 的单一检查。
- 对登录、评论、导入、上传、同步等敏感操作检查限流、幂等性、重复提交和错误信息泄露。
- 错误响应不返回密钥、SQL、内部堆栈、完整凭据或其他用户数据。
- 变更现有 API 时检查所有调用方和外部集成，保持兼容或提供经过批准的迁移方案。

## 6. R2 上传与媒体访问

依据 `docs/R2-MEDIA.md` 和当前代码实现：
- 上传签名由服务端生成，浏览器只接收短时有效的指定对象上传 URL。
- 对象路径必须绑定经过验证的当前用户 ID；服务端完成登记时再次核对对象归属、实际大小、类型及元数据。
- 不接受任意对象 key 作为授权凭据，不允许用户借此覆盖其他用户文件。
- 服务端密钥仅在服务端使用；不向浏览器返回 R2 Access Key/Secret。
- 媒体元数据的 RLS 必须限制用户只能访问/管理自己的记录，并保留管理员既有权限。
- 不自动删除旧头像、旧图片或对象；先检查文章、评论、软件和资料引用。
- 上传类型、大小限制和 CORS 规则以当前文档与实现为准，不凭记忆放宽。

## 7. 数据库迁移流程

1. 先确认变更确实需要 schema 修改。
2. 使用 Supabase CLI 创建新的时间戳 migration；不要手工编造 14 位时间戳。
3. 每个 migration 只处理一个逻辑变更，优先增量、向前兼容和保留现有数据。
4. 在隔离本地/测试环境验证；不得用生产库试错。
5. 生产执行前明确列出受影响对象、数据影响、依赖、恢复策略并取得必要授权。
6. 生产执行是独立、明确的数据库操作，不与网站源码推送混为一谈。
7. 执行后核对生产 migration ledger、结构、RLS、权限和相关业务查询。
8. 更新 migration ledger 快照、baseline 和历史文档时必须基于已验证的生产状态。
9. 修改 migration 文件后运行 `npm run check:supabase-migrations`。
10. Vercel build、deployment hook 和 Next.js 启动不得运行 migration。

当前生产环境及套餐/备份能力可能变化。任何涉及备份可用性、付费计划或恢复能力的判断，都应重新核实；不得擅自启用付费服务或产生费用。

## 8. 密钥与日志

- 真实密钥、Token、私钥、数据库 URL、用户隐私和备份数据不得进入源码、GitHub、Issue、截图或公开日志。
- 公开变量仅限真正可公开的信息；所有服务端凭据保持服务端私密。
- 如果发现密钥已暴露，停止继续传播，说明影响并建议通过对应服务轮换；不能只删除文件就声称风险消失。
- 示例凭据必须虚构且明显标注为示例。
- 日志只记录排障所需的最少信息，避免记录 Authorization header、Cookie、签名 URL 和完整个人数据。

## 9. 验证与报告

检查 schema/migration、RLS、角色授权、API 身份校验、输入验证、R2 归属、密钥暴露、日志和相关测试。报告必须区分已验证、未验证、无法访问和待授权事项。不得声称数据库安全或备份完整，除非范围和证据足以支持。
