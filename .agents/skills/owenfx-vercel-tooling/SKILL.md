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
- 工具结果、平台设置和网站运行状态分别核实；代码接入不等于平台启用，部署 READY 不等于网站功能正常。

## 2. Vercel Sandbox：隔离开发与验证

### 2.1 何时创建
- 需要安装依赖、运行 lint、TypeScript、测试或 Next.js build。
- 需要验证 AI 生成或拟议的源码修改。
- 需要检查 Next.js、Node.js、依赖升级或构建环境兼容性。
- 需要在不污染正式工作区的情况下复现构建或运行问题。

纯只读文档阅读、简单配置解释、轻量源码审查，或已有可靠且足够新的验证结果时，通常不必创建 Sandbox。

### 2.2 创建要求
1. 先读取 GitHub 最新 main，记录明确的完整 Commit SHA。
2. 每项任务创建独立、唯一命名的 Sandbox，从公开仓库克隆该 SHA；不得只依赖会移动的 main 标签作为最终基准。
3. 必须设置 persistent: false。不得从旧 Snapshot 恢复，不得创建 Snapshot，不得挂载现有 Drive，也不得创建 Drive。
4. 运行时版本与仓库 .nvmrc 保持一致，不使用不必要的高规格实例。
5. 不把生产 .env、Vercel 环境变量、Supabase 服务密钥、Cloudflare R2 密钥、用户数据或真实业务文件复制到 Sandbox。
6. 测试需要环境变量时，只使用虚构/占位值；不得连接生产数据库或生产存储。
7. 克隆后核对 HEAD SHA、当前分支和工作区状态；确认工作区干净后才开始操作。
8. Sandbox 只用于临时验证，不是正式提交源。所有修改仍须经过完整 diff 审查和授权的 Git 提交流程。

### 2.3 验证流程
按任务选择当前仓库实际存在的脚本：
- 依赖安装：npm ci。
- 代码规范：npm run lint。
- TypeScript：npm run typecheck。
- 测试：npm test，以及与修改范围相关的专项测试。
- Supabase migration 静态核对：npm run check:supabase-migrations；不得连接或修改生产数据库。
- Next.js 构建：使用仓库配置的占位环境变量执行 npm run build。

每条命令记录真实退出状态。遇到失败先定位原因；不得通过删除测试、放宽规则、隐藏错误或修改无关功能获得通过。

### 2.4 结束时必须清理
每次 Sandbox 操作结束，无论成功、失败或中止，均执行：
1. 只保留必要的非敏感结论：基准 SHA、执行命令、通过/失败状态、必要错误摘要和最终差异摘要。
2. 不将整个工作目录、node_modules、.next、构建产物、完整日志、临时文件或任何密钥复制到 GitHub。
3. 停止当前 Session，终止其中所有进程。
4. 删除本次创建的 Named Sandbox 元数据和文件系统。
5. 确认本次 Sandbox 已从项目列表消失；核对没有 Snapshot、Drive、挂载或其他持久化资源遗留。
6. 若本次误创建 Snapshot 或 Drive，只能在确认资源属于本次任务且没有用户数据后删除；不得删除其他任务的历史资源。
7. 如果停止或删除失败，立即停止继续创建 Sandbox，报告资源名称、Session ID 和实际状态；不得声称清理完成。

禁止为了方便下次复用而保留 Sandbox、Snapshot、Drive、工作目录或依赖缓存。下一项任务必须重新从 GitHub 最新 main 创建干净环境。

## 3. Vercel Speed Insights：真实用户性能监测
- 根布局只挂载一次 @vercel/speed-insights/next 的 SpeedInsights，依赖保留官方 @vercel/speed-insights 包。
- 还必须在 Vercel 项目控制台打开 Speed Insights；安装依赖和挂载组件不代表平台已启用。
- 首页、文章页、软件库、软件详情或个人中心发生明显前端变更后，按需查看真实用户性能。
- 修改图片/视频加载、字体、布局尺寸、渲染逻辑、缓存或交互逻辑后，按需检查移动端/桌面端和对应路由。
- 重点关注 LCP、FCP、CLS、INP 等可用指标，记录时间范围、环境、设备类型和样本量；流量不足时标注样本不足。
- Speed Insights 用于真实用户趋势，不替代 lint、测试、build 或本地性能定位。
- 不以单次分数变化直接断言某个 Commit 导致性能改善/退化，必须有可比较的时间窗口和证据。
- 不得通过减少粒子、缩短动画、降低光效、关闭玻璃效果或静态化背景改善指标；优先排查尺寸预留、字体与媒体加载、重复渲染、主线程长任务、请求优先级和缓存。

