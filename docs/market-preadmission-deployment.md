# 市场预住院系统 CloudBase 部署手册

本文档用于把已完成的市场预住院应用发布到现有 CloudBase 环境。真实患者导出文件、账号密码和企业微信群机器人地址不得提交到 Git。

## 1. 发布前检查

在项目根目录执行：

```bash
npm ci
npm test
python3 -m unittest scripts/test_export_market_patient_data.py -v
npm run typecheck
npm run build:market-preadmission
npm run build:functions
```

预期结果：测试和类型检查全部通过，生成 `dist-market-preadmission/` 与 `functions/marketPreadmission/index.js`。

## 2. 配置浏览器端公开参数

在本机未提交的 `.env.local` 中填写：

```dotenv
VITE_CLOUDBASE_ENV_ID=your-environment-id
VITE_CLOUDBASE_ACCESS_KEY=your-publishable-key
```

`VITE_CLOUDBASE_ACCESS_KEY` 是 CloudBase 身份认证 V2 的可发布密钥，会进入浏览器产物；不得在此处填写腾讯云 SecretId、SecretKey 或企业微信群机器人地址。

在 CloudBase 控制台确认已开启“用户名 + 密码”登录。

## 3. 创建集合与索引

创建以下集合：

1. `hospital_market_users`
2. `hospital_patients`
3. `hospital_encounters`
4. `hospital_diagnosis_stats`
5. `hospital_preadmissions`
6. `hospital_preadmission_notification_logs`
7. `hospital_market_audit_logs`

索引清单同时保存在 `cloudbase/market-indexes.json`，创建或复核环境时必须以该文件为准：

| 集合 | 索引字段 | 规则 |
|---|---|---|
| `hospital_market_users` | `uid` | 唯一 |
| `hospital_patients` | `patientId` | 唯一 |
| `hospital_patients` | `name` | 普通 |
| `hospital_patients` | `phone` | 普通 |
| `hospital_patients` | `hospitalNo` | 普通 |
| `hospital_encounters` | `patientId` | 普通 |
| `hospital_diagnosis_stats` | `patientId` | 普通 |
| `hospital_preadmissions` | `recordId` | 唯一 |
| `hospital_preadmissions` | `clientSubmissionId` | 唯一 |
| `hospital_preadmissions` | `createdByUid`, `createdAt` | 组合，`createdAt` 降序 |
| `hospital_preadmission_notification_logs` | `recordId`, `createdAt` | 组合 |
| `hospital_market_audit_logs` | `uid`, `createdAt` | 组合，`createdAt` 降序 |

对以上七个集合逐一设置客户端安全规则：

```json
{
  "read": false,
  "write": false
}
```

该规则只拒绝浏览器直接读写；事件云函数使用服务端 SDK 访问集合。

## 4. 导出并导入历史患者数据

在仓库外创建一个受保护目录，然后运行：

```bash
python3 scripts/export_market_patient_data.py \
  --source "/absolute/private/path/hospital_health.db" \
  --output "/absolute/private/path/market-import"
```

脚本只读打开 SQLite，生成：

- `patients.jsonl` → `hospital_patients`
- `encounters.jsonl` → `hospital_encounters`
- `diagnosis_stats.jsonl` → `hospital_diagnosis_stats`
- `manifest.json` → 留存在受保护目录，用于核对记录数和 SHA-256，不导入数据库

在 CloudBase 控制台“文档型数据库 → 集合管理 → 导入”中选择 JSON 格式。首次空库导入选择 Insert。导入完成后，分别核对控制台记录数与 `manifest.json` 中的 `patients`、`encounters`、`diagnosisStats`。

如需重新导入，先在隔离测试环境验证流程；不要直接对生产集合执行覆盖或清空。

## 5. 创建市场账号

账号采用 `sc001`、`sc002`、…、`sc099`。CloudBase 身份认证 V2 的用户名至少 5 位，因此不使用四位账号。显示名可用“市场人员01”“市场人员02”或员工姓名。试用阶段预建 `sc002` 至 `sc021` 共 20 个市场账号，保留 `sc001` 为管理员账号，不对普通市场人员分发。

每个账号执行两步：

1. 在 CloudBase 身份认证控制台创建用户并设置用户名和初始强密码。
2. 把该用户 UID 写入 `hospital_market_users`：

