export type SurveyBrandId = "hospital" | "nuoma-yuanyi";

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
}

export const brandRegistry: Record<SurveyBrandId, SurveyBrand> = {
  hospital: {
    id: "hospital",
    organization: "建始民族医院",
    subtitle: "衰老与健康管理中心",
    eyebrow: "MALE HEALTH · V1.0",
    questionnaireVersion: "male-health-v1.0",
    draftKey: "nuoma.health-survey.v1.draft",
    basePath: "/health-survey/",
    themeClass: "theme-hospital",
    pageTitle: "健康与功能状态问卷｜建始民族医院",
    pageDescription: "建始民族医院健康与功能状态问卷",
    consentOwner: "院方",
    identityDescription: "信息仅用于院内健康评估与记录匹配。",
  },
  "nuoma-yuanyi": {
    id: "nuoma-yuanyi",
    organization: "诺玛元一",
    subtitle: "生命健康管理",
    eyebrow: "VITALITY PROFILE · V1.0",
    questionnaireVersion: "nuoma-yuanyi-male-health-v1.0",
    draftKey: "nuoma.yuanyi.male-health.v1.draft",
    basePath: "/nuoma-yuanyi-survey/",
    themeClass: "theme-nuoma-yuanyi",
    pageTitle: "健康与功能状态问卷｜诺玛元一",
    pageDescription: "诺玛元一健康与功能状态问卷",
    consentOwner: "诺玛元一",
    identityDescription: "信息仅用于健康评估与记录匹配。",
  },
};

export function getSurveyBrand(id: string): SurveyBrand {
  const brand = brandRegistry[id as SurveyBrandId];
  if (!brand) throw new Error(`未知问卷品牌：${id}`);
  return brand;
}

export const activeBrand = getSurveyBrand(import.meta.env.VITE_SURVEY_BRAND || "hospital");
