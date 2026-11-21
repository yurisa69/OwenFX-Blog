---
name: owenfx-release-check
description: OwenFX 发布前检查、测试、GitHub main 提交推送、Vercel 构建/生产部署核对与发布报告规范。准备提交、推送或发布网站更新时使用。
---

# OwenFX 发布检查规范

## 1. 发布原则

- 生产源码分支为 `main`。
- 用户已明确要求直接更新 `main` 时，不创建开发分支、Pull Request 或预览部署。
- 不逐文件提交、不分批 Commit/Push。全部修改完成后统一检查，一个完整 Commit，一次 Push。
- 先保护当前远程历史，不强制推送，不重写或覆盖未知提交。
- Vercel 按现有 Git 集成自动部署；不要无必要地手动触发重复部署。
- 如果 Vercel Hobby 部署额度不足或出现额度限制，立即暂停，不重复试错，不擅自建议升级或产生费用。

## 2. 发布前核对

1. 确认仓库为 `yurisa69/OwenFX-Blog`，目标分支为 `main`。
2. 获取当前远程 HEAD，确认与开始修改时的基准一致；若远程出现新提交，先审查差异并安全整合，不能覆盖。
3. 检查工作区和完整变更清单；确保只包含本次批准范围。
4. 阅读 `docs/DEVELOPMENT_GUIDELINES.md` 及本次涉及的专项 Skill / 数据库规范。
5. 检查密钥、Token、私钥、数据库凭据、用户数据、备份文件、调试输出和临时文件是否误入提交。
6. 确认没有未经批准的数据库操作、表结构变更、生产数据修改或 R2 对象删除。

## 3. 测试选择

以当前 `package.json` 和实际变更为准。仓库当前已定义：
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:markdown`
- `npm run test:editor`
- `npm run build`
- `npm run check:supabase-migrations`

Node 主版本由仓库根目录 `.nvmrc` 指定；当前为 Node.js 24。安装依赖使用锁文件对应的方式（当前为 `npm ci`）。`npm run typecheck` 会先运行 Next.js `typegen` 生成路由类型，再执行 `tsc --noEmit`。

### ESLint 版本与插件兼容性

- 调整 ESLint 或 Next.js ESLint 配置前，先核对 `eslint`、`eslint-config-next` 及其实际解析到的插件版本和 `peerDependencies`，并检查对应版本的官方支持状态。
- 不使用 `--legacy-peer-deps`、手工改写锁文件或隐藏安装警告的方式掩盖依赖声明不匹配。
- 当前项目保留 ESLint `10.14.0`；`eslint-config-next@16.4.6` 声明支持 ESLint 9 及以上，部分上游插件的 peer range 尚未包含 ESLint 10。现有 `npm ci` 可完成，相关警告属于上游 peer metadata 尚未更新，不是本次 lint 失败原因。
- 不为消除上述警告而降级到已结束维护周期的 ESLint 9；待上游插件更新 peer 声明后再复核依赖树。
- 只有在官方兼容性核查确认确有运行时问题时，才评估调整依赖版本；不得仅凭 npm peer warning 自动降级。

按变更选择并执行测试：
- UI/组件/页面：lint、相关测试、build；必要时浏览器检查主要视口。
- Markdown/文章编辑器：Markdown、编辑器转换、文章编号相关测试及完整测试。
- 数据库 migration：检查 SQL、迁移账本并运行 `npm run check:supabase-migrations`；生产执行必须作为单独授权操作。
- 纯文档变更：检查 Markdown 结构、链接、路径、Frontmatter 和差异；是否运行完整构建按实际风险决定。

不要把未执行的命令写成通过。测试失败时先定位原因，不通过删除测试或放宽安全约束来获得绿色结果。

## 4. Commit 与 Push

- 所有修改完成后再统一检查完整 diff。
- 一个逻辑完整的任务只创建一个中文提交说明的 Commit；不逐文件提交。
- 提交说明准确描述内容，例如「文档：新增 OwenFX 项目 Skill 规范」。
- 推送前再次核对 `main` 当前 HEAD，使用安全的非强制更新方式。
- 若远程 HEAD 已变化、发生冲突、权限不足或分支保护阻止更新，立即停止并报告；不得强制覆盖。
- 推送后重新读取远程 `main`，核对最新 Commit SHA 和变更文件，不能把本地创建提交等同于推送成功。

## 5. Vercel 状态核对

提交和推送后分别确认：
1. GitHub `main` 是否包含目标 Commit。
2. Vercel 是否收到对应 Commit。
3. Build 状态是成功、失败、进行中、未触发还是未检查。
4. Production Deployment 是否成功，域名是否指向该部署。
5. 网站实际运行是否经过检查。

提交成功不代表推送成功；推送成功不代表构建成功；构建成功不代表生产部署成功；生产部署成功也不等于所有页面和业务功能正常。

不要声称网站已正常运行，除非实际验证了对应页面和流程。若没有浏览器或生产访问能力，明确写「网站运行验证未执行」。

## 6. 失败处理

- Build 失败：读取具体日志，定位错误文件和原因；不要自动回退、删除功能、关闭 lint 或修改数据库来掩盖失败。
- Git 推送失败：先检查远程 HEAD、权限和保护规则；不得重复创建多个提交或使用 force push。
- Vercel 额度不足：暂停后续部署尝试，保留 GitHub 状态并如实报告。
- 生产功能异常：记录复现路径与影响，优先评估最小修复；回退源码前确认是否涉及数据库、外部存储或数据兼容性。
- 任何不可逆操作、数据删除、权限扩大、费用支出均须事先获得明确批准。

## 7. 发布报告模板

用简体中文逐项报告：
1. 修改文件与内容。
2. 源码检查结果。
3. 测试命令及实际结果（通过/失败/未执行）。
4. Commit 提交说明与 SHA。
5. Push 推送结果及目标分支。
6. GitHub 最新分支状态。
7. Vercel 构建状态。
8. 生产部署状态。
9. 网站实际运行验证范围。
10. 未完成事项、限制或风险。

只报告工具或实际检查证据支持的结果。不得将「已提交」「已推送」「已构建」「已部署」「网站正常」混为一个状态。

## 8. 指定版本回退：main 历史回溯

用户要求将网站源码恢复到指定版本时，必须使用「main 历史回溯」，不得使用强制推送或历史重写。

执行规则：

1. 先阅读 `docs/DEVELOPMENT_GUIDELINES.md` 第 9 节，遵循其中的完整流程。
2. 读取目标 Commit 的完整 Git Tree，并以目标 Tree 的全部文件状态为准；不得逐文件手动反向修改。
3. 核对当前远程 `main` HEAD，基于该 HEAD 创建一个新的回退 Commit，父提交必须是回退前的当前 `main` HEAD。
4. 创建的回退 Commit 必须指向与目标版本完全相同的 Tree SHA。
5. 仅通过普通 fast-forward 更新远程 `main`；禁止 force push、force-with-lease、reset 远程分支或改写历史。
6. 目标版本之后的旧 Commit 必须继续保留在 Git 历史中。源码文件状态与目标版本相同，不代表 Git 历史相同。
7. Git 回退不影响 Supabase 数据、数据库迁移历史、R2 对象、环境变量或 Vercel 项目设置；先评估兼容性，不擅自修改外部数据。
8. 更新后核对远程 HEAD、父提交和 Tree SHA，再运行适用检查并跟踪自动部署。保护规则阻止普通更新时立即停止，不绕过限制。
9. 发布报告必须列出目标 SHA、回退 Commit SHA、原 main HEAD、Tree SHA、旧历史保留状态、测试及部署结果；未完成的检查不得写成通过。
