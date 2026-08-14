# CloudBase 部署与安全配置

## 目标环境

- 环境 ID：`yuecheng-survey-d4fucklsf6b68aaf`
- 前端：CloudBase 静态网站托管
- 公开提交函数：`submitSurvey`（Event函数，经SCF网关公开）
- 受保护管理函数：`adminSurvey`（Event函数，经SCF网关鉴权）

## 上线前控制台配置

1. 确认套餐已续期；核验时控制台显示有效期至 2026-08-20。
2. 新建集合：`health_survey_sessions`、`health_respondent_profiles`、`health_survey_answers`、`health_assessment_results`、`health_audit_logs`。
3. 所有集合设置为客户端不可读、不可写。参考 `cloudbase/database-deny-all.rules.json`；只有云函数使用服务端权限访问。
4. 为 `health_survey_sessions.clientSubmissionId` 建唯一索引，为 `health_survey_sessions.confirmationId` 建唯一索引。
5. 为四个子集合的 `sessionId` 建普通索引。
6. 为 `health_survey_sessions.submittedAt` 和 `health_survey_sessions.hasRedFlag` 建索引。
7. 为 `adminSurvey` 的 HTTP 网关开启身份认证。
8. 在 `adminSurvey` 环境变量 `ADMIN_UIDS` 中填写允许访问的 CloudBase 用户 UID，多个 UID 用英文逗号分隔。
9. `submitSurvey` 已将 `ALLOWED_ORIGIN` 限定为当前静态托管域名；绑定自定义域名后同步修改此值，不要在生产环境使用 `*`。
10. 在 `submitSurvey` 云函数环境变量中配置 `HOSPITAL_WECHAT_WEBHOOK_URL` 与 `NUOMA_YUANYI_WECOM_WEBHOOK_URL`。医院男女版共用前者并推送至同一院内群，诺玛元一使用后者；这些值不得写入仓库、构建日志或前端变量。

## 构建与部署

公开提交函数只接受医院男性版 `male-health-v1.0`、医院女性版 `female-health-v1.0` 与诺玛元一版 `nuoma-yuanyi-male-health-v1.0`。其他版本直接拒绝且不落库。

```bash
npm ci
npm test
npm run typecheck
npm run build:all
npx -y -p @cloudbase/cli tcb login
npx -y -p @cloudbase/cli tcb fn deploy submitSurvey -e yuecheng-survey-d4fucklsf6b68aaf
npx -y -p @cloudbase/cli tcb fn deploy adminSurvey -e yuecheng-survey-d4fucklsf6b68aaf
npx -y -p @cloudbase/cli tcb hosting deploy dist health-survey -e yuecheng-survey-d4fucklsf6b68aaf
npx -y -p @cloudbase/cli tcb hosting deploy dist-women-health-survey women-health-survey -e yuecheng-survey-d4fucklsf6b68aaf
npx -y -p @cloudbase/cli tcb hosting deploy dist-nuoma-yuanyi nuoma-yuanyi-survey -e yuecheng-survey-d4fucklsf6b68aaf
```

`cloudbaserc.json` 不声明云函数环境变量，避免代码部署时覆盖云端保存的机器人密钥。首次部署或更换环境后，应在控制台单独设置 `ALLOWED_ORIGIN`、`HOSPITAL_WECHAT_WEBHOOK_URL` 和 `NUOMA_YUANYI_WECOM_WEBHOOK_URL`，再通过只显示变量名称、不显示值的方式核验。医院通知使用带图标与颜色标签的单条 Markdown，包含四级跟进状态、姓名、完整手机号、3个主要问题、最明显变化、首要改善目标、八维分类数量、上海时间和记录编号；红旗记录只显示“需医务人员优先核实”和“安全信息待人工核实”，不展示具体答案。由于群内展示完整手机号，机器人只能加入经授权的院内工作群。诺玛元一通知仅包含记录编号、安全状态、评估方向、变化信号和12周目标，不包含姓名、手机号、开放文本、逐题答案或具体红旗内容。通知失败会写审计日志，但不会回滚已成功入库的问卷。

医院摘要之后，系统使用同一机器人上传并发送三页 A4 客户版 PDF。男性版展示核心诉求、八维状态、生活方式和12周目标；女性版展示生命周期、重点需求、八维女性状态、筛查时间、生活方式、既往线索和后续路径。PDF由云函数使用随包部署的 Noto Sans CJK SC 开源字体生成，不调用第三方报告服务；逐题答案、具体医学安全答案和内部触发规则不进入群附件，仍只能通过鉴权保护的 `adminSurvey` 读取。男性摘要/PDF审计为 `hospital_wecom_notification`、`hospital_wecom_report_notification`；女性摘要/PDF审计为 `hospital_female_wecom_notification`、`hospital_female_wecom_report_notification`。任一通知失败均不回滚已入库问卷。

`npm run build` 生成医院男性版 `dist/`；`npm run build:hospital-female` 生成医院女性版 `dist-women-health-survey/`；`npm run build:nuoma-yuanyi` 生成诺玛元一版 `dist-nuoma-yuanyi/`。静态托管分别部署到 `health-survey`、`women-health-survey` 与 `nuoma-yuanyi-survey` 目录。

三套构建共享提交协议，但题目与前端导航按版本隔离：医院男性版为现有临床流程，医院女性版为55题和10个女性健康模块，诺玛元一按64个主问题逐题填写。每套页面均使用独立草稿键。

函数部署后，在CloudBase默认域名上创建两条SCF路由：`/api/submit-survey` 指向 `submitSurvey` 并关闭身份认证，设置总QPS和单IP QPS限制；`/api/admin-survey` 指向 `adminSurvey` 并开启身份认证。

仓库中的 `.env.production` 已指向当前 `submitSurvey` HTTP 地址。更换环境或路由后更新：

```dotenv
VITE_SUBMIT_ENDPOINT=https://实际网关地址/api/submit-survey
```

重新运行 `npm run build`，再通过CloudBase“静态网站托管 → Git仓库部署”连接 GitHub 仓库，设置：

- 安装命令：`npm ci`
- 构建命令：`npm run build`
- 构建产物：`dist`
- Node.js：20.x

## 数据验收

只使用明确标注为“系统测试”的虚构数据提交一次，确认五个集合均出现相同 `sessionId` 的记录；确认公开页面不能读取集合；确认红旗测试记录在 `health_survey_sessions.hasRedFlag` 为 `true`；医院男性版确认 `hospital_wecom_notification`，医院女性版确认 `hospital_female_wecom_notification` 与 `hospital_female_wecom_report_notification`，诺玛元一版确认 `nuoma_yuanyi_wecom_notification` 的审计状态为 `sent`。验收完成后按精确会话 ID 删除虚构测试记录及其审计记录。企业微信群机器人消息无法随数据库记录一同撤回；更换群机器人时应立即替换云函数环境变量并撤销旧机器人地址。

## 已知上游依赖风险

截至 2026-08-13，生产依赖执行 `npm audit --omit=dev` 未发现已知漏洞。项目仍采取以下边界限制：

- SDK只存在于服务端云函数，不进入浏览器包；
- 客户输入仅保留问卷白名单字段；
- 不允许客户控制SDK请求地址、请求头或数据库操作符；
- 数据库拒绝任何客户端直读写。

正式承载真实健康数据前及每次升级后，应重新检查腾讯云SDK版本与安全公告。
