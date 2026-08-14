# 健康与功能状态问卷

本项目提供建始民族医院男性版、建始民族医院女性版和诺玛元一三套独立问卷。医院男女版均采用面向微信的“一题一页”移动端流程，公开链接无需注册；女性版为独立的55题问卷、八维女性健康画像和女性三页PDF。三套问卷共享CloudBase安全存储，但使用独立访问路径、页面品牌、问卷版本和48小时本地草稿。

## 本地运行

```bash
npm install
npm run dev
```

本地预览诺玛元一版本：

```bash
VITE_SURVEY_BRAND=nuoma-yuanyi npm run dev
```

未配置 `VITE_SUBMIT_ENDPOINT` 时，开发环境只生成本地预览结果，不会上传健康数据。仓库中的 `.env.production` 已配置当前CloudBase公开提交地址；更换环境时需同步更新该文件，否则最终提交会显示明确错误且不会伪造成功。

当前公开体验地址：<https://yuecheng-survey-d4fucklsf6b68aaf-1388047663.tcloudbaseapp.com/health-survey/>

建始民族医院女性版：<https://yuecheng-survey-d4fucklsf6b68aaf-1388047663.tcloudbaseapp.com/women-health-survey/>

诺玛元一公开地址：<https://yuecheng-survey-d4fucklsf6b68aaf-1388047663.tcloudbaseapp.com/nuoma-yuanyi-survey/>

## 验证

```bash
npm test
npm run typecheck
npm run build:all
```

`npm run build` 生成医院男性版 `dist/`；`npm run build:hospital-female` 生成医院女性版 `dist-women-health-survey/`；`npm run build:nuoma-yuanyi` 生成诺玛元一版 `dist-nuoma-yuanyi/`。

## 项目结构

- `src/domain/questionnaire.ts`：完整V1.0问卷定义。
- `src/domain/survey-flow.ts`：共享旧流程与诺玛元一单题页的导航规则。
- `src/domain/assessment.ts`：内部非诊断性触发规则。
- `src/domain/submission.ts`：提交校验、幂等和数据分离。
- `src/hospital`：医院版一题一页导航、条件分支、断点续填与临床视觉组件。
- `src/female`：女性55题定义、条件分支、八维评估、独立视觉与填写流程。
- `src/components`：客户填写和结果组件。
- `functions/submitSurvey`：公开提交云函数，以及失败不阻断入库的男女医院摘要/PDF与诺玛元一脱敏概要通知。
- `functions/adminSurvey`：需身份认证的院内管理API。
- `docs/cloudbase-deployment.md`：云端配置、安全与部署步骤。

问卷不输出衰老总分、身体年龄或疾病诊断。医学安全题任一为“是”时，常规健康管理建议会被临床优先提示替代。