## 4. Vercel Web Analytics：访问与内容表现分析
- 根布局只挂载一次 @vercel/analytics/next 的 Analytics，依赖保留官方 @vercel/analytics 包。
- 还必须在 Vercel 项目控制台打开 Web Analytics；安装依赖和挂载组件不代表平台已启用。
- 使用平台自动采集的页面浏览和聚合维度；默认不添加自定义用户追踪事件。
- 需要了解总体访问量、页面浏览量、来源，比较文章和软件详情表现，或复盘内容表现时使用。
- 热门文章按文章详情路由/页面浏览量观察；热门软件按软件详情路由/页面浏览量观察。先核对当前路由实现，不把文章内提及当成软件详情访问。
- 访问来源查看 Referrers、Hostname、设备、浏览器、操作系统等平台提供的聚合维度。
- 区分 Visitors 与 Page Views；对比时注明时间范围、环境和筛选条件，不混合 Preview 与 Production 流量。
- 不发送用户 ID、邮箱、登录状态、认证信息、Token、私密文章内容、评论正文、搜索输入、表单内容或其他敏感信息。
- 不通过 URL 查询参数、事件属性或自定义事件变相记录个人数据；不将访客级数据、导出文件或含用户信息的截图提交到 GitHub。

## 5. Vercel Toolbar：页面诊断
- Toolbar 在 Preview Deployments 默认启用；但 OwenFX 默认不创建 Preview Deployment。
- 先检查是否存在用户已授权且可访问的部署环境；不得为了使用 Toolbar 自行创建预览部署。
- 生产环境 Toolbar 的启用/可见性属于 Vercel 项目设置，不是提交源码就能完成。临时打开必须先取得用户明确授权，并记录原设置；诊断结束后恢复并核验。
- Layout Shift Tool 定位字体加载、媒体尺寸、动态内容、动画或容器尺寸变化引起的布局偏移。
- Interaction Timing Tool 检查交互耗时和当前会话 INP；记录具体页面、设备和操作步骤。
- Accessibility Audit 辅助检查 WCAG 规则问题；它不是完整无障碍认证，仍需检查键盘操作、焦点顺序、语义和真实交互。
- 不得通过 data-allow-shifts 等方式隐藏真实布局偏移；只有经确认的有意布局变化才可按官方机制排除。
- Toolbar 不代替 Speed Insights 的真实用户指标，也不替代自动化测试。

## 6. 四项工具的协同流程
1. 根据任务选择工具，不必每次同时启用四项。
2. 涉及源码变更或构建验证时，使用全新非持久化 Sandbox。
3. 页面级布局、交互或无障碍问题需要定位时，按授权使用 Toolbar。
4. 代码发布后，通过 Speed Insights 观察真实用户性能；通过 Web Analytics 观察访问量、热门文章、热门软件详情和来源。
5. 根据数据决定是否需要下一轮优化；不因指标单独降低已确认的视觉效果。
6. 当前任务完成后清理 Sandbox；平台分析数据不复制进仓库。
7. 报告分别写明代码集成、控制台启用、真实数据、诊断执行及 Sandbox 清理状态。

## 7. 官方资料
- Sandbox：https://vercel.com/docs/sandbox
- Speed Insights：https://vercel.com/docs/speed-insights
- Speed Insights Quickstart：https://vercel.com/docs/speed-insights/quickstart
- Web Analytics：https://vercel.com/docs/analytics
- Web Analytics Quickstart：https://vercel.com/docs/analytics/quickstart
- Vercel Toolbar：https://vercel.com/docs/vercel-toolbar
- Layout Shift Tool：https://vercel.com/docs/vercel-toolbar/layout-shift-tool
- Accessibility Audit：https://vercel.com/docs/vercel-toolbar/accessibility-audit-tool
- Toolbar Visibility：https://vercel.com/docs/vercel-toolbar/managing-toolbar
