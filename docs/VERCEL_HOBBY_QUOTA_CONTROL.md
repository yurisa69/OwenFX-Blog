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
8. 默认使用一次性、非持久化 Sandbox；不创建快照、不创建 Drive、不复用其他任务 Sandbox。
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
| 快照存储 | 15 GB（终身包含） | 按实际快照大小计量；默认不创建 |
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

## 3. 额度周期与重置

1. Hobby 是免费套餐，没有 Pro 式月度账单周期；官方说明指出，超出大多数使用限制后通常需要等待 30 天，部分功能恢复窗口不同。
2. 不得仅因进入每月 1 日就把所有余额手动归零。每项指标的实际窗口、重置时间和恢复状态以 Vercel Usage Dashboard 为准。
3. 月度额度使用 Dashboard 当前统计窗口；Speed Insights 等滚动 30 天指标单独记录。
4. 快照和 Drive 存储为终身包含额度，不按月重置。
5. 每次预检记录 Dashboard 的统计窗口起止时间和查询时间；未显示重置日期时不得自行推算。
6. 额度恢复后必须重新读取 Dashboard 确认，不能仅凭等待天数推断恢复。

## 4. 每次 Sandbox 任务的自动核算流程

### 4.1 创建前预检

1. 读取 Vercel 团队和项目，确认套餐与团队内全部项目范围。
2. 查询 Dashboard 中 Sandbox CPU、配置内存、创建次数、数据传输、快照、Drive 读写和存储当前值；同时检查本任务可能影响的其他 Hobby 指标。
3. 列出团队内现存 Sandbox，识别运行中实例、持久化实例、快照和 Drive。
4. 读取 GitHub 最新 main SHA，记录完整 Commit SHA。
5. 根据预计 vCPU、内存、运行时间和创建次数，计算预计用量及完成后的剩余量。
6. 任一相关指标预计超出剩余额度，或无法核实本任务可能消耗的额度时，自动停止 Sandbox 路径；不创建、不重试、不升级、不要求用户再次确认。可继续不消耗该资源的只读检查或纯文档工作。

### 4.2 默认配置

- 使用非持久化配置。
- 默认 2 vCPU / 4 GB；任务适合时使用 1 vCPU / 2 GB。
- 单次 session 不超过 Hobby 45 分钟上限。
- 不创建快照、不创建 Drive、不挂载持久化存储。
- 不开放端口；确需开放时将端口双向流量纳入预算。
- 任务完成立即停止 Sandbox，不等待超时。
- 不复用其他任务 Sandbox，不通过持久化或快照绕过单次时长限制。

### 4.3 停止后记录

至少记录 Sandbox 名称、项目、团队、创建时间、session ID、基线 SHA、vCPU、配置内存、区域、持久化状态、端口状态、墙钟时长、活动 CPU、配置内存 GB·小时、出站及端口流量、创建次数、快照/Drive 用量、停止时间、清理结果、数据来源和查询时间。

计算公式：

- 活动 CPU 小时 = totalActiveCpuDurationMs / 3,600,000
- 配置内存 GB·小时 = (memoryMB / 1024) × totalDurationMs / 3,600,000
- 墙钟运行小时 = totalDurationMs / 3,600,000
- 剩余额度 = Hobby 包含额度 - 当前统计窗口累计使用量

活动 CPU 与墙钟时间不是同一指标。内存按配置量 × 墙钟时间计量。持久化 Sandbox 多次停止/恢复时累计所有 session，但每次连续 session 仍遵守 45 分钟上限。

### 4.4 余额扣减

1. 每次任务结束后更新第 5 节台账。
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
5. 快照和 Drive 实际占用未核实前，禁止创建新的快照或 Drive。
6. 用户无需为正常免费额度内的任务逐次批准；涉及付费、升级、超额或权限扩大时，本项目默认不执行。

## 5. Vercel Sandbox 使用台账

### 5.1 当前核算基线（2026-11-21）

数据来自 Vercel 团队 owen-sove、项目 owenfx-blog 的命名 Sandbox 列表。团队当前列出 1 个项目、11 个命名 Sandbox，全部已停止。CPU、内存、时长和网络按 API 返回的逐实例累计指标汇总。Dashboard 是最终总账，本表是逐实例核对基线。

| 指标 | Hobby 包含量 | 当前已用 | 保守剩余 |
| --- | ---: | ---: | ---: |
| Sandbox 活动 CPU | 5 小时 | 0.5880 小时（约 35 分 17 秒） | 4.4120 小时（约 4 小时 24 分 43 秒） |
| Sandbox 配置内存 | 420 GB·小时 | 21.5401 GB·小时 | 398.4599 GB·小时 |
| Sandbox 创建 | 5,000 次 | 11 次 | 4,989 次 |
| Sandbox 数据传输 | 20 GB | 2.0071 GB（入站+出站保守合计） | 至少 17.9929 GB |
| Sandbox 墙钟运行时长 | 非独立额度 | 5.3850 小时（约 5 小时 23 分 6 秒） | 用于计算内存 |
| 并发 Sandbox | 10 个 | 当前运行 0 个 | 当前可用并发 10 个 |
| 快照存储 | 15 GB（终身） | 2 个保留快照，实际占用未取得 | 未核实，禁止新建 |
| Drive 存储 | 15 GB（终身） | 未取得可靠用量 | 未核实，禁止新建 |
| Drive 读取 | 30 GB / 月 | 未取得可靠用量 | 未核实，禁止挂载读取 |
| Drive 写入 | 30 GB / 月 | 未取得可靠用量 | 未核实，禁止挂载写入 |

网络说明：

- API 返回出站约 0.0234 GB、入站约 1.9837 GB。
- 官方规则说明普通下载入站流量（例如 npm 包和 Git 仓库）不计费，但当前 API 汇总没有把普通下载和暴露端口流量拆分。
- 为防止低估，当前账本暂将入站与出站合计 2.0071 GB 全部预留扣减；17.9929 GB 是保守下限，不代表已确认的实际计费流量。
- 后续必须从 Usage Dashboard 核实 Sandbox Data Transfer 官方汇总，再校准总账并保留历史估算。

快照 / Drive 说明：

- 11 个命名 Sandbox 中有 2 个持久化 Sandbox 保留当前快照 ID；快照实际 GB 数未在列表中提供。
- Sandbox 列表未返回 Drive 实际存储、读取或写入计量，不能推断已用量为 0。
- 不删除这 2 个历史快照，也不删除其他任务资源。

### 5.2 历史 Sandbox 逐实例记录（截至 2026-11-21）

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

本次未创建、启动或复用 Sandbox；未创建快照或 Drive；Sandbox 扣减为 0。GitHub 文档提交和 Vercel 自动构建属于独立资源，不计入 Sandbox CPU / 内存 / 创建次数。

### 5.4 后续任务追加模板

每次实际使用 Sandbox 后，在同一份台账中追加逐实例记录，并追加任务汇总：

| 日期 | 任务 / Commit SHA | Sandbox / session ID | vCPU / 内存 | 墙钟时长 | 活动 CPU | 配置内存 GB·h | 出站 / 端口流量 | 创建次数 | 快照 / Drive | 清理状态 |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
| YYYY-MM-DD | 任务说明 / SHA | 名称 / ID | 2 / 4 GB | 0 分 | 0 分 | 0 | 0 GB | 1 | 无 | 已停止并删除 |

每次记录后同步更新 5.1 节累计余额，不能只追加明细而不扣减余额。

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
