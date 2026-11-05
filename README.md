# OwenFX

精选软件与文章分享站。技术栈：**Next.js App Router + TypeScript + Tailwind CSS + Supabase + Cloudflare R2**，部署于 Vercel。

## 功能概览

- 首页轮播 + 精选软件 / 文章
- 文章列表与详情、评论
- 软件资源列表与下载
- 分类浏览
- 收藏（bookmarks）
- 用户注册 / 登录（邮箱 OTP）
- 个人资料与头像上传（R2）
- 深色 / 浅色主题
- **移动端底部导航**：首页 · 分类 · 收藏 · 我的

## 本地运行

```bash
cp .env.example .env.local
npm install
npm run dev
```

打开 http://localhost:3000

## 环境变量

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Cloudflare R2（头像等资源）
R2_ENDPOINT=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET_NAME=owenfx-avatars
NEXT_PUBLIC_R2_PUBLIC_URL=https://your-public-domain

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 部署

推送到 GitHub 后，Vercel 自动构建部署。请在 Vercel Settings → Environment Variables 中配置上述变量。

## 说明

当前文章与软件数据使用 `src/lib/mock*.ts` 演示数据。正式上线建议迁移到 Supabase 表，并完善后台管理。
