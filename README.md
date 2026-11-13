# OwenFX

**OwenFX 是一个以软件发现、软件介绍和技术文章为核心的内容分享站。**  
网站通过软件官方图标卡片展示精选应用，用户可以进入软件详情页阅读介绍，并跳转至软件官方渠道或站长整理的第三方网盘链接。文章系统用于发布软件评测、使用教程、技术经验和其他原创内容。

> 本站不托管、不分发软件安装包。软件详情页只保存软件资料及外部下载入口；文件实际下载由软件官方或对应网盘服务提供。

## 项目概览

| 项目 | 当前配置 |
| --- | --- |
| Web 框架 | Next.js 16.4.6（App Router） |
| 开发语言 | TypeScript 6.0.3 |
| UI | React 19.3.1 + Tailwind CSS 4.3.5 |
| 用户认证 / 数据库 | Supabase |
| 对象存储 | Cloudflare R2（S3 兼容 API） |
| 邮件发送 | Supabase Auth 邮件模板 |
| 部署 | Vercel |
| 代码仓库 | [yurisa69/OwenFX-Blog](https://github.com/yurisa69/OwenFX-Blog) |

## 功能说明

以下内容以仓库当前源码为准。依赖 Supabase、R2 或数据库结构的功能，只有完成对应服务配置后才能正常使用。

### 网站前台

- 首页轮播与精选内容区域。
- 精选软件展示，点击软件卡片进入对应详情页。
- 文章列表、文章详情与分类内容展示。
- 软件详情页展示介绍、版本、平台、图标 / 图片及外部下载入口。
- 深色 / 浅色主题切换。
- 桌面导航与移动端底部导航。
- 页面访问及下载相关事件统计接口。

### 文章管理

- 管理后台提供文章列表、新建和编辑入口。
- 支持文章草稿与发布状态。
- 文章正文以独立 Markdown 文件保存在 GitHub 的 `content/articles/`，Supabase 只保存文章元数据与 GitHub 版本索引。
- 后台提供 Markdown / 富文本双模式编辑器，两种模式共用同一份 Markdown 正文。
- 支持文章摘要、标题、Slug、发布时间等内容字段。
- 文章创建、编辑和发布接口会校验内容管理权限。

### 软件库管理

- 独立维护软件资料，不把软件列表当作网盘文件列表。
- 软件资料包含名称、英文 Slug、开发者、版本、平台、图标、介绍和截图等字段。
- 支持设置首页精选及精选排序。
- 每个软件可配置官方 HTTPS 下载入口，以及百度网盘、夸克网盘、阿里云盘、天翼云盘、123 云盘等外部分享链接。
- 支持软件草稿、发布和撤回。
- 已登录用户可对失效网盘链接提交原因和补充说明；每个账号每小时最多 5 条。
- 管理后台提供独立的网盘失效反馈审核入口，可标记已查看、已修复或忽略；不会自动修改下载链接。
- 支持为文章和软件详情分别配置赞赏方式。
- 软件安装包由官方或外部网盘托管，OwenFX 不负责保存安装包。

### 头像首屏加载与资料同步

为减少用户打开网站或进入个人中心时头像短暂空白、占位符闪烁的问题，当前头像采用**服务端优先读取数据库资料，客户端后台同步**的策略。

1. **服务端首屏读取**：用户请求页面时，`app/layout.tsx` 通过 Supabase Auth 验证当前登录用户。仅对已登录用户查询 `profiles` 表中的 `avatar_url` 和 `display_name` 两个必要字段，并将结果作为初始用户资料传给全局 Navbar。
2. **数据优先级**：优先使用 `profiles.avatar_url` 和 `profiles.display_name`；数据库记录不存在或查询失败时，回退到 Session 的 User Metadata（头像字段兼容 `avatar_url` / `picture`，昵称字段兼容 `display_name` / `name`），最后才使用邮件地址前缀或通用昵称。
3. **图片直接渲染**：`components/Avatar.tsx` 在拿到有效头像 URL 后直接渲染图片，不等待图片加载事件或 `decode()` 完成，也不使用昵称首字母遮挡正在加载的图片。只有头像地址缺失或图片请求失败时，才显示昵称首字母占位。
4. **客户端后台同步**：Navbar 在客户端继续同步 Session 与 Supabase 用户资料，更新资料面板状态并预加载头像；异步更新需检查组件生命周期和用户 ID，避免卸载后更新或将其他账号的资料写入当前用户状态。
5. **性能与边界**：为了让数据库头像进入服务端首屏，已登录用户的页面请求会增加一次只查询必要字段的 Supabase 资料读取；未登录用户不执行该查询。不要把用户资料查询改成跨用户共享缓存，以免发生资料串用。头像 URL 已在首屏 HTML 中提供，并不代表图片文件本身无需网络加载；图片下载速度仍取决于头像源站和网络状况。

相关实现位置：

- `app/layout.tsx`：读取 Session、查询最小化用户资料并生成首屏初始用户数据。
- `components/Navbar.tsx`：接收初始用户资料，并在客户端后台同步最新资料。
- `components/Avatar.tsx`：统一处理头像 URL、图片展示及缺失 / 加载失败占位。
### 管理与安全

- Next.js 16 使用根目录 `proxy.ts` 与 Supabase SSR 客户端刷新登录会话；服务端身份读取使用经过验证的 Auth 用户信息。
- 管理接口会检查登录状态及站长 / 内容编辑权限。
- 评论系统使用 Akismet 与本地规则自动识别垃圾评论；后台支持垃圾评论、软删除、恢复和永久删除。
- 头像和管理端图片上传通过服务器端接口写入 Cloudflare R2，并将媒体元数据写入 `media_assets`。
- ChatGPT 等外部工具可通过受控 API 设备令牌导入文章草稿；令牌可在「管理后台 → AI 导入」创建和撤销。
- 图片上传限制为 JPG、PNG、WebP、GIF、AVIF，单张不超过 10 MB。
- 注册确认邮件及其他认证邮件统一由 Supabase Auth 根据 Authentication → Email Templates 中的六种模板发送。
- Supabase Service Role 和 R2 密钥只允许放在服务端环境变量中。

### SEO 与内容订阅

- 全站配置站点基础 URL、Open Graph 与 Twitter 默认元数据。
- `/robots.txt` 排除管理后台、API、认证和个人设置页面。
- `/sitemap.xml` 根据已发布文章和软件详情生成站点地图。
- `/rss.xml` 输出最近 50 篇已发布文章；RSS 不包含草稿或未到发布时间的文章。

正式部署时建议在 Vercel 的 `NEXT_PUBLIC_SITE_URL` 中填写网站实际 HTTPS 域名；未配置时使用项目默认域名 `https://owenfx-blog.vercel.app`。

## 技术架构

```text
访客 / 管理员
      |
      v
Next.js App Router（Vercel）
      |
      +---- Supabase Auth
      |       用户登录、会话与权限校验
      |
      +---- Supabase Database
      |       文章元数据、GitHub 版本索引、软件、网盘链接、赞赏配置、统计等业务数据
      |
      +---- Cloudflare R2
      |       文章封面、正文图片、头像及其他媒体文件
      |
      +---- Supabase Auth Email
              注册确认、邀请、魔法链接、邮件地址变更、密码重置与重新认证邮件
```

- **Vercel**：运行 Next.js 网站和服务端 API。
- **Supabase**：提供身份认证、文章 / 软件等业务元数据、文章修订索引、API 设备授权和权限相关能力；不保存新文章正文。
- **GitHub**：保存文章 Markdown 正文文件，默认路径为 `content/articles/{slug}.md`。
- **Cloudflare R2**：通过 S3 兼容接口保存文章图片、封面、头像和其他媒体对象；Supabase `media_assets` 仅保存文件元数据和 R2 对象引用。
- **Supabase Auth Email**：统一发送注册确认、邀请、魔法链接、邮件地址变更、密码重置和重新认证邮件；邮件主题与正文由 Supabase Auth Email Templates 管理。

## 目录结构

仓库当前实际使用的主要目录如下：

```text
.
├── app/                    # 当前 Next.js App Router 页面与 API
│   ├── admin/              # 管理后台
│   ├── api/                # 服务端 API
│   ├── articles/           # 文章页面
│   ├── software/           # 软件列表与详情
│   └── layout.tsx          # 全局布局
├── components/             # 页面与交互组件
├── supabase/               # Supabase CLI 配置、迁移、结构快照与数据库文档
│   ├── migrations/         # 增量 SQL 迁移
│   ├── schema/             # 生产结构参考快照（不可直接对生产执行）
│   └── docs/               # 迁移历史、数据库变更规范和备份恢复手册
├── content/articles/       # GitHub 管理的 Markdown 正文文件
├── docs/openapi/           # 外部文章导入 API Schema
├── lib/                    # Supabase、GitHub Markdown、R2、权限和业务工具
├── public/                 # 静态资源
├── .env.example            # 环境变量模板
├── .nvmrc                  # Node.js 主版本（24）
├── next.config.ts
├── package.json
└── tsconfig.json
```

> 当前项目使用仓库根目录的 `app/`、`components/` 和 `lib/` 作为源码目录，`tsconfig.json` 明确排除了 `src/`。旧版占位路由已保留为兼容重定向入口。

## 环境变量配置

先复制模板：

```bash
cp .env.example .env.local
```

然后根据下表填写真实服务配置。下方所有示例值均为**虚构演示值**，不能用于连接真实服务；不要把示例值当成真实密钥提交或部署。

### Supabase

| 变量 | 是否需要 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 必填 | Supabase 项目 URL，浏览器和服务端 Supabase 客户端都会使用。 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 必填 | Supabase 客户端使用的公开 API Key；数据库访问仍必须由 RLS / 权限策略保护。 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端必填 | 服务端管理客户端用于需要管理员权限的后台操作。绝不能添加 `NEXT_PUBLIC_` 前缀。 |

演示格式（非真实项目、非有效密钥）：

- `NEXT_PUBLIC_SUPABASE_URL`：<code><font color="#f85149">"</font>https://example-project-ref.supabase.co<font color="#f85149">"</font></code>
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：<code><font color="#f85149">"</font>DEMO_ONLY_REPLACE_WITH_REAL_SUPABASE_ANON_KEY<font color="#f85149">"</font></code>
- `SUPABASE_SERVICE_ROLE_KEY`：<code><font color="#f85149">"</font>DEMO_ONLY_REPLACE_WITH_REAL_SERVICE_ROLE_KEY<font color="#f85149">"</font></code>

### GitHub Markdown 文章存储

- 正文文件位于 `content/articles/{slug}.md`，由 GitHub 仓库管理。
- Supabase `articles` 保存标题、摘要、Slug、分类、状态、作者、发布时间和 GitHub 文件路径 / Commit SHA / 内容哈希等元数据。
- Supabase `article_revisions` 保存 GitHub Commit SHA、文件路径和内容哈希，不复制 Markdown 正文。
- 文章编辑器保存时先提交 Markdown 文件到 GitHub，再同步 Supabase 元数据。
- 正式环境需要配置服务端 `GITHUB_TOKEN`，建议使用仅对本仓库授予 Contents Read and write 权限的 Fine-grained Personal Access Token。
- `GITHUB_REPOSITORY` 默认是 `yurisa69/OwenFX-Blog`，`GITHUB_BRANCH` 默认是 `main`。文章内容提交到 main 会按现有 Git 集成触发 Vercel 部署。

| 变量 | 是否需要 | 用途 |
| --- | --- | --- |
| `GITHUB_TOKEN` | 必填 | 服务端 GitHub Token，必须具有目标仓库 Contents: Read and write 权限。 |
| `GITHUB_REPOSITORY` | 建议填写 | GitHub 仓库，格式为 `owner/repository`。 |
| `GITHUB_BRANCH` | 建议填写 | 文章提交分支，当前使用 `main`。 |

配置步骤：

1. 在 GitHub 的 Settings → Developer settings → Fine-grained personal access tokens 中创建令牌。
2. Repository access 只选择 `yurisa69/OwenFX-Blog`。
3. Repository permissions 只需给 Contents 设为 Read and write；Metadata 保持只读默认权限。
4. 将令牌添加到 Vercel 项目 `owenfx-blog` 的 Environment Variables，变量名为 `GITHUB_TOKEN`，至少选择 Production；如需 Preview / Development 编辑，也分别勾选对应环境。
5. 保存后重新部署 Vercel。令牌不要发送到聊天，也不要写入 `.env.example` 或 GitHub 源码。

演示格式（非真实 Token）：

- `GITHUB_TOKEN`：<code><font color="#f85149">"</font>github_pat_DEMO_ONLY_REPLACE_WITH_REAL_TOKEN<font color="#f85149">"</font></code>
- `GITHUB_REPOSITORY`：<code><font color="#f85149">"</font>yurisa69/OwenFX-Blog<font color="#f85149">"</font></code>
- `GITHUB_BRANCH`：<code><font color="#f85149">"</font>main<font color="#f85149">"</font></code>

### ChatGPT / AI 文章导入

1. 进入 OwenFX 管理后台的「AI 导入」页面，创建一个仅具有 `articles:import` 权限的 API 设备令牌。
2. 创建后立即复制令牌；数据库只保存 SHA-256 哈希，页面不会再次显示明文。
3. 在支持 OpenAPI / Bearer Token 的 ChatGPT 外部连接器中导入 `docs/openapi/owenfx-article-import.yaml`，将服务器地址替换为 OwenFX 正式域名，并配置该令牌。
4. 调用 `POST /api/integrations/v1/articles/import`，传入标题、Slug、摘要、Markdown 正文、已有分类 / 标签 Slug 和唯一 `request_id`。
5. API 将正文提交至 GitHub，Supabase 创建草稿元数据和版本索引，并返回后台编辑地址。
6. 导入只会创建草稿；管理员进入编辑器检查后，才可保存或正式发布。重复请求必须复用相同 `request_id`。

API 设备可在「AI 导入」页面撤销。接口要求 Bearer Token，并检查设备状态、有效期和 `articles:import` 权限。不要把授权令牌提交到 GitHub 或放进前端代码。

### 反垃圾评论与评论管理

评论提交由 Next.js 服务端 API 统一处理，浏览器端不再直接写入评论表。

- **Akismet**：通过官方 `comment-check` API 判断评论是否为垃圾内容；服务端先验证 API Key，再发送评论检测请求。
- **本地规则**：识别隐藏 honeypot 字段、过多外链、危险 HTML / 脚本标记、明确广告引流模式及短时间重复评论。
- **自动处理**：Akismet 判定正常且未命中本地复核规则的评论自动通过；垃圾评论进入「垃圾评论」；检测服务不可用或结果不确定时进入「待审核」，不会因此误放行。
- **频率限制**：同一登录用户每 10 分钟最多提交 5 条评论；超出部分进入垃圾评论队列。站长 / 管理员评论保留自动通过行为。
- **后台管理**：支持全部、待审核、已通过、已拒绝、垃圾评论、已删除六种分类；提供通过、拒绝、标记垃圾、软删除、恢复和永久删除。
- **Akismet 误判反馈**：管理员恢复被 Akismet 判定为垃圾的评论时，会向 Akismet 提交 ham 反馈；标记垃圾时会提交 spam 反馈。相关检测上下文仅保存在受限的服务端表中，不向普通用户开放。
- **隐私边界**：为进行垃圾检测，服务端会向 Akismet 发送评论正文、作者昵称 / 邮箱、提交者 IP、浏览器 User-Agent、来源页和文章永久链接。Akismet API Key 只保存在服务端环境变量中，不得使用 `NEXT_PUBLIC_` 前缀。

环境变量：

| 变量 | 是否需要 | 用途 |
| --- | --- | --- |
| `AKISMET_API_KEY` | 建议配置 | Akismet 服务端 API Key。未配置或服务异常时，普通评论自动进入待审核，不会直接公开。 |

在 Vercel 项目 `owenfx-blog` 的 Environment Variables 中添加 `AKISMET_API_KEY`，至少选择 Production；本地开发则填写在未提交的 `.env.local`。修改后重新部署。不要将真实 Key 写入 GitHub、README、聊天记录或客户端代码。

演示格式（虚构值）：

- `AKISMET_API_KEY`：<code><font color="#f85149">"</font>DEMO_ONLY_REPLACE_WITH_REAL_AKISMET_KEY<font color="#f85149">"</font></code>

### Cloudflare R2

| 变量 | 是否需要 | 用途 |
| --- | --- | --- |
| `R2_ACCOUNT_ID` | 模板中提供 | Cloudflare 账户 ID，可用于拼接 R2 S3 API Endpoint；当前上传代码直接读取的是 `R2_ENDPOINT`。 |
| `R2_ENDPOINT` | 必填 | R2 S3 API Endpoint，格式为 `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`。 |
| `R2_BUCKET_NAME` | 必填 | R2 存储桶名称。 |
| `R2_ACCESS_KEY_ID` | 必填 | R2 S3 API 访问密钥 ID。 |
| `R2_SECRET_ACCESS_KEY` | 必填 | R2 S3 API Secret Access Key。 |
| `R2_PUBLIC_BASE_URL` | 必填 | 存储桶图片的公开访问域名 / 自定义域名，不要在末尾添加斜杠。 |

演示格式（非真实账户或密钥）：

- `R2_ACCOUNT_ID`：<code><font color="#f85149">"</font>00000000000000000000000000000000<font color="#f85149">"</font></code>
- `R2_ENDPOINT`：<code><font color="#f85149">"</font>https://00000000000000000000000000000000.r2.cloudflarestorage.com<font color="#f85149">"</font></code>
- `R2_BUCKET_NAME`：<code><font color="#f85149">"</font>owenfx-demo-bucket<font color="#f85149">"</font></code>
- `R2_ACCESS_KEY_ID`：<code><font color="#f85149">"</font>DEMO_ONLY_R2_ACCESS_KEY_ID<font color="#f85149">"</font></code>
- `R2_SECRET_ACCESS_KEY`：<code><font color="#f85149">"</font>DEMO_ONLY_R2_SECRET_ACCESS_KEY<font color="#f85149">"</font></code>
- `R2_PUBLIC_BASE_URL`：<code><font color="#f85149">"</font>https://images.example.com<font color="#f85149">"</font></code>

### 站点配置

| 变量 | 是否需要 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 建议填写 | 站点公开访问地址。本地开发使用 localhost，部署后填写正式网站域名。 |

- 本地：`http://localhost:3000`
- 生产环境：填写自己的 HTTPS 域名，例如 <code><font color="#f85149">"</font>https://www.example.com<font color="#f85149">"</font></code>。

### 环境变量安全规则

1. `NEXT_PUBLIC_` 前缀表示变量可能被打包到浏览器端，只能放公开信息。
2. `SUPABASE_SERVICE_ROLE_KEY`、`GITHUB_TOKEN`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、 必须保持服务端私密。
3. 不要把真实的 `.env.local` 上传到 GitHub，也不要把真实密钥写进 README、源码、截图或 Issue。
4. 如果密钥曾经提交到公开仓库，应立即在对应服务控制台轮换，而不是只删除 GitHub 文件。
5. Vercel 中应分别为 Development、Preview、Production 配置对应环境变量；修改变量后需要重新部署才能让新部署读取新值。

## 本地开发

### 环境要求

- Node.js：使用 Node.js 24.x；仓库根目录的 `.nvmrc` 指定主版本 `24`。
- npm：使用随 Node.js 安装的 npm，并通过 `package-lock.json` 锁定依赖版本。
- Git：用于克隆和同步仓库。

### 启动项目

```bash
git clone https://github.com/yurisa69/OwenFX-Blog.git
cd OwenFX-Blog

cp .env.example .env.local
npm ci
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

常用命令：

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器。 |
| `npm run build` | 执行 Next.js 生产构建。 |
| `npm run start` | 启动生产构建后的服务。 |
| `npm run lint` | 执行 ESLint 检查。 |

## Supabase 数据库与迁移管理

Supabase 负责 OwenFX 的身份认证、用户资料和业务数据。当前 `public` schema 包含用户资料、文章、分类、标签、评论、文章互动、文章修订、软件目录、软件网盘下载链接、网盘失效反馈、媒体元数据、站点设置、赞赏配置、审计日志和统计事件等业务对象。独立旧网盘资源模块已清理；不要重新引入 `cloud_resources`、`cloud_resource_links` 或 `resource_click` 业务逻辑。软件网盘下载入口继续使用 `software_download_links`。

### 数据库文件说明

| 路径 | 用途 | 使用规则 |
| --- | --- | --- |
| `supabase/config.toml` | Supabase CLI 项目配置 | 不存放密钥；执行 CLI 操作前确认链接的是正确项目。 |
| `supabase/migrations/` | 按时间戳排序的增量 SQL 变更 | 新数据库变更只新增迁移文件，不改写已在生产执行的迁移。 |
| `supabase/schema/production-baseline.sql` | 2026-11-10 生产 `public` schema 结构参考快照 | 不包含业务数据；不是完整 Supabase 备份；严禁直接对生产执行。 |
| `supabase/docs/MIGRATION_HISTORY.md` | 生产迁移账本与仓库文件差异 | 历史原始 SQL 缺失时如实记录，不猜测、不伪造。 |
| `supabase/docs/DATABASE_CHANGE_POLICY.md` | 数据库变更、安全和验证规则 | 数据库操作以该文件为准。 |
| `supabase/docs/BACKUP_AND_RECOVERY.md` | Supabase 备份能力边界、免费套餐备份流程和恢复清单 | 当前 Free 套餐不具备 Supabase 每日物理备份；按手册执行异地逻辑备份。 |

### 数据库备份与恢复边界

当前生产 Supabase 组织为 **Free 套餐**。Supabase 官方每日自动数据库备份不适用于当前套餐；官方 CLI `supabase db dump` 也会排除 `auth`、`storage` 和扩展管理的 Schema，不能单独作为完整 Supabase 项目备份。`supabase/schema/production-baseline.sql` 仍然只是 `public` 结构参考快照。

免费套餐下的备份与恢复范围、Auth 用户限制、当前项目触发器 / 扩展清单、CLI 导出流程及恢复核对步骤，统一见 [`supabase/docs/BACKUP_AND_RECOVERY.md`](supabase/docs/BACKUP_AND_RECOVERY.md)。备份文件必须保存在加密的异地位置，不得提交到 GitHub；网站部署不得自动执行备份或数据库恢复。

### 使用电脑或 VPS 导出 / 检查数据库

电脑和 VPS 都可以作为数据库备份操作环境。两种环境均需要安装 **Docker** 和 **Supabase CLI**，并确保 Docker 服务正常运行。当前 VPS 已具备 Docker 和 Supabase CLI 环境，不需要重复安装。选择可信任、磁盘空间充足且访问权限受控的环境即可。

无论在电脑还是 VPS 上执行，官方 Supabase CLI 的数据库导出流程和备份范围相同。导出的文件应保存在独立的备份目录中，并加密后存放到生产 Supabase 项目和生产 VPS 之外的位置。**电脑适合保存长期异地备份；VPS 可用于执行备份或检查已有归档，但不要把 VPS 本机作为唯一备份位置。**

#### 方式 A：在电脑上使用 Supabase CLI 导出

适用于 Windows、macOS 或 Linux 工作站。准备 Docker 和 Supabase CLI，并从 Supabase Dashboard → Connect 获取数据库连接字符串，在本机安全地设置为环境变量 `SUPABASE_DB_URL`。连接字符串包含数据库凭据，不要写入脚本、README、聊天记录或 GitHub。

在本机创建仅当前用户可访问的备份目录，并在该目录执行：

```bash
mkdir -p ./owenfx-backup
chmod 700 ./owenfx-backup
supabase db dump --db-url "$SUPABASE_DB_URL" -f ./owenfx-backup/roles.sql --role-only
supabase db dump --db-url "$SUPABASE_DB_URL" -f ./owenfx-backup/schema.sql
supabase db dump --db-url "$SUPABASE_DB_URL" -f ./owenfx-backup/data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
```

检查导出文件是否存在且非空，记录导出时间、项目 Ref、PostgreSQL 版本、文件大小和 SHA-256。随后将备份加密并保存到独立于 Supabase 和生产 VPS 的安全位置。

#### 方式 B：在 VPS 上使用 Supabase CLI 备份或检查归档

VPS 已安装 Docker 和 Supabase CLI，可以承担与电脑相同的官方 CLI 逻辑备份工作。操作前确认连接的是 OwenFX 正确的生产项目，并遵守与电脑端相同的凭据保护、文件权限、校验和异地保存要求。

VPS 也可用于检查已有的 PostgreSQL custom-format 归档，以及从归档中恢复迁移历史。**本次迁移文件恢复使用的是此前已经存在的数据库备份归档**；恢复过程不是重新连接生产数据库逐条导出迁移 SQL，也不是重新执行历史迁移。

#### 迁移文件恢复

当 GitHub 仓库缺少历史迁移文件，而已有数据库备份归档中保留了 Supabase 迁移账本时，可以从归档中提取 `supabase_migrations.schema_migrations` 的迁移记录，再从记录的 `statements` 字段恢复对应的历史 SQL 文本。

恢复流程应包括：

1. 检查备份归档是否可读取，并确认其中包含迁移账本。
2. 从归档中提取迁移账本数据，保留原始备份，不直接修改归档。
3. 按迁移版本和名称解析账本中的 SQL 文本，恢复为独立的迁移 SQL 文件。
4. 为恢复档案生成校验清单，记录迁移版本、名称、文件大小和 SHA-256。
5. 对恢复文件计算 SHA-256，并与校验清单逐项比对；文件传输到电脑后，再次校验以确认传输完整性。
6. 将恢复的历史迁移文件与 GitHub 当前的 `supabase/migrations/` 逐项比对，确认没有覆盖或重复后，才决定是否补回仓库。

恢复出的历史 SQL 仅用于补齐和核对迁移历史，**不得在现有生产数据库中重新执行**。校验清单 `manifest.json` 是恢复档案的完整性记录，不是迁移文件，不应放入 `supabase/migrations/`。

**备份范围边界：** 官方 `supabase db dump` 是逻辑导出，不是物理快照，也不是完整 Supabase 项目备份。它不包含 Supabase 托管的 `auth`、`storage` 等 Schema，也不包含 R2 对象和所有 Dashboard 配置。PostgreSQL custom-format 归档可用于检查归档目录和提取指定数据；不得仅凭归档可读取就认定它是可直接恢复整个 Supabase 项目的完整备份。恢复演练必须在隔离项目或测试环境中进行。

#### 两种方式的共同安全要求

- 电脑和 VPS 都应使用专用、权限受限的备份目录；备份文件不得放在网站公开目录。
- 数据库密码、Supabase Access Token、Service Role Key 和连接字符串不得写入命令历史、源码或 README。
- 不要为了方便下载而开放整个备份目录；只对明确需要下载的临时副本授予最小读取权限，下载后及时清理临时副本。
- 逻辑备份、custom-format 归档、迁移历史 SQL、Auth 用户清单、R2 对象和平台配置是不同的备份对象，不能互相替代。
- 任何恢复演练都必须使用新的隔离项目或测试环境。不得在生产项目中试恢复、重放历史迁移或执行 `supabase db reset`。

### 数据库与网站部署相互独立

- 普通页面、样式、组件和 API 代码更新：只提交网站源码，由 GitHub → Vercel 自动部署，不执行数据库迁移。
- 数据库结构变更：先检查现有表结构、代码引用、外键、索引、函数、触发器、授权和 RLS；再创建独立 SQL migration，审核后单独执行。
- Vercel Build、Deployment Hook 和应用启动过程不得自动执行 SQL migration。
- 数据库变更完成后，先验证生产结构、迁移账本、RLS 和相关业务查询，再部署依赖新结构的网站代码。

### 新增数据库迁移的标准流程

1. **检查**：确认目标 Supabase 项目、当前生产结构、迁移账本和相关应用代码；先确认变更是否真的需要数据库改动。
2. **创建**：使用 Supabase CLI 创建新的时间戳迁移文件：

   ```bash
   supabase migration new add_example_feature
   ```

3. **编写与审核**：只处理一个逻辑变更；检查 SQL 是否保留现有数据、是否影响外键 / 索引 / RLS / 权限；删除表、列或数据必须先列出影响并获得明确批准。
4. **验证**：优先在隔离的本地或测试数据库验证，不以生产库试错。确认 SQL 与目标项目当前状态匹配。
5. **生产执行**：只有审核通过并明确批准后，才对正确的生产项目执行迁移。执行前再次检查待执行文件和目标项目；禁止将 `supabase db push` 放进自动部署流程。
6. **复核**：检查迁移账本、表 / 字段 / 约束 / 索引 / 函数 / 触发器 / RLS / 授权，以及网站相关查询。
7. **记录**：必要时更新结构参考快照和 `MIGRATION_HISTORY.md`。
8. **部署网站**：数据库验证通过后，再按正常 GitHub → Vercel 流程部署应用代码。

### 生产数据库安全规则

- 禁止对生产数据库执行 `supabase db reset`、重建数据库或未经审核的破坏性 SQL。
- 禁止自动部署时执行 migration；禁止在 Vercel 构建、部署钩子或 Next.js 启动时运行迁移。
- 不得把数据库密码、Supabase Access Token、Service Role Key 或连接字符串提交到 GitHub。
- 不导出生产用户、评论、文章或其他业务行数据到仓库；只允许经过审核的结构文件。
- 不使用 `CASCADE` 规避依赖检查；删除表 / 列、清理数据或改变权限必须先评估影响并获得明确授权。
- 已在生产执行的 migration 不得回头修改；需要修正时新增前向迁移。
- 生产迁移账本只记录版本和名称，不代表能够恢复历史 SQL。缺失的历史 SQL必须标记为缺失，不能根据名称补写猜测版本。
- `production-baseline.sql` 是结构参考，不是迁移脚本，不可对现有生产库执行。
- 当前 Free 套餐没有 Supabase 官方每日物理备份；不得将 CLI `db dump` 或 `public` baseline 描述为完整平台备份。
- 生产数据库备份、Auth 用户导出和 R2 媒体备份均不得写入 GitHub；备份恢复流程以 `supabase/docs/BACKUP_AND_RECOVERY.md` 为准。

### 当前生产迁移历史提示

截至 2026-11-11，生产迁移历史中曾存在部分历史 SQL 文件缺失的情况。相关恢复、校验及与生产结构的核对记录见 [`supabase/docs/MIGRATION_HISTORY.md`](supabase/docs/MIGRATION_HISTORY.md)。此前缺失的迁移文件已从历史提交恢复并纳入仓库。所有历史迁移 SQL 均用于迁移历史归档与审计，不得在现有生产数据库中重新执行。

不要为了让页面显示数据而关闭 RLS，也不要把 Service Role Key 放进浏览器端。

## Supabase CLI 与迁移文件维护

本地开发者需要 Node.js / npm；数据库维护者还需要 Supabase CLI。CLI 登录凭据只保存在本机，不写入仓库或 README。生产项目 Ref：`gjzxultalptqwqmpagzj`。

```bash
# 登录 Supabase（交互式授权）
supabase login

# 关联 OwenFX 生产项目
supabase link --project-ref gjzxultalptqwqmpagzj

# 查看本地与远程迁移版本
supabase migration list --linked
```

> 上述命令只用于 CLI 登录、项目关联和迁移状态检查。日常网站代码更新不需要执行这些命令。电脑或 VPS 执行数据库导出时均需要 Docker 和 Supabase CLI；当前 VPS 已安装 Docker，无需重复安装。生产数据库变更仍须遵守前文审核和单独批准流程，也不要把 CLI Access Token 当作数据库密码。

## Cloudflare R2 配置说明

1. 在 Cloudflare 创建 R2 存储桶。
2. 创建用于 S3 API 的访问密钥，并按最小权限原则授予目标存储桶所需权限。
3. 将账户对应的 S3 API Endpoint、Bucket、Access Key ID 和 Secret Access Key 配置到服务端环境变量。
4. 为存储桶配置公开访问域名或自定义域名，并将域名填写到 `R2_PUBLIC_BASE_URL`。
5. 上传接口只接受图片类型，单个文件最大 10 MB。

R2 密钥只用于服务端上传。公开图片 URL 可以展示在网页中，但不能因此公开 R2 的访问密钥。

## Vercel 部署

1. 将 GitHub 仓库导入 Vercel，框架选择 Next.js，Root Directory 使用仓库根目录。
2. 在 Vercel 项目设置的 Environment Variables 中填写 Supabase、R2 和站点变量。
3. 确认生产环境数据库结构、RLS、权限函数，以及 Supabase Auth 的邮件服务和六种邮件模板均已配置完成。
4. 将正式域名配置到 Vercel，并把 `NEXT_PUBLIC_SITE_URL` 设置为对应 HTTPS 地址。
5. 推送到 GitHub 默认分支后，Vercel 会按项目 Git 集成设置自动触发部署。
6. 部署后检查首页、文章、软件详情、登录注册、图片上传及管理后台功能。

如果构建失败，先查看 Vercel Deployment 的 Build Logs，定位具体文件和错误信息；不要通过删除功能代码或关闭安全策略来掩盖问题。

## 内容发布工作流

### 文章管理与导入

1. 使用具备内容编辑权限的账号进入管理后台。
2. 在「文章管理」中查看、编辑已有文章，并管理草稿与发布版本。
3. 新文章通过「AI 文章导入」授权流程提交为草稿。
4. 检查导入内容、排版和链接后，再通过已有文章的编辑页面完成审核与发布。

### 发布软件

1. 在软件管理中创建软件条目。
2. 填写软件名称、Slug、简介、开发者、版本、平台及官方图标地址。
3. 填写软件详细介绍、截图和官方 HTTPS 下载入口。
4. 按需添加网盘分享链接及提取码。
5. 设置是否首页精选及排序，先保存草稿。
6. 检查详情内容和外部链接后再发布。

软件详情页应优先提供软件官方渠道。第三方网盘链接作为补充下载方式，并应确保分享内容来源合法、链接有效。

## 常见问题

**1. 本地启动后 Supabase 报错怎么办？**  
检查 `.env.local` 是否存在，确认 Supabase URL 和公开 API Key 是否正确；修改环境变量后重新启动开发服务器。

**2. 注册确认邮件没有收到怎么办？**  
检查 Supabase Dashboard → Authentication → Email Templates 中的 Confirm Sign Up 模板，并确认 Authentication 的邮件发送服务、Site URL 和 Redirect URLs 配置正确；同时检查垃圾邮件文件夹及 Supabase Auth 日志。

**3. 图片上传失败怎么办？**  
检查 R2 Endpoint、Bucket、Access Key ID、Secret Access Key 和公开访问域名；同时确认密钥有目标 Bucket 的写入权限，以及图片格式和大小符合限制。

**4. 管理后台提示没有权限怎么办？**  
确认当前账号已登录，并在数据库中正确配置管理员或内容编辑权限及对应的权限检查函数。

**5. 为什么文章或软件没有显示？**  
检查内容是否已发布、发布时间是否已到、Slug 是否正确，以及 Supabase 表结构和 RLS 策略是否与当前代码匹配。

## 项目原则

- 软件介绍与文章内容是网站的核心，不以网盘链接列表替代软件详情。
- 首页精选使用软件图标 / 应用卡片作为内容入口。
- 软件详情页提供官方入口，网盘链接作为可选补充。
- 不在 OwenFX 服务器或 R2 中托管软件安装包。
- 所有服务端密钥只保存在环境变量或受控的密钥管理系统中。
- 新功能应优先沿用当前 Next.js App Router、Supabase 和 Cloudflare R2 架构。

---

© OwenFX
