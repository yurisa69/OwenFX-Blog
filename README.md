# OwenFX Blog

一个按参考 UI 实现的 Linear 风格个人博客模板，技术栈：**Next.js App Router + TypeScript + Tailwind CSS + Supabase + Cloudflare R2**。

## 已包含

- 深色渐变 / 低饱和紫色视觉体系、细描边、玻璃拟态
- PC 三栏布局：左侧个人导航 / 中间文章 / 右侧关于与热门
- 移动端抽屉菜单 + 底部 Tab 导航
- 首页、文章列表、文章详情、标签、项目、归档、关于、收藏、设置、登录
- 搜索浮层
- 文章评论 UI；配置 Supabase 后可写入评论
- Supabase Auth 邮箱 OTP 登录基础能力
- Supabase 数据库 SQL schema
- Cloudflare R2 服务端上传 API
- 邮箱订阅 API
- Vercel 部署友好

## 本地运行

```bash
cp .env.example .env.local
npm install
npm run dev
```

打开 `http://localhost:3000`。

## Supabase

1. 创建 Supabase Project。
2. 在 SQL Editor 执行 `database/schema.sql`。
3. 在 `.env.local` 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
```

4. Auth → URL Configuration 中把 Site URL 配置为你的 Vercel 域名。

## Cloudflare R2

创建 Bucket 后，在 `.env.local` 配置：

```env
R2_ACCOUNT_ID=你的AccountID
R2_ACCESS_KEY_ID=你的AccessKey
R2_SECRET_ACCESS_KEY=你的Secret
R2_BUCKET_NAME=owenfx-assets
R2_PUBLIC_BASE_URL=https://你的R2公开域名
```

生产环境请进一步给 `/api/r2-upload` 增加管理员权限校验与 MIME 白名单。

## Vercel + GitHub 自动部署

将仓库推送到 GitHub，在 Vercel Import Project 中选择这个仓库。以后：

`GitHub push → Vercel 自动构建 → 自动更新线上网站`

在 Vercel 项目的 Settings → Environment Variables 添加 `.env.local` 中的变量，并分别开启 Production / Preview / Development 环境。

## 文章数据

当前项目为了开箱即用，首页文章使用 `lib/data.ts` 中的演示数据。正式上线时建议迁移到 Supabase `posts` 表，然后将文章编辑后台也建立在 Supabase 上。

## 参考图

`design-reference/` 中保留了本次提供的 UI 参考图，仅用于开发对照。
