import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const brandBuilds = {
  hospital: {
    base: "/health-survey/",
    title: "健康与功能状态问卷｜建始民族医院",
    description: "建始民族医院健康与功能状态问卷",
  },
  "hospital-female": {
    base: "/women-health-survey/",
    title: "女性健康与功能状态问卷｜建始民族医院",
    description: "建始民族医院女性健康与功能状态问卷",
  },
  "nuoma-yuanyi": {
    base: "/nuoma-yuanyi-survey/",
    title: "健康与功能状态问卷｜诺玛元一",
    description: "诺玛元一健康与功能状态问卷",
  },
  "market-preadmission": {
    base: "/market-preadmission/",
    title: "患者预住院登记｜建始民族医院",
    description: "建始民族医院患者预住院登记系统",
  },
} as const;

export function resolveBrandMetadata(id = "hospital") {
  const metadata = brandBuilds[id as keyof typeof brandBuilds];
  if (!metadata) throw new Error(`未知问卷品牌：${id}`);
  return metadata;
}

export function resolveBrandBase(id = "hospital") {
  return resolveBrandMetadata(id).base;
}

export function assertMarketBuildEnvironment(id: string, environment: Record<string, string | undefined>) {
  if (id !== "market-preadmission") return;
  for (const name of ["VITE_CLOUDBASE_ENV_ID", "VITE_CLOUDBASE_ACCESS_KEY"] as const) {
    if (!environment[name]?.trim()) throw new Error(`市场预住院构建缺少 ${name}`);
  }
}

const brandId = process.env.VITE_SURVEY_BRAND || "hospital";
const buildEnvironment = {
  ...loadEnv(process.env.NODE_ENV === "test" ? "test" : "production", process.cwd(), ""),
  ...process.env,
};
assertMarketBuildEnvironment(brandId, buildEnvironment);
const metadata = resolveBrandMetadata(brandId);

export default defineConfig({
  base: metadata.base,
  plugins: [
    react(),
    {
      name: "survey-brand-metadata",
      transformIndexHtml(html) {
        return html
          .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${metadata.description}" />`)
          .replace(/<title>[^<]*<\/title>/, `<title>${metadata.title}</title>`);
      },
    },
  ],
});
