---
name: owenfx-vercel-tooling
description: OwenFX 使用 Vercel Sandbox、Speed Insights 与 Vercel Toolbar 的隔离验证、真实用户性能分析、布局/交互/无障碍检查及资源清理规范。涉及 AI 生成代码验证、Vercel 性能观测或视觉体验验收时使用。
---

# OwenFX Vercel 工具使用规范

## 1. 工具职责与选择时机

| 工具 | 何时使用 | 主要用途 |
| --- | --- | --- |
| Vercel Sandbox | AI 生成或修改代码、依赖升级、修复复杂问题、涉及构建/测试风险的任务 | 在独立隔离环境验证候选源码，不污染正式工作区和 GitHub `main` |
| Speed Insights | 需要评估真实访客的页面加载、交互响应和视觉稳定性，或比较部署前后的性能变化 | 查看真实用户 Core Web Vitals，并按设备、环境、路由/路径和时间范围分析 |
| Vercel Toolbar | 需要定位页面布局偏移、交互耗时或可访问性问题，尤其是视觉/响应式改动验收 | 检查 Layout Shifts、Interaction Timing 和 Accessibility Audit |

不要为了形式每次都启用三个工具。根据任务风险和检查目标选择；纯文档修改通常不需要 Sandbox 依赖安装或性能工具。

## 2. Vercel Sandbox：隔离验证

### 2.1 何时必须使用

以下情况默认先使用一次性 Vercel Sandbox 验证候选代码：
- AI 生成或修改应用源码、组件、接口、样式、配置或构建脚本。
- 新增、升级、删除依赖或修改 lockfile。
- 修复影响多个页面/组件的缺陷，或涉及 Next.js、Supabase 客户端边界、R2 媒体处理和构建流程。
- 需要确认安装依赖、lint、类型检查、测试和生产构建是否通过。

纯文档、注释、翻译等不影响运行时的修改，可按风险只做文档格式、链接、编码和差异检查；不得为了省事把代码变更归类为文档变更。

### 2.2 建立隔离环境

1. 先读取 GitHub 仓库 `yurisa69/OwenFX-Blog` 的最新远程 `main` HEAD，记录完整 Commit SHA。
2. 创建本次专用、短生命周期 Sandbox，从 GitHub 仓库克隆该准确 SHA；默认启用持久化快照以保存任务历史，禁止以旧快照或本地不明状态作为代码基线。
3. 若用户的候选 AI 修改尚未包含在 `main`，将候选补丁/改动安全地导入 Sandbox，在 Sandbox 中审查和验证；不得直接把候选内容写入正式 `main` 或覆盖正式工作区。
4. 若仓库无法在不暴露凭据的前提下克隆，停止并报告。禁止把 GitHub Token、密码或其他凭据嵌入 Git URL、命令参数、日志或普通环境变量。
5. Sandbox 不得注入生产 Supabase、R2、Vercel 或其他生产密钥；优先使用无密钥构建、隔离测试配置和虚构测试数据。禁止连接生产数据库、执行生产迁移、写入真实用户数据或修改真实 R2 对象。
6. 创建前检查 Vercel Sandbox 当前配额、计费方式和本次预计用量；若超出可用额度或可能产生未经批准的费用，暂停并说明，不得擅自继续。
7. 月度台账按每月 1 日 00:00（默认 `Asia/Shanghai`，IANA 时区可配置）切换；只重置内部当月累计并归档上月，不得据此认定 Vercel 平台额度恢复。
7. 不创建持久化 Drive，不复用其他任务的 Sandbox。使用锁定且经官方文档确认的 `@vercel/sandbox` SDK 版本；不要把 SDK 主版本、REST API 版本和工具接口版本混称为 API 版本。默认设置 `persistent: true`、`snapshotExpiration: 0`（快照不自动过期）及 `keepLastSnapshots: { count: 6, deleteEvicted: true }`；若 SDK 版本不支持相应选项，先核对官方文档，不得猜测参数。原生快照数量限制按单个命名 Sandbox 生效，任务结束后仍须执行项目级快照清点。

### 2.3 验证步骤

