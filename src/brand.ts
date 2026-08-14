export type SurveyBrandId = "hospital" | "hospital-female" | "nuoma-yuanyi";
export type SurveyNavigationMode = "sections" | "questions";

export interface SurveyBrand {
  id: SurveyBrandId;
  organization: string;
  subtitle: string;
  eyebrow: string;
  questionnaireVersion: string;
  draftKey: string;
  basePath: string;
  themeClass: string;
  pageTitle: string;
  pageDescription: string;
  consentOwner: string;
  identityDescription: string;
  navigationMode: SurveyNavigationMode;
}

export const brandRegistry: Record<SurveyBrandId, SurveyBrand> = {
  hospital: {
    id: "hospital",
    organization: "建始民族医院",
    subtitle: "衰老与健康管理中心",
    eyebrow: "MALE HEALTH · V1.0",
    questionnaireVersion: "male-health-v1.0",
    draftKey: "nuoma.health-survey.mobile.v1.draft",
    basePath: "/health-survey/",
    themeClass: "theme-hospital",
    pageTitle: "健康与功能状态问卷｜建始民族医院",
    pageDescription: "建始民族医院健康与功能状态问卷",
    consentOwner: "院方",
    identityDescription: "信息仅用于院内健康评估与记录匹配。",
    navigationMode: "sections",
  },
  "hospital-female": {
    id: "hospital-female",
    organization: "建始民族医院",
    subtitle: "衰老与健康管理中心",
    eyebrow: "WOMEN'S HEALTH · V1.0",
    questionnaireVersion: "female-health-v1.0",
    draftKey: "nuoma.hospital.female-health.v1.draft",
    basePath: "/women-health-survey/",
    themeClass: "theme-hospital-female",
    pageTitle: "女性健康与功能状态问卷｜建始民族医院",
    pageDescription: "建始民族医院女性健康与功能状态问卷",
    consentOwner: "院方",
    identityDescription: "信息仅用于院内健康评估与记录匹配。",
    navigationMode: "questions",
  },
  "nuoma-yuanyi": {
    id: "nuoma-yuanyi",
    organization: "诺玛元一",
    subtitle: "生命健康管理",
    eyebrow: "VITALITY PROFILE · V1.0",
    questionnaireVersion: "nuoma-yuanyi-male-health-v1.0",
    draftKey: "nuoma.yuanyi.male-health.v1.single-question.draft",
    basePath: "/nuoma-yuanyi-survey/",
    themeClass: "theme-nuoma-yuanyi",
    pageTitle: "健康与功能状态问卷｜诺玛元一",
    pageDescription: "诺玛元一健康与功能状态问卷",
    consentOwner: "诺玛元一",
    identityDescription: "信息仅用于健康评估与记录匹配。",
    navigationMode: "questions",
  },
};

export function getSurveyBrand(id: string): SurveyBrand {
  const brand = brandRegistry[id as SurveyBrandId];
  if (!brand) throw new Error(`未知问卷品牌：${id}`);
  return brand;
}

export const activeBrand = getSurveyBrand(import.meta.env.VITE_SURVEY_BRAND || "hospital");
