# Vercel Hobby 免费套餐额度控制与使用台账

适用仓库：yurisa69/OwenFX-Blog  
Vercel 项目：owenfx-blog  
团队：owen-sove（Hobby 免费套餐）  
核对日期：2026-11-21  
官方依据：Vercel Sandbox 文档、Hobby 套餐说明和 Pricing 页面。额度变化时以最新官方页面及 Usage Dashboard 为准。

## 1. 控制目标与硬性原则

1. 所有 Sandbox 用量按 Vercel 团队维度统计，不能只计算当前任务或当前项目。
2. 不产生未经授权的费用；不通过升级套餐、付费功能或付费资源绕过免费额度。
3. 每次创建前自动预检；每次停止后读取最终用量、记录实际时长并扣减余额，不要求用户逐次确认。
4. Sandbox 与 Functions / Fluid Compute 是不同资源，必须分开记账。
5. Vercel Usage Dashboard / Sandbox Usage 是官方总账；Sandbox API 逐实例指标用于任务明细和交叉核对。两者不一致时以 Dashboard 为准，并记录差异。
6. 数据缺失不等于 0。无法验证的项目标记「未核实」并保守预留；不能用未知余额批准会消耗该项目的操作。
7. Hobby 超出包含额度后，相关 Sandbox 创建会暂停；不得反复创建、重试、切换区域或用其他项目规避限制。
8. 默认使用可持久化 Sandbox 保存任务快照；每次任务结束后保留项目范围内最新 6 个快照，新增后删除最旧的超额快照。不得创建 Drive，不复用其他任务 Sandbox。
9. 不向 Sandbox 注入生产密钥，不连接生产数据库，不执行生产迁移，不写入真实用户数据或生产 R2 对象。
10. 纯文档、注释、翻译等不影响运行时的修改可不启动 Sandbox，但必须在台账记录本次 Sandbox 使用为 0。

## 2. Hobby 免费额度总表

各项资源独立核算，不得相互抵扣。

### 2.1 Vercel Sandbox 专属额度

| 资源 | Hobby 包含额度 | 计量与记账规则 |
| --- | ---: | --- |
| Sandbox 活动 CPU | 5 小时 / 月 | 实际 CPU 活动时间，按所有 vCPU 累加 |
| Sandbox 配置内存 | 420 GB·小时 / 月 | 配置内存 GB × 墙钟运行小时 |
| Sandbox 创建次数 | 5,000 次 / 月 | 每次创建计 1 次；失败请求是否计入以 Dashboard 为准 |
| Sandbox 数据传输 | 20 GB / 月 | 对外发送数据，以及暴露端口的进出流量 |
| 并发 Sandbox | 最多 10 个 | 创建前检查当前运行数量 |
| 单次会话时长 | 最长 45 分钟 | 单次连续 session 上限 |
| 单实例最大配置 | 4 vCPU / 8 GB | 默认优先 2 vCPU / 4 GB |
| 快照存储 | 15 GB 包含量 | 按团队实际存储及 GB-month 计量；项目级最多 6 个快照，团队总存储不得超过免费包含量 |
| Drive 存储 | 15 GB（终身包含） | 按实际逻辑存储计量；默认不创建 |
| Drive 读取 | 30 GB / 月 | 挂载 Drive 的逻辑读取量 |
| Drive 写入 | 30 GB / 月 | 挂载 Drive 的逻辑写入量 |

补充：

- CPU 只统计代码实际使用 CPU 的时间；等待网络、数据库或模型响应的时间不计入活动 CPU。
- 内存按配置量和实际运行时长计算；CPU 空闲时配置内存仍按运行时长计量。
- 普通下载 npm 包、Git 仓库和数据集的入站下载按官方说明不计入 Sandbox 数据传输；向互联网发送的数据，以及经过暴露端口的请求和响应需要计入。
- CPU、内存、网络、创建次数、快照和 Drive 是独立计量维度。停止 Sandbox 不会撤销已产生用量。

### 2.2 Hobby 套餐其他资源（不属于 Sandbox）