1. 检查仓库实际 Node 版本、包管理器和 lockfile；当前 Node 版本以 `.nvmrc` 为准。
2. 使用锁文件对应的干净安装方式；当前 npm 项目使用 `npm ci`，不得用 `npm install` 静默改写 lockfile。
3. 重新核对 `package.json` 脚本，按变更范围执行 lint、typecheck、相关测试、完整测试和 build。当前项目脚本以仓库实际配置为准，包括 `npm run lint`、`npm run typecheck`、`npm test`、专项测试及 `npm run build`。
4. UI 改动还需检查首页、软件详情、文章详情及受影响共享组件；按适用范围覆盖手机、平板、桌面、深浅主题、键盘和触控交互。
5. 对比候选修改与 Sandbox 基线的完整差异，检查意外文件、密钥、调试输出、测试产物和 lockfile 变化。
6. 任何失败都要保留错误摘要并定位原因；不得删除测试、放宽安全策略、跳过类型检查或降低功能质量来制造通过结果。
7. Sandbox 通过只代表该隔离环境中的指定检查通过，不代表 GitHub 检查、Vercel 生产构建、部署或网站运行已经成功。

### 2.4 验收、提交与清理

1. Sandbox 验证通过后，将经审查的最终改动应用到正式开发流程；再次核对完整差异，确保没有把 Sandbox 临时文件、依赖目录、缓存、日志、凭据或构建产物带入提交。
2. 按仓库统一规则一次性完成检查、一个 Commit、一次 Push 到 `main`；不在 Sandbox 内直接推送或绕过正式审查流程。
3. 推送后核对 GitHub `main`、对应 GitHub Actions、Vercel 自动构建和生产部署状态。Sandbox 结果不能替代这些验收。
4. **本次任务验收结束后停止当前 session，但默认保留命名 Sandbox 元数据和自动快照**，用于保留任务历史；不删除本次 Sandbox 或其最新快照。
5. 每次新快照生成后，重新列出当前项目全部快照，按创建时间倒序只保留最新 6 个，删除更旧快照；同时核对团队全部项目的快照存储使用量不超过 Dashboard 显示的 15 GB 免费包含量（按 GB-month 计量，并非终身额度）。若数量与存储限制冲突，优先遵守 15 GB 免费额度，从最旧快照开始继续淘汰；不得为保留数量产生付费。
6. 若创建过临时 Drive，任务结束后必须删除；不得将完整源码、依赖目录、环境变量或日志存入 Drive 或快照。
7. 停止后再次查询 session、命名 Sandbox 和快照，确认 session 已停止、命名记录仍存在、快照保留数量与总大小符合限制。无法完成清理或保留策略时必须明确报告资源 ID 和未完成状态，不得声称已完成。

只清理超过“最新 6 个”或超出 15 GB 存储上限的最旧快照，以及本次临时 Drive；不得删除其他任务、其他项目或用户原有的 Sandbox、命名历史、保留快照和部署。

## 3. Speed Insights：真实用户性能分析

### 3.1 使用时机

- 首页、软件详情页、文章详情页有加载、交互延迟或布局稳定性优化时。
- 完成影响首屏、图片/字体、路由渲染、客户端脚本、卡片或动画实现的修改后，需要比较真实用户体验。
- 用户要求检查移动端/桌面端真实访问性能，或对比不同部署版本的性能变化时。

### 3.2 检查范围

1. 在 Vercel 项目的 Speed Insights 中选择正确时间范围和 Production 环境；需要分析候选版本时，只有现有且已获准的环境才可使用，不得擅自创建 Preview Deployment。
2. 按 Mobile / Desktop 设备维度检查数据。
3. 分别筛选首页、软件详情、文章详情对应的 Route / Path；确认实际路由后再筛选，不得猜测路径。
4. 重点检查 LCP、INP、CLS、FCP 和可用的其他 Web Vitals；同时记录样本量、时间范围、环境和部署版本。
5. 对比修改前后时，尽量使用相近时间窗口、设备和路由；流量不足或样本量过小时标记为数据不足，不推断性能提升。

### 3.3 数据解释与边界

