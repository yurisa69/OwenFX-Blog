# OwenFX 统一媒体存储（Cloudflare R2）

OwenFX 的媒体二进制文件统一保存在 Cloudflare R2。Supabase 的 `public.media_assets` 仅保存元数据、用户归属和业务关联，不保存图片或视频二进制。

## 媒体分类与对象路径

| 类型 | R2 对象路径 | 用途 |
| --- | --- | --- |
| 文章图片 / GIF / WebP / AVIF | `articles/{userId}/{uuid}.{ext}` | Markdown 和富文本正文 |
| 用户头像 | `avatars/{userId}/{uuid}.{ext}` | 用户个人资料 |
| 用户背景图 | `backgrounds/{userId}/{uuid}.{ext}` | 个人主页背景 |
| 软件图标 | `software/{userId}/{uuid}.{ext}` | 软件详情和精选卡片 |
| 视频 | `videos/{userId}/{uuid}.{ext}` | MP4、WebM、MOV |
| 评论图片 | `comments/{userId}/{uuid}.{ext}` | 评论配图 |
| 附件 | `attachments/{userId}/{uuid}.{ext}` | 用户附件 |

## 上传流程

1. 浏览器向 `POST /api/r2-upload/presign` 请求短时有效的签名 PUT URL。
2. 浏览器直接 PUT 文件到 R2，不经过 Vercel Function 文件代理，避免 Vercel 请求体大小限制。
3. 浏览器调用 `POST /api/r2-upload/complete`。
4. 服务端通过 R2 HeadObject 确认对象存在和实际大小，再写入 Supabase `media_assets`。
5. 头像类型完成登记后同步更新 `profiles.avatar_url`；个人资料面板立即显示新头像，昵称和简介仍由“保存资料”单独提交。

签名 URL 默认 10 分钟过期。图片最大 20 MB；视频最大 250 MB。当前允许 JPG、PNG、WebP、GIF、AVIF、MP4、WebM、MOV。服务端密钥不会返回浏览器。

## Vercel 环境变量

以下变量必须配置在 Vercel 项目中（服务端变量，不要添加 `NEXT_PUBLIC_` 前缀）：

- `R2_ENDPOINT`：Cloudflare R2 S3 API endpoint，例如 `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `R2_ACCESS_KEY_ID`：R2 API Token Access Key ID
- `R2_SECRET_ACCESS_KEY`：R2 API Token Secret
- `R2_BUCKET_NAME`：R2 bucket 名称
- `R2_PUBLIC_BASE_URL`：绑定到该 bucket 的公开自定义域名，不要带末尾斜杠

现有文章图片兼容上传 API 仍可用；新文章编辑器图片和视频改用直传流程。

## R2 Bucket CORS

在 Cloudflare Dashboard → R2 → 对应 Bucket → Settings → CORS policy 添加规则。将允许来源替换为实际网站域名：

```json
[
  {
    "AllowedOrigins": [
      "https://owenfx-blog.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

如果以后绑定正式域名，也要把正式域名加入 `AllowedOrigins`。不要为了省事使用通配符来源。

## 视频播放与后续扩展

R2 负责存储和分发，支持通过公开域名访问媒体；在线播放器可使用 HTML5 `video` 元素，浏览器可发起 Range 请求实现拖动播放。R2 本身不负责转码。需要多清晰度、自适应码率或 HLS 时，再接入独立转码服务。

媒体表已预留 `width`、`height`、`duration_seconds`、`entity_type`、`entity_id` 和 `upload_status` 字段，供媒体库、封面尺寸信息、视频时长、关联文章/评论/软件及清理任务使用。

## 安全约束

- 所有上传签名都由服务端生成，R2 Secret 不进入客户端。
- 用户对象路径固定包含当前登录用户 ID；完成登记时再次校验归属。
- 文章图片和软件图标需要内容编辑权限；用户头像、背景、评论图片、视频和附件需要登录。
- Supabase RLS 限制用户只能读取、更新和删除自己的媒体元数据；管理员策略继续保留。
- 不自动删除旧头像或旧文件，避免误删仍被文章引用的媒体。后续媒体库清理应先检查业务引用再删除 R2 对象。