| 资源 | Hobby 包含额度 | 说明 |
| --- | ---: | --- |
| Global Config 读取 | 100,000 次 | 按 Dashboard 统计窗口 |
| Global Config 写入 | 100 次 | 按 Dashboard 统计窗口 |
| Fast Data Transfer | 100 GB | 网站/CDN 快速数据传输，与 Sandbox 分开 |
| Fast Origin Transfer | 10 GB | 源站传输，与 Sandbox 分开 |
| CDN Requests | 1,000,000 次 | 按 Dashboard 计量 |
| Functions 活动 CPU（Fluid Compute） | 4 CPU·小时 | 与 Sandbox 5 小时完全分开 |
| Functions 配置内存（Fluid Compute） | 360 GB·小时 | 与 Sandbox 420 GB·小时完全分开 |
| Function Invocations | 1,000,000 次 | 按 Dashboard 计量 |
| Image Transformations | 5,000 次 | 图片转换 |
| Image Cache Reads | 300,000 次 | 图片缓存读取 |
| Image Cache Writes | 100,000 次 | 图片缓存写入 |
| Speed Insights | 10,000 个活跃事件 | 最近 30 天滚动窗口 |
| Web Analytics Events | 50,000 个事件 | 月度额度 |
| Workflow Events | 50,000 个事件 | 月度额度 |
| Workflow Storage Writes | 1 GB | 工作流写入数据 |
| Connection Token Requests | 500 次 | 连接令牌请求 |
| Connection Triggers | 1,000 次 | 连接触发次数 |

重要区分：

- 4 CPU·小时 / 360 GB·小时属于 Vercel Functions / Fluid Compute。
- 5 CPU·小时 / 420 GB·小时属于 Vercel Sandbox。
- 100 GB Fast Data Transfer、10 GB Fast Origin Transfer、20 GB Sandbox Data Transfer 是三种不同指标。
- 网站访问产生的 Functions / CDN 用量不能扣到 Sandbox 账本，Sandbox 测试也不能扣到 Functions 账本。

### 2.3 Hobby 其他运行限制

| 项目 | Hobby 限制 |
| --- | ---: |
| 项目数量 | 最多 200 个 |
| 每项目域名 | 最多 50 个 |
| 每日部署 | 最多 100 次 |
| 构建 vCPU | 2 |
| 构建内存 | 8 GB |
| 构建磁盘 | 64 GB |
| 单次构建最长时间 | 45 分钟 |
| 并发构建 | 1 |

推送 main 触发的生产构建不是 Sandbox 创建，不扣 Sandbox 创建次数，但仍须注意每日部署和构建限制。

## 3. 额度周期、月度台账与重置规则

### 3.1 项目内部月度台账

1. **内部统计周期统一从每月 1 日 00:00 开始，到下月 1 日 00:00 结束**，采用左闭右开区间 `[本月 1 日 00:00, 下月 1 日 00:00)`。
2. 默认时区为 `Asia/Shanghai`；时区以 IANA 标识配置，不写死 UTC 偏移量。用户明确指定其他时区时以用户指定值为准；修改时区只影响后续周期，不重写已归档月份。
3. 每月开始时创建新的月度账本，当月累计初始化为 0；上一月账本转为只读历史记录，不覆盖、不删除。
4. 每个自然月独立记录周期起止、时区、套餐额度快照、各项当月已用量、剩余量、预警状态、Dashboard 核对时间、证据来源及未核实项。
5. 自动计算月份天数、跨年、闰年和夏令时；不得用固定 30 天或固定毫秒数推算自然月边界。
6. 月度台账“重置”仅表示**内部当月累计计数归零并新建周期**，不代表 Vercel 平台额度已恢复或限额封锁已解除。

### 3.2 Vercel 平台真实额度窗口