- Speed Insights 反映真实访客设备产生的遥测数据，不是指定型号手机的自动化实验室测试，也不保证每个页面、每种设备都有足够样本。
- 若数据缺失、流量不足或路由无法区分，标记「暂无足够真实用户数据」，再考虑经批准的浏览器实验室测试或真实设备人工检查。
- 不编造毫秒数、分数、FPS、样本量或优化百分比。
- Speed Insights 只用于性能观测；不要将其误认为 Web Analytics，也不要借此收集不必要的个人数据。
- 若项目尚未启用，先检查当前项目设置、依赖和计费/用量影响。安装 `@vercel/speed-insights`、修改应用入口或启用项目功能属于实际配置变更，须先列出影响并取得用户明确授权；不得在仅要求审查时擅自启用。

## 4. Vercel Toolbar：布局、交互与无障碍验收

### 4.1 使用时机

- 玻璃模糊、渐变、阴影、光效、卡片尺寸或内容加载方式发生变化后。
- 移动端布局、响应式断点、导航、弹层、图片和字体加载可能造成布局跳动时。
- 需要检查交互响应时间、键盘可用性或无障碍问题时。

### 4.2 检查项目

1. **Layout Shifts：** 定位触发布局偏移的具体元素，检查字体加载、图片/视频尺寸、异步内容、卡片高度、标签换行和动画是否改变布局。
2. **Interaction Timing：** 检查关键点击、导航、搜索、筛选、弹层和主题切换的交互耗时及 INP；结合实际交互路径判断问题来源。
3. **Accessibility Audit：** 运行 Toolbar 提供的无障碍审查，处理可复现的问题；重点检查语义结构、标签、焦点、键盘操作、颜色对比和交互名称。
4. 重点覆盖首页精选软件卡片、软件详情页、文章详情页、移动端底部导航和玻璃效果区域。
5. 检查时记录页面路径、部署/Commit、视口尺寸、设备类型、主题、操作步骤和问题元素，避免只有截图而没有复现条件。

### 4.3 使用限制

- Toolbar 的 Layout Shift、Interaction Timing 和 Accessibility Audit 是定位工具，不等于完整 WCAG 合规认证，也不能替代真实设备和辅助技术测试。
- Toolbar 在 Preview 部署默认可用，但 OwenFX 默认不创建 Preview Deployment；优先使用用户已授权且现存的部署或本地环境。
- 若需在 Production 或 Local 环境启用 Toolbar，先检查当前项目配置和官方接入方式。安装依赖、修改入口、改变项目/团队可见性设置前，必须先列出变更并取得明确授权。
- 不为使用 Toolbar 擅自公开内部调试信息、发布评论或创建额外部署；用户未要求时不向 Toolbar 评论线程发布内容。
- 若 Toolbar 不可用，明确标记未检查，不得把浏览器目测描述成 Toolbar 检查结果。

## 5. 统一验收报告

每次使用上述工具后，按实际使用情况报告：

1. 工具及使用原因。
2. Sandbox 基准 Commit、候选改动标识、依赖安装、测试和 build 结果。
3. Speed Insights 的环境、时间范围、设备、路由、样本量和指标；无数据时说明。
4. Toolbar 检查页面、视口、Layout Shifts、Interaction Timing 和 Accessibility Audit 结果。
5. GitHub Commit / Push、Actions、Vercel 构建、生产部署和网站运行验证状态。
6. Sandbox/session/snapshot/Drive 清理结果及仍存在的资源（如有）。

每项均标记通过、失败、进行中、未执行、数据不足或无法验证。禁止把工具可用、配置已启用、检查已执行和检查通过混为一谈。

## 6. 官方资料

- Vercel Sandbox: https://vercel.com/docs/sandbox
- Speed Insights: https://vercel.com/docs/speed-insights
- Speed Insights Quickstart: https://vercel.com/docs/speed-insights/quickstart
- Speed Insights Metrics: https://vercel.com/docs/speed-insights/metrics
- Vercel Toolbar: https://vercel.com/docs/vercel-toolbar
- Layout Shift Tool: https://vercel.com/docs/vercel-toolbar/layout-shift-tool


## 7. Vercel Hobby 免费额度自动控制（强制）

