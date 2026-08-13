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

## 构建与部署

公开提交函数只接受医院版 `male-health-v1.0` 与诺玛元一版 `nuoma-yuanyi-male-health-v1.0`。其他版本直接拒绝且不落库。

```bash
npm ci
npm test
npm run typecheck
npm run build:all
npx @cloudbase/cli login
npx @cloudbase/cli fn deploy submitSurvey -e yuecheng-survey-d4fucklsf6b68aaf
npx @cloudbase/cli fn deploy adminSurvey -e yuecheng-survey-d4fucklsf6b68aaf
```

`npm run build` 生成医院版 `dist/`；`npm run build:nuoma-yuanyi` 生成诺玛元一版 `dist-nuoma-yuanyi/`。静态托管分别部署到 `health-survey` 与 `nuoma-yuanyi-survey` 目录。

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

只使用虚构测试数据提交一次，确认五个集合均出现相同 `sessionId` 的记录；确认公开页面不能读取集合；确认红旗测试记录在 `health_survey_sessions.hasRedFlag` 为 `true`。验收完成后删除虚构测试记录及其审计记录。

## 已知上游依赖风险

截至 2026-08-13，最新版 `@cloudbase/node-sdk@3.18.3` 仍传递依赖旧版 `axios`、`lodash.set` 和 `lodash.unset`，`npm audit` 会报告高风险项。项目已采取以下限制：

- SDK只存在于服务端云函数，不进入浏览器包；
- 客户输入仅保留问卷白名单字段；
- 不允许客户控制SDK请求地址、请求头或数据库操作符；
- 数据库拒绝任何客户端直读写。

正式承载真实健康数据前，应重新检查腾讯云SDK版本与安全公告；若上游仍未修复，由医院信息安全负责人决定是否接受风险或改用无该依赖的数据服务接口。