1. Vercel Hobby 没有 Pro 式固定账单周期。官方说明指出，大多数超限功能通常需要等待 30 天恢复；不能将内部每月 1 日切换当作平台额度恢复。
2. 每项资源的实际计量窗口、暂停状态和恢复时间，以 Vercel Usage Dashboard、对应产品官方文档及 API 为准。预检时同时记录内部自然月周期和平台实际统计/恢复窗口。
3. Sandbox 定价表虽展示月度包含量，但 Hobby 超限后的实际恢复仍须按官方 Hobby 规则和 Dashboard 确认，不能仅凭日历换月重置平台用量。
4. Web Analytics 超限后有独立流程：先进入 3 天宽限期，随后暂停收集；官方说明可等待 7 天后恢复收集。此规则不替代内部自然月归档。
5. Speed Insights 等滚动 30 天指标按实际窗口记录，不得在月初直接将平台累计值归零。
6. Dashboard 未提供明确恢复日期时标记「平台恢复时间未核实」，不得自行推算；等待期限后仍须重新读取 Dashboard / 产品状态确认。

### 3.3 非月度资源

1. Sandbox Snapshot Storage 的 15 GB 是包含额度，按团队实际存储及 GB-month 计量，**不是终身累计额度**。超出免费包含量可能产生存储费用，必须按团队范围核对。
2. Vercel Drive Storage 的 15 GB 明确标注为 lifetime included；Drive Reads / Writes 是月度指标。项目当前默认不创建 Drive。
3. 并发 Sandbox 数量、单次 Session 最长时长、单实例 vCPU / 内存上限属于运行限制，不是每月累计余额；月初不重置。
4. 项目级最新 6 个快照属于历史保留策略，不因月度切换清空；快照过期策略另按第 4.2 节执行。

### 3.4 月度账本模板与切换流程

| 字段 | 规则 |
| --- | --- |
| 周期开始 | 每月 1 日 00:00（配置时区） |
| 周期结束 | 下月 1 日 00:00（不包含结束时刻） |
| 时区 | 默认 `Asia/Shanghai`，允许配置 IANA 时区 |
| 当月累计 | 新周期初始化为 0，按本月任务逐次累加 |
| 上月记录 | 归档只读，历史保留，不覆盖 |
| 平台真实余额 | 独立从 Vercel Dashboard / 官方状态读取，不随内部账本归零 |
| 未核实指标 | 保持「未核实」，不得因为新月份开始而改写为 0 |

新月份首次执行任务时，先按当前时区计算周期边界，归档上月原始值，再开启新周期。每次任务后只向当前自然月追加本次用量，同时保留平台实际统计窗口和 Dashboard 证据。

## 4. 每次 Sandbox 任务的自动核算流程

### 4.1 创建前预检

1. 读取 Vercel 团队和项目，确认套餐与团队内全部项目范围。
2. 查询 Dashboard 中 Sandbox CPU、配置内存、创建次数、数据传输、快照、Drive 读写和存储当前值；同时检查本任务可能影响的其他 Hobby 指标。
3. 列出团队内现存 Sandbox，识别运行中实例、持久化实例、快照和 Drive。
4. 读取 GitHub 最新 main SHA，记录完整 Commit SHA。
5. 根据预计 vCPU、内存、运行时间和创建次数，计算预计用量及完成后的剩余量。
6. 任一相关指标预计超出剩余额度，或无法核实本任务可能消耗的额度时，自动停止 Sandbox 路径；不创建、不重试、不升级、不要求用户再次确认。可继续不消耗该资源的只读检查或纯文档工作。

### 4.2 默认配置

- 使用持久化配置，默认 `persistent: true`，使任务结束时自动保存快照。
- 使用仓库锁定并经官方文档确认的 `@vercel/sandbox` SDK 版本；不得将 SDK 主版本、REST API 版本和工具接口版本混称为“API v4”。
- 快照设置 `snapshotExpiration: 0`（不自动过期），并设置 `keepLastSnapshots: { count: 6, deleteEvicted: true }`；若当前 SDK 版本不支持该选项，先核对官方 SDK 文档，不得猜测参数。原生数量限制按单个命名 Sandbox 生效，不能代替项目级清点。
- 默认 2 vCPU / 4 GB；任务适合时使用 1 vCPU / 2 GB。
- 单次 session 不超过 Hobby 45 分钟上限。
- 不创建 Drive，不挂载 Drive 或其他持久化存储。
- 不开放端口；确需开放时将端口双向流量纳入预算。
- 任务完成立即停止当前 session，不等待超时；保留本次命名 Sandbox 元数据和自动快照，作为后续历史记录。
- 每次生成新快照后，重新列出当前项目全部快照，按创建时间从新到旧排序；只保留最新 6 个，删除其余最旧快照，并逐个核验删除状态。
- 同时核对团队全部项目的快照存储使用量及 Dashboard 免费包含量；15 GB 不是终身累计额度，按 GB-month 计量。若团队总量将超过免费包含量，或余额无法核实且可能产生费用，停止快照创建路径并报告，不得付费。项目级仍最多保留最新 6 个；团队级存储预算不得按项目重复分配。
- 不复用其他任务 Sandbox，不通过持久化或快照绕过单次时长限制。