每次使用 Sandbox 前后，必须遵守仓库正式文件 docs/VERCEL_HOBBY_QUOTA_CONTROL.md。该文件是额度总表、公式和逐次台账的唯一项目级记录入口。

### 7.1 创建前自动预检

1. 确认当前 Vercel 团队套餐为 Hobby，并读取最新官方额度和 Usage Dashboard 统计窗口。
2. 检查团队内全部项目及 Sandbox 资源，不能只看当前项目；读取现存 Sandbox 的状态、CPU、内存、运行时间、网络、持久化、快照和 Drive 信息。
3. 对 Sandbox CPU、配置内存、创建次数、数据传输、快照存储、Drive 存储、Drive 读写分别计算剩余量。
4. 对本次任务可能触发的 Functions、CDN、Fast Data Transfer、Fast Origin Transfer、构建、部署、Analytics 等指标单独检查，不得与 Sandbox 混算。
5. 预计用量必须覆盖完整任务并留出安全余量。额度不足或相关指标未核实，自动停止对应资源使用；不创建、不重试、不升级、不产生费用，也不要求用户逐次确认。
6. 纯文档、注释、翻译等不影响运行时的修改可不创建 Sandbox；仍须在台账记录本次 Sandbox 使用为 0。

### 7.2 运行后记录与扣减

1. Sandbox 停止后读取最终 session / Sandbox 指标，记录创建时间、墙钟时长、活动 CPU、配置内存、出入站网络、暴露端口、创建次数、快照 / Drive 使用和清理状态。
2. 使用官方公式计算 CPU 小时、配置内存 GB·小时和网络用量；内存按每个 Session 的配置量 × 墙钟时间计量，并按 1 分钟单位逐 Session 向上取整；不得先合并 Session 时长，也不得把墙钟时长当作活动 CPU。
3. 将本次用量追加到 docs/VERCEL_HOBBY_QUOTA_CONTROL.md 台账，并更新累计用量与剩余量；按 Sandbox / session ID 去重。
4. Dashboard 是官方总账，Sandbox API 是逐实例明细。数据不一致时以 Dashboard 为准并记录差异；不可读取的数据标记「未核实」，绝不能写 0。
5. 清理本次 Sandbox、session 和临时资源后，重新读取状态确认已停止并删除；不得清理其他任务资源。

### 7.3 额度隔离与停止阈值

- Sandbox：5 CPU 小时、420 GB·小时配置内存、5,000 次创建、20 GB 数据传输。
- Functions / Fluid Compute：4 CPU 小时、360 GB·小时配置内存，单独核算。
- Fast Data Transfer 100 GB、Fast Origin Transfer 10 GB、Sandbox Data Transfer 20 GB，分别核算。
- 80% 预警、90% 停止非必要使用；预计任务会突破安全余量时不创建 Sandbox。
- Hobby 超限后不允许通过付费升级、重试、切换项目或创建其他团队绕过免费限制。用户未明确授权时绝不产生费用。
- Hobby 额度恢复时间以 Dashboard 实际窗口为准；不因日历换月自行把余额归零。

### 7.4 报告要求

每次涉及 Vercel 的任务，必须列出套餐、团队、统计窗口、本次使用、累计已用、剩余量、数据来源、未核实项目、清理状态，以及 GitHub / Vercel 构建和生产部署结果。不得用「费用未知」「应该够用」代替额度计算；若资源数据不足，自动选择不消耗该资源的工作路径。


### 7.5 月度台账周期

- 内部额度台账每月 1 日 00:00 切换，默认 `Asia/Shanghai`，时区通过 IANA 标识配置；周期结束为下月 1 日 00:00（不含）。
- 新月份当月累计初始化为 0，上月记录归档只读并保留历史；不得覆盖或删除历史月份。
- 该操作只是内部自然月台账重置，不等于 Vercel Hobby 平台配额恢复。大多数 Hobby 限制按平台实际滚动恢复窗口处理；Web Analytics 有独立的 3 天宽限期及 7 天恢复规则。
- 快照存储 15 GB 与 Drive 存储 15 GB lifetime included 是不同指标；前者按 GB-month 计量，后者才是终身包含额度。非月度限制不得因月初而归零。
