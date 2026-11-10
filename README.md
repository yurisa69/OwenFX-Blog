# OwenFX

**OwenFX 是一个以软件发现、软件介绍和技术文章为核心的内容分享站。**  
网站通过软件官方图标卡片展示精选应用，用户可以进入软件详情页阅读介绍，并跳转至软件官方渠道或站长整理的第三方网盘链接。文章系统用于发布软件评测、使用教程、技术经验和其他原创内容。

> 本站不托管、不分发软件安装包。软件详情页只保存软件资料及外部下载入口；文件实际下载由软件官方或对应网盘服务提供。

## 项目概览

| 项目 | 当前配置 |
| --- | --- |
| Web 框架 | Next.js 15.5.7（App Router） |
| 开发语言 | TypeScript |
| UI | React 19 + Tailwind CSS 4 |
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
- 支持为文章和软件详情分别配置赞赏方式。
- 软件安装包由官方或外部网盘托管，OwenFX 不负责保存安装包。

### 头像首屏加载与资料同步

为减少用户打开网站或进入个人中心时头像短暂空白、占位符闪烁的问题，当前头像采用**服务端优先读取数据库资料，客户端后台同步**的策略。

1. **服务端首屏读取**：用户请求页面时，`app/layout.tsx` 先通过 Supabase Auth 获取当前 Session。仅对已登录用户查询 `profiles` 表中的 `avatar_url` 和 `display_name` 两个必要字段，并将结果作为初始用户资料传给全局 Navbar。
2. **数据优先级**：优先使用 `profiles.avatar_url` 和 `profiles.display_name`；数据库记录不存在或查询失败时，回退到 Session 的 User Metadata（头像字段兼容 `avatar_url` / `picture`，昵称字段兼容 `display_name` / `name`），最后才使用邮箱前缀或通用昵称。
3. **图片直接渲染**：`components/Avatar.tsx` 在拿到有效头像 URL 后直接渲染图片，不等待图片加载事件或 `decode()` 完成，也不使用昵称首字母遮挡正在加载的图片。只有头像地址缺失或图片请求失败时，才显示昵称首字母占位。
4. **客户端后台同步**：Navbar 在客户端继续同步 Session 与 Supabase 用户资料，更新资料面板状态并预加载头像；异步更新需检查组件生命周期和用户 ID，避免卸载后更新或将其他账号的资料写入当前用户状态。
5. **性能与边界**：为了让数据库头像进入服务端首屏，已登录用户的页面请求会增加一次只查询必要字段的 Supabase 资料读取；未登录用户不执行该查询。不要把用户资料查询改成跨用户共享缓存，以免发生资料串用。头像 URL 已在首屏 HTML 中提供，并不代表图片文件本身无需网络加载；图片下载速度仍取决于头像源站和网络状况。

相关实现位置：

- `app/layout.tsx`：读取 Session、查询最小化用户资料并生成首屏初始用户数据。
- `components/Navbar.tsx`：接收初始用户资料，并在客户端后台同步最新资料。
- `components/Avatar.tsx`：统一处理头像 URL、图片展示及缺失 / 加载失败占位。
### 管理与安全

- 管理接口会检查登录状态及站长 / 内容编辑权限。
- 头像和管理端图片上传通过服务器端接口写入 Cloudflare R2，并将媒体元数据写入 `media_assets`。
- ChatGPT 等外部工具可通过受控 API 设备令牌导入文章草稿；令牌可在「管理后台 → AI 导入」创建和撤销。
- 图片上传限制为 JPG、PNG、WebP、GIF、AVIF，单张不超过 10 MB。
- 注册确认邮件及其他认证邮件统一由 Supabase Auth 根据 Authentication → Email Templates 中的六种模板发送。
- Supabase Service Role 和 R2 密钥只允许放在服务端环境变量中。

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
              注册确认、邀请、魔法链接、邮箱变更、密码重置与重新认证邮件
```

- **Vercel**：运行 Next.js 网站和服务端 API。
- **Supabase**：提供身份认证、文章 / 软件等业务元数据、文章修订索引、API 设备授权和权限相关能力；不保存新文章正文。
- **GitHub**：保存文章 Markdown 正文文件，默认路径为 `content/articles/{slug}.md`。
- **Cloudflare R2**：通过 S3 兼容接口保存文章图片、封面、头像和其他媒体对象；Supabase `media_assets` 仅保存文件元数据和 R2 对象引用。
- **Supabase Auth Email**：统一发送注册确认、邀请、魔法链接、邮箱变更、密码重置和重新认证邮件；邮件主题与正文由 Supabase Auth Email Templates 管理。

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
├── supabase/migrations/    # Supabase 数据库结构变更记录
├── content/articles/       # GitHub 管理的 Markdown 正文文件
├── docs/openapi/           # 外部文章导入 API Schema
├── lib/                    # Supabase、GitHub Markdown、R2、权限和业务工具
├── public/                 # 静态资源
├── .env.example            # 环境变量模板
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

- Node.js：建议使用 Node.js 20 LTS。
- npm：随 Node.js 安装。
- Git：用于克隆和同步仓库。

### 启动项目

```bash
git clone https://github.com/yurisa69/OwenFX-Blog.git
cd OwenFX-Blog

cp .env.example .env.local
npm install
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

## Supabase 数据库说明

项目运行依赖 Supabase Auth 和多组业务数据表，例如用户资料、文章、分类、软件、软件网盘链接、云资源、赞赏设置、文章修订记录、审计日志和统计事件等。注册确认及其他认证邮件由 Supabase Auth 负责，不依赖业务验证码表。

**数据库结构必须与当前 `app/` 下的 API 查询字段保持一致。** 仓库中的 `supabase/migrations/` 保存已纳入版本管理的数据库变更记录，但目前这些迁移并不等同于完整的生产数据库初始化脚本。正式部署或迁移环境前，仍需核对当前版本所需的表结构、字段、索引、RLS 策略和权限函数（例如管理员 / 内容编辑权限检查函数），确认迁移与目标数据库状态一致后再执行。

不要为了让页面显示数据而关闭 RLS，也不要把 Service Role Key 放进浏览器端。

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

### 发布文章

1. 使用具备内容编辑权限的账号进入管理后台。
2. 新建文章，填写标题、Slug、摘要和正文。
3. 保存为草稿，检查排版、链接和内容。
4. 确认无误后发布；发布后的文章由前台文章页面展示。

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