### 4.3 停止后记录

至少记录 Sandbox 名称、项目、团队、创建时间、session ID、基线 SHA、vCPU、配置内存、区域、持久化状态、端口状态、墙钟时长、活动 CPU、配置内存 GB·小时、出站及端口流量、创建次数、快照/Drive 用量、停止时间、清理结果、数据来源和查询时间。

计算公式：

- 活动 CPU 小时 = totalActiveCpuDurationMs / 3,600,000
- 单个 Session 配置内存 GB·小时 = (memoryMB / 1024) × ceil(totalDurationMs / 60,000) / 60；每个 Session 至少按 1 分钟计量，再对全部 Session 求和。
- 不得先合并多个 Session 的毫秒时长再统一向上取整；分钟计量必须逐 Session 计算。
- 墙钟运行小时 = totalDurationMs / 3,600,000
- 剩余额度 = Hobby 包含额度 - 当前统计窗口累计使用量

活动 CPU 与墙钟时间不是同一指标。内存按配置量 × 墙钟时间计量，并按每个 Session 的 1 分钟计量单位向上取整。持久化 Sandbox 多次停止/恢复时逐 Session 累加；每次连续 Session 仍遵守 45 分钟上限。

### 4.4 余额扣减

1. 每次任务结束后更新第 5 节台账，并归入每月 1 日 00:00（配置时区）划分的当前自然月；月初只开启新账本，不覆盖上月记录。
2. 记录本次 CPU、内存、创建次数、网络、Drive 和快照用量。
3. 更新累计用量、剩余量、使用窗口、证据来源和最后核对时间。
4. Dashboard 与 API 不一致时以 Dashboard 为准，保留 API 明细并记录差异。
5. 本次确实未使用的指标记为「0（本次未使用）」；未能查询的指标记为「未核实」，不得写成 0。
6. 按 Sandbox / session 唯一 ID 去重，禁止重复扣减。

### 4.5 预警与停止阈值

1. 任一月度计量项达到 80%：预警，优先缩短运行、减少配置、避免重复创建。
2. 任一月度计量项达到 90%：停止非必要 Sandbox；仅在剩余量足以覆盖任务且保留 10% 安全余量时继续。
3. 预计任务会突破安全余量：不创建 Sandbox，改用不消耗该资源的工作方式。
4. 任一计量项达到 100%、Dashboard 显示超限/暂停或费用状态无法确认：立即停止相关操作，不重试、不升级、不产生付费。
5. 快照总量必须在每次任务后核对；项目级最多保留 6 个最新快照；同时团队全部项目的快照存储使用量不得超过 Dashboard 显示的免费包含额度。Drive 实际占用未核实前禁止创建 Drive。
6. 用户无需为正常免费额度内的任务逐次批准；涉及付费、升级、超额或权限扩大时，本项目默认不执行。

## 5. Vercel Sandbox 使用台账

### 5.1 当前核算基线（2026-11-21）

数据来自 Vercel 团队 owen-sove、项目 owenfx-blog 的命名 Sandbox、Session 和快照 API。2026-11-21 清理后，项目当前命名 Sandbox 为 0 个、运行中为 0 个；清理前 Session API 返回 13 条记录；删除全部命名 Sandbox 后再次查询，Session API 返回 0 条。CPU、内存、时长和网络按清理前 API 返回的逐实例累计指标汇总，删除资源元数据不会冲销已发生用量。Dashboard 是最终总账，本表是逐实例核对基线。

