# 健康与功能状态问卷

本项目同时提供“建始民族医院”和“诺玛元一”两套独立品牌问卷。两者共享经过验证的55道题、八维非诊断性画像、医学红旗规则和CloudBase安全存储，但使用独立访问路径、页面品牌、问卷版本和48小时本地草稿。医院版采用12个模块页；诺玛元一采用64个单题页，条件补充输入与所属问题同屏。

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

诺玛元一公开地址：<https://yuecheng-survey-d4fucklsf6b68aaf-1388047663.tcloudbaseapp.com/nuoma-yuanyi-survey/>

## 验证

```bash
npm test
npm run typecheck
npm run build:all
```

`npm run build` 生成医院版 `dist/`；`npm run build:nuoma-yuanyi` 生成诺玛元一版 `dist-nuoma-yuanyi/`。

## 项目结构

- `src/domain/questionnaire.ts`：完整V1.0问卷定义。
- `src/domain/survey-flow.ts`：医院模块页与诺玛元一单题页的品牌化导航规则。
- `src/domain/assessment.ts`：内部非诊断性触发规则。
- `src/domain/submission.ts`：提交校验、幂等和数据分离。
- `src/components`：客户填写和结果组件。
- `functions/submitSurvey`：公开提交云函数。
- `functions/adminSurvey`：需身份认证的院内管理API。
- `docs/cloudbase-deployment.md`：云端配置、安全与部署步骤。

问卷不输出衰老总分、身体年龄或疾病诊断。医学安全题任一为“是”时，常规健康管理建议会被临床优先提示替代。