```json
{
  "uid": "cloudbase-user-uid",
  "username": "sc001",
  "displayName": "市场一组",
  "role": "market",
  "active": true,
  "createdAt": "2026-09-07T00:00:00.000Z",
  "updatedAt": "2026-09-07T00:00:00.000Z"
}
```

管理员账号把 `role` 设为 `admin`。初始密码不得与账号相同，不在群聊中发送密码；建议首次交付后由使用人更换。

## 6. 配置云函数和安全规则

先构建并部署新函数：

```bash
npm run build:functions
tcb fn deploy marketPreadmission --install-dependency true -e your-environment-id
```

在 CloudBase 控制台为 `marketPreadmission` 设置环境变量：

```text
JSMZ_PREADMISSION_WECOM_WEBHOOK_URL
```

只在控制台密文输入框中粘贴机器人地址。不要把值写入 `.env`、部署命令、截图、工单或应用日志。考虑到原机器人地址曾经通过对话传递，上线前应在企业微信群中重新生成机器人 key，并只配置新地址。

在“云函数 → 权限控制”中合并规则；如果环境已有规则，先导出保存并逐项确认，不能直接覆盖。与公开问卷共用环境时，可保留原有公开函数配置，并为市场系统增加更严格的具体规则：

```json
{
  "*": { "invoke": true },
  "marketPreadmission": { "invoke": "auth.loginType != 'ANONYMOUS' && auth != null" }
}
```

具体函数名的规则优先于 `*`。因此现有公开问卷仍可匿名提交，但 `marketPreadmission` 会拒绝匿名调用；函数内部还会再次根据 UID 查询 `hospital_market_users`，落实市场人员和管理员权限。

## 7. 发布静态页面

重新构建后，把产物部署到与 Vite 基础路径一致的目录：

```bash
npm run build:market-preadmission
tcb hosting deploy ./dist-market-preadmission market-preadmission \
  -e your-environment-id \
  --safe \
  --verify
```

不要使用 `--prune`，以免删除同一静态托管环境中的既有问卷文件。

CloudBase 默认 `*.tcloudbaseapp.com` 域名只作为内部联调地址：首次访问会出现风险提示中间页，且平台明确不建议将默认域名用于正式生产。正式交给市场人员前，应绑定已完成 ICP 备案的医院自定义域名，并将 `/market-preadmission/` 作为正式入口；绑定后再用该域名完成一次登录、患者查询和合成登记验收。

## 8. 上线验收

按顺序检查：

1. 未登录打开页面，只能看到登录框；不能查询患者。
2. 错误账号和密码只显示统一错误，不泄露账号是否存在。
3. 停用账号和未写入角色集合的账号无法进入。
4. 用姓名、手机号、住院号各查询一次；同名患者必须由人员选择，系统不自动合并。
5. 核对一位历史患者的住院次数、主要诊断、入院与出院日期；空出院日期显示“出院日期未记录”。
6. 点击“新患者首次登记”，使用合成姓名和虚构联系电话完成一条无历史住院记录的登记；提交后确认该新患者可按姓名或电话查回，且未与同名/同号患者自动合并。
7. 使用合成患者“测试患者-请勿联系”和虚构联系电话完成登记。
8. 群消息包含合成患者的完整姓名和完整联系电话，但不包含详细住院史、住址等无关字段。
9. 暂时配置一个无效测试地址，确认登记仍保存且页面显示推送失败；恢复配置后点击重新推送。
10. 连续点击或重复提交同一登记，确认只产生一条记录，成功消息不重复发送。
11. 在桌面和手机宽度下分别完成一次键盘/触屏操作。
12. 核对患者类型仅有城镇职工医保、低保人员医保、普通居民医保、特困供养人员医保、自费；拟住院科室仅有风湿免疫科、康复科、老年医学科、住院内一科、住院外一科。

企业微信群机器人消息发出后无法由本系统撤回。真实群验收只能使用合成身份；删除数据库测试记录不会删除群内消息。

## 9. 日常运维

- 人员离职或调岗时，同时在身份认证与 `hospital_market_users` 中停用账号。
- 每周检查 `notificationStatus=failed` 的记录和通知日志错误码，不在日志中复制患者消息正文。
- 每月抽查审计日志是否存在异常高频搜索或越权失败。
- 更新患者历史数据前先生成新清单，对比记录数、身份风险数和源 SHA-256，再在测试环境验证。
- 群机器人更换后只更新函数环境变量并发布函数配置，不重新构建前端。