| 指标 | Hobby 包含量 | 当前已用 | 保守剩余 |
| --- | ---: | ---: | ---: |
| Sandbox 活动 CPU | 5 小时 | 0.5880 小时（约 35 分 17 秒） | 4.4120 小时（约 4 小时 24 分 43 秒） |
| Sandbox 配置内存 | 420 GB·小时 | 21.5401 GB·小时 | 398.4599 GB·小时 |
| Sandbox 创建 | 5,000 次 | API 可见命名资源估算 11 个；非 `Sandbox.create()` 调用证据 | 未核实，禁止把 4,989 次作为确认余额 |
| Sandbox 数据传输 | 20 GB | 2.0071 GB（入站+出站保守合计） | 至少 17.9929 GB |
| Sandbox 墙钟运行时长 | 非独立额度 | 5.3850 小时（约 5 小时 23 分 6 秒） | 用于计算内存 |
| 并发 Sandbox | 10 个 | 当前运行 0 个 | 当前可用并发 10 个 |
| 快照存储 | 15 GB 包含量（GB-month 计量） | 当前项目有效快照 0 个（6 条记录均为 deleted） | 当前项目 API 可见占用 0 GB；团队 Dashboard 余额待核实 |
| Drive 存储 | 15 GB（终身） | 未取得可靠用量 | 未核实，禁止新建 |
| Drive 读取 | 30 GB / 月 | 未取得可靠用量 | 未核实，禁止挂载读取 |
| Drive 写入 | 30 GB / 月 | 未取得可靠用量 | 未核实，禁止挂载写入 |

网络说明：

- API 返回出站约 0.0234 GB、入站约 1.9837 GB。
- 官方规则说明普通下载入站流量（例如 npm 包和 Git 仓库）不计费，但当前 API 汇总没有把普通下载和暴露端口流量拆分。
- 为防止低估，当前账本暂将入站与出站合计 2.0071 GB 全部预留扣减；17.9929 GB 是保守下限，不代表已确认的实际计费流量。
- 后续必须从 Usage Dashboard 核实 Sandbox Data Transfer 官方汇总，再校准总账并保留历史估算。

快照 / Drive 说明：

- 2026-11-21 对当前项目重新查询快照：共 6 条历史记录，状态均为 deleted，当前有效快照为 0 个；其中本次清理 4 个，另 2 个此前已删除。
- 本次删除的 4 个自动快照合计 3,464,810,484 bytes（约 3.4648 GB），项目 API 可见有效快照占用已归零；团队存储用量和免费包含额度仍以 Usage Dashboard 为准，未从 API 推断团队余额。快照存储不是 Drive 的 15 GB lifetime included 项。
- 4 个快照分别来自 owenfx-markdown-migration（3 个连续快照链）和 green-unknown-roundworm-b5YDNn（1 个）。随后本次又删除了全部 11 个已停止 Sandbox 命名资源；这两个持久化 Sandbox 的临时文件系统不能再从这些快照恢复。
- 当前项目 Drive 数量为 0；Drive 存储、读取和写入额度仍以 Usage Dashboard 为准。Drive 存储 15 GB 才是 lifetime included；不可与快照存储混淆。
- 删除全部 11 个命名 Sandbox 后，项目命名 Sandbox 列表复查为 0；Session 列表复查也返回 0 条。清理前的 13 条 session 已不再通过当前项目 Session API 暴露；平台底层是否保留不可见归档数据无法从现有接口确认。

### 5.2 历史 Sandbox 用量账本（资源元数据已清理，截至 2026-11-21）

