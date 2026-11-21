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
2. 创建本次专用、短生命周期、非持久化 Sandbox，从 GitHub 仓库克隆该准确 SHA；禁止以旧快照或本地不明状态作为基线。
3. 若用户的候选 AI 修改尚未包含在 `main`，将候选补丁/改动安全地导入 Sandbox，在 Sandbox 中审查和验证；不得直接把候选内容写入正式 `main` 或覆盖正式工作区。
4. 若仓库无法在不暴露凭据的前提下克隆，停止并报告。禁止把 GitHub Token、密码或其他凭据嵌入 Git URL、命令参数、日志或普通环境变量。
5. Sandbox 不得注入生产 Supabase、R2、Vercel 或其他生产密钥；优先使用无密钥构建、隔离测试配置和虚构测试数据。禁止连接生产数据库、执行生产迁移、写入真实用户数据或修改真实 R2 对象。
6. 创建前尽可能检查 Vercel 当前套餐、Sandbox 官方额度、Usage Dashboard 用量和计费方式。额度数据暂时无法读取时，不得将未知值记为 0，也不得仅因“无法核实”就自动停止；应使用最近一次可验证数据、期间已知用量及本次资源上限作保守估算，并标注未知项。
7. 在额度数据不完整时，优先采用可控的低资源方案：使用满足任务的最小 vCPU/内存、设置合理且尽可能短的超时、不开放端口、不创建 Snapshot/Drive、不进行非必要数据传输。若当前套餐和官方计费规则已确认，且本次操作可被限制在已知免费/无额外费用边界内，可以继续执行，不要求用户逐次确认。
8. 若确认额度已耗尽、平台明确显示限额/暂停或拒绝创建、预计用量超过可用额度，或当前套餐/计费状态使未经授权费用无法排除，立即停止对应 Sandbox 操作；不得反复重试、切换项目/团队、升级套餐或绕过限制。可继续不依赖该资源的安全工作。执行期间记录可获取的创建时间、配置、session 开始/结束时间及平台返回指标；墙钟时长、活动 CPU、配置内存用量和网络用量应分别记录，无法读取的实际指标标注“未核实”，只能将计算值标为估算，不得冒充平台实际计量。
9. 不创建持久化 Drive，不创建快照，不复用其他任务的 Sandbox，不保留可自动恢复的环境。优先设置 `persistent: false` 和合理超时。

### 2.3 验证步骤

1. 检查仓库实际 Node 版本、包管理器和 lockfile；当前 Node 版本以 `.nvmrc` 为准。
2. 使用锁文件对应的干净安装方式；当前 npm 项目使用 `npm ci`，不得用 `npm install` 静默改写 lockfile。
3. 重新核对 `package.json` 脚本，按变更范围执行 lint、typecheck、相关测试、完整测试和 build。当前项目脚本以仓库实际配置为准，包括 `npm run lint`、`npm run typecheck`、`npm test`、专项测试及 `npm run build`。
4. UI 改动还需检查首页、软件详情、文章详情及受影响共享组件；按适用范围覆盖手机、平板、桌面、深浅主题、键盘和触控交互。
5. 对比候选修改与 Sandbox 基线的完整差异，检查意外文件、密钥、调试输出、测试产物和 lockfile 变化。
6. 任何失败都要保留错误摘要并定位原因；不得删除测试、放宽安全策略、跳过类型检查或降低功能质量来制造通过结果。
7. Sandbox 通过只代表该隔离环境中的指定检查通过，不代表 GitHub 检查、Vercel 生产构建、部署或网站运行已经成功。

### 2.4 唯一标准 GitHub 发布流程

Sandbox 中的候选改动通过检查后，必须使用本节规定的 GitHub Git Data API 流程发布到 main。**不得选择其他 Sandbox→GitHub 传输或提交方式。**

