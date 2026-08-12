# CloudBase 部署与安全配置

## 目标环境

- 环境 ID：`yuecheng-survey-d4fucklsf6b68aaf`
- 前端：CloudBase 静态网站托管
- 公开提交函数：`submitSurvey`
- 受保护管理函数：`adminSurvey`

## 上线前控制台配置

1. 确认套餐已续期；核验时控制台显示有效期至 2026-08-20。
2. 新建集合：`survey_sessions`、`respondent_profiles`、`survey_answers`、`assessment_results`、`audit_logs`。
3. 所有集合设置为客户端不可读、不可写。参考 `cloudbase/database-deny-all.rules.json`；只有云函数使用服务端权限访问。
4. 为 `survey_sessions.clientSubmissionId` 建唯一索引，为 `survey_sessions.confirmationId` 建唯一索引。
5. 为四个子集合的 `sessionId` 建普通索引。
6. 为 `survey_sessions.submittedAt` 和 `survey_sessions.hasRedFlag` 建索引。
7. 为 `adminSurvey` 的 HTTP 网关开启身份认证。
8. 在 `adminSurvey` 环境变量 `ADMIN_UIDS` 中填写允许访问的 CloudBase 用户 UID，多个 UID 用英文逗号分隔。
9. 在 `submitSurvey` 环境变量 `ALLOWED_ORIGIN` 中填写最终问卷域名，不要在生产环境使用 `*`。

## 构建与部署

```bash
npm ci
npm test
npm run typecheck
npm run build:all
npx @cloudbase/cli login
npx @cloudbase/cli fn deploy submitSurvey -e yuecheng-survey-d4fucklsf6b68aaf
npx @cloudbase/cli fn deploy adminSurvey -e yuecheng-survey-d4fucklsf6b68aaf
```

取得 `submitSurvey` 的 HTTP 地址后创建 `.env.production.local`：

```dotenv
VITE_SUBMIT_ENDPOINT=https://实际函数地址
```

重新运行 `npm run build`，再通过CloudBase“静态网站托管 → Git仓库部署”连接 GitHub 仓库，设置：

- 安装命令：`npm ci`
- 构建命令：`npm run build`
- 构建产物：`dist`
- Node.js：20.x

## 数据验收

只使用虚构测试数据提交一次，确认五个集合均出现相同 `sessionId` 的记录；确认公开页面不能读取集合；确认红旗测试记录在 `survey_sessions.hasRedFlag` 为 `true`。验收完成后删除虚构测试记录及其审计记录。

## 已知上游依赖风险

截至 2026-08-13，最新版 `@cloudbase/node-sdk@3.18.3` 仍传递依赖旧版 `axios`、`lodash.set` 和 `lodash.unset`，`npm audit` 会报告高风险项。项目已采取以下限制：

- SDK只存在于服务端云函数，不进入浏览器包；
- 客户输入仅保留问卷白名单字段；
- 不允许客户控制SDK请求地址、请求头或数据库操作符；
- 数据库拒绝任何客户端直读写。

正式承载真实健康数据前，应重新检查腾讯云SDK版本与安全公告；若上游仍未修复，由医院信息安全负责人决定是否接受风险或改用无该依赖的数据服务接口。