| Sandbox | 创建日期（UTC） | 累计运行 | 活动 CPU | 配置内存 | 出站 | 入站 | 持久化 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| owenfx-ci-check | 2026-11-11 | 30.01 分 | 5.40 分 | 2.0005 GB·h | 3.830 MB | 240.087 MB | 否 |
| owenfx-security-lint-audit-1111 | 2026-11-11 | 30.01 分 | 4.21 分 | 2.0004 GB·h | 1.559 MB | 241.808 MB | 否 |
| owenfx-next16-codemod | 2026-11-11 | 30.01 分 | 4.31 分 | 2.0004 GB·h | 2.836 MB | 298.935 MB | 否 |
| owenfx-next16-lockcheck | 2026-11-11 | 15.01 分 | 0.76 分 | 1.0004 GB·h | 1.074 MB | 189.860 MB | 否 |
| owenfx-content-opt-20261114 | 2026-11-14 | 20.13 分 | 2.93 分 | 1.3423 GB·h | 1.274 MB | 122.975 MB | 否 |
| green-unknown-roundworm-b5YDNn | 2026-11-14 | 14.62 分 | 3.13 分 | 0.9748 GB·h | 0.909 MB | 134.609 MB | 是 |
| owenfx-markdown-migration | 2026-11-14 | 90.15 分 | 6.57 分 | 6.0101 GB·h | 8.949 MB | 191.588 MB | 是 |
| owenfx-test-coverage | 2026-11-15 | 30.01 分 | 3.79 分 | 2.0004 GB·h | 1.511 MB | 193.389 MB | 否 |
| lime-anonymous-ptarmigan-X2pvxv | 2026-11-15 | 30.01 分 | 1.82 分 | 2.0004 GB·h | 0.761 MB | 184.587 MB | 否 |
| owenfx-automation-audit-20261121 | 2026-11-21 | 30.00 分 | 0.33 分 | 2.0002 GB·h | 0.006 MB | 1.112 MB | 否 |
| owenfx-automation-review-node24 | 2026-11-21 | 3.15 分 | 2.03 分 | 0.2102 GB·h | 0.648 MB | 184.786 MB | 否 |

说明：累计运行时长可能包含持久化 Sandbox 的多次 session，不能误当成单次连续 session。全部实例均为 2 vCPU / 4 GB 配置。汇总使用原始毫秒值，表格仅显示有限小数。

### 5.3 本次文档任务记录

| 日期 | 任务 | Sandbox 创建 | 墙钟时长 | 活动 CPU | 配置内存 | 数据传输 | 快照 / Drive |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 2026-11-21 | 新增 Hobby 免费额度控制规范，纯文档修改 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2026-11-21 | 清理 4 个无用 Sandbox 自动快照（不启动 Sandbox） | 0 | 0 | 0 | 0 | 0 | 删除 3.4648 GB 快照；Drive 未变化 |
| 2026-11-21 | 清理全部 11 个已停止 Sandbox 命名资源（不启动 Sandbox） | 0 | 0 | 0 | 0 | 0 | 删除 11 条命名资源；Session API 复查为 0 条 |

本次未创建、启动或复用 Sandbox；未创建快照或 Drive；Sandbox 扣减为 0。GitHub 文档提交和 Vercel 自动构建属于独立资源，不计入 Sandbox CPU / 内存 / 创建次数。

### 5.4 Sandbox 快照清理记录（2026-11-21）

本次先删除当前项目中确认无用的 4 个自动快照，随后按用户要求删除全部 11 个已停止的 Sandbox 命名资源；没有启动 Sandbox，也没有修改生产数据。

| Sandbox 来源 | 快照 ID | 原大小 | 删除后验证 |
| --- | --- | ---: | --- |
| owenfx-markdown-migration | snap_5Sh4cSJbfX2CvprSNMLwUxFD0H1Q | 748,319,182 bytes | deleted |
| owenfx-markdown-migration（父快照） | snap_x5m4nDIfTl53VX4MIcTeurDTM6Eg | 750,473,264 bytes | deleted |
| owenfx-markdown-migration（父快照） | snap_s23TVK0GYskQJhYMvFuksx9Sotst | 745,147,918 bytes | deleted |
| green-unknown-roundworm-b5YDNn | snap_9XOLdscPMZSk3rctbxkVJvDmFoUs | 1,220,870,120 bytes | deleted |

合计释放项目可见快照存储约 **3.4648 GB**。删除顺序为子快照优先，再删除其父快照；随后逐个读取快照详情，4 个均返回 status=deleted。项目快照列表复查后，当前有效快照为 0 个。

### 5.5 本次历史命名 Sandbox 清理记录（2026-11-21）

本次删除前重新查询确认 11 个命名 Sandbox 全部为 stopped，没有运行中实例。已逐个删除其命名资源元数据；删除后再次查询，项目命名 Sandbox 列表返回 0 个。