1. **固定发布基准。** 记录 Sandbox 克隆时的完整 main Commit SHA；通过 GitHub Git Data API 获取该 Commit 的 Tree SHA。开始发布前重新读取 refs/heads/main，确认 HEAD 仍与基准 SHA 一致。若已变化，停止发布，重新审查新提交和候选差异，不得覆盖。
2. **准备完整变更。** 在 Sandbox 工作区完成全部修改和验证后，生成最终完整 diff，并准确列出新增、修改、删除文件及文件模式变化。对每个新增/修改文件取得完整 UTF-8 内容；校验内容长度/摘要或 Blob SHA，确认没有截断、缺行、编码损坏或意外文件。任何内容无法完整读取时立即停止。
3. **创建 Blob。** 对所有新增/修改文件调用 GitHub create_blob，使用 utf-8 编码；Blob 创建可并行执行。Blob 只是 Git 对象，不产生 Commit，因此不会形成逐文件提交。删除文件不创建 Blob。
4. **创建完整 Tree。** 以基准 Tree SHA 作为 base_tree_sha，一次调用 create_tree 提交全部变更路径：修改/新增文件引用对应 Blob SHA，删除文件按 Git Tree API 的删除语义处理，并保留正确的 mode、type 和路径。未修改文件由基础 Tree 继承。检查新 Tree 返回值及变更清单，确保没有丢失未修改文件或遗漏变更。
5. **创建唯一 Commit。** 调用一次 create_commit，tree_sha 指向步骤 4 的完整 Tree，parent_sha 必须是步骤 1 的基准 main Commit SHA；提交说明使用简体中文。整个任务只创建这一个 Commit。
6. **一次更新 main。** 更新前再次读取远程 main HEAD；仅当它仍等于基准 SHA 时，调用一次 update_ref，设置 branch_name: main、新 Commit SHA、force: false 和 expected_sha: 基准 SHA。若 HEAD 不一致、更新被拒绝或无法确认 fast-forward，立即停止，不重试覆盖、不强制更新。
7. **核验远程结果。** 更新后重新读取 main，确认 HEAD 等于新 Commit SHA；核验新 Commit 的父提交、Tree SHA、变更文件列表和关键文件 Blob SHA。再检查 GitHub Actions、Vercel 对应 Commit 的构建与 Production Deployment 状态。

### 2.5 明确禁止的旧式传输与提交方式

以下方式不再作为 OwenFX 的备选方案，也不得在遇到工具限制时临时切换：

- 不通过 Vercel Sandbox 文件读取接口，将完整源码逐个文件回传给 GitHub 工具。
- 不把源码拆成多个文本块，跨多次工具调用传输、拼接或重组。
- 不使用 GitHub Contents API 对每个文件逐一更新，以免产生多个 Commit。
- 不创建多个 Tree/Commit 来绕过单次完整提交要求，不分批更新 main。
- 不因 API 输出截断、文件过大或工具调用限制而忽略完整性核验；无法完整取得内容时停止并报告。

**固定方法只有一套：** Sandbox 隔离修改与验证 → GitHub create_blob（可并行）→ create_tree（基于原 Tree）→ create_commit（一个）→ update_ref（一次、非强制）→ 核验远程 main 与 Vercel 生产部署。

### 2.6 Sandbox 清理

1. **本次任务验收结束后立即清除本次 Sandbox。** 停止所有运行中的 session，删除本次命名 Sandbox 及其元数据；若意外生成快照，逐个删除并核验已删除。若创建过临时 Drive，也必须删除。
2. 无论测试通过、失败、中止或用户决定不提交，都必须清理本次创建的 Sandbox 及其临时资源；不得为了保留失败现场而长期留存。
3. 不创建快照、备份或长期日志存档。只在最终对话报告中保留必要的测试摘要、失败原因和验收状态；不得将完整源码、依赖目录、环境变量或日志长期留在 Vercel。
4. 清理后再次查询本次 Sandbox、session 和快照，确认不存在仍运行或可恢复的本次资源。无法完成清理时必须明确报告资源 ID 和未完成状态，不得声称已清理。

Sandbox 清理只针对本次任务创建的资源；不得删除其他任务、其他项目或用户原有的 Sandbox、Drive、快照和部署。

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