| 已删除的命名 Sandbox | 删除前状态 |
| --- | --- |
| owenfx-automation-review-node24 | stopped |
| owenfx-automation-audit-20261121 | stopped |
| lime-anonymous-ptarmigan-X2pvxv | stopped |
| owenfx-test-coverage | stopped |
| owenfx-markdown-migration | stopped |
| green-unknown-roundworm-b5YDNn | stopped |
| owenfx-content-opt-20261114 | stopped |
| owenfx-next16-lockcheck | stopped |
| owenfx-next16-codemod | stopped |
| owenfx-security-lint-audit-1111 | stopped |
| owenfx-ci-check | stopped |

说明：删除前 Session API 返回 13 条；删除全部命名 Sandbox 后，Session API 复查返回 0 条。当前接口无法确认平台底层是否仍保留不可见归档，因此仅报告 API 可见记录已清空。未来默认保留 Sandbox 命名历史和快照；每个项目只保留最新 6 个快照，并按团队范围核对快照存储免费包含量；存储预算不得按项目重复分配。

### 5.6 月度账本模板与后续追加模板

每个自然月单独建立一条月度汇总，默认按 `Asia/Shanghai` 时区每月 1 日 00:00 切换；时区可配置，不得回写已归档月份。

| 自然月 | 周期开始（含） | 周期结束（不含） | 时区 | Sandbox CPU | 内存 GB·h | 创建次数 | Sandbox 传输 | 本月预警 | Dashboard 核对时间 |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| YYYY-MM | YYYY-MM-01 00:00 | 下月 01 00:00 | Asia/Shanghai | 0 | 0 | 0 | 0 GB | 无 | 未核实 |

此表是项目内部自然月台账，不代表 Vercel 平台额度在每月 1 日实际恢复。平台滚动窗口、Web Analytics 7 天恢复规则及 Dashboard 当前余额必须单独记录。

### 5.7 后续任务追加模板

每次实际使用 Sandbox 后，在同一份台账中追加逐实例记录，并追加任务汇总：

| 日期 | 任务 / Commit SHA | Sandbox / session ID | vCPU / 内存 | 墙钟时长 | 活动 CPU | 配置内存 GB·h | 出站 / 端口流量 | 创建次数 | 快照 / Drive | 清理状态 |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
| YYYY-MM-DD | 任务说明 / SHA | 名称 / ID | 2 / 4 GB | 0 分 | 0 分 | 0 | 0 GB | 1 | 无 | 已停止并删除 |

每次记录后同步更新当前自然月汇总，不得只追加明细而不更新当月累计。上月汇总归档后保持只读；平台实际余额仍以 Dashboard 为准，不因内部月度切换重置。

## 6. 每次任务结束时的报告

涉及 Vercel / Sandbox 时固定报告：

1. 套餐与团队、项目范围。
2. Dashboard 统计窗口和读取时间。
3. 本次 Sandbox 创建次数、墙钟时长、活动 CPU、配置内存、数据传输、快照 / Drive 读写。
4. 累计用量与剩余量，逐项展示「包含总量 - 当前累计使用 = 剩余」。
5. 额度状态：正常 / 预警 / 停止 / 未核实。
6. Sandbox、session、快照、Drive 清理状态。
7. 本任务影响的其他 Hobby 指标，单独列账。
8. GitHub 推送、Vercel 构建、生产部署和网站运行验证分开报告。

禁止只说「额度看起来够用」「费用应该不高」「没有查到账单所以是 0」。必须给出来源、数字、公式和剩余量；无法读取的维度标记「未核实」，并自动阻止消耗该维度的操作。

## 7. 官方资料

- Vercel Sandbox 文档：https://vercel.com/docs/sandbox
- Vercel Sandbox 定价与配额：https://vercel.com/pricing
- Vercel Hobby 套餐：https://vercel.com/docs/plans/hobby
- Vercel 套餐总览：https://vercel.com/docs/plans
- Vercel Functions / Fluid Compute 用量与定价：https://vercel.com/docs/functions/usage-and-pricing
- Vercel Usage Dashboard：https://vercel.com/dashboard

官方文档可能更新。每次任务开始前重新核对官方额度，不得把历史数值当成永久不变的承诺。
