import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const brandBuilds = {
  hospital: {
    base: "/health-survey/",
    title: "健康与功能状态问卷｜建始民族医院",
    description: "建始民族医院健康与功能状态问卷",
  },
  "nuoma-yuanyi": {
    base: "/nuoma-yuanyi-survey/",
    title: "健康与功能状态问卷｜诺玛元一",
    description: "诺玛元一健康与功能状态问卷",
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

const brandId = process.env.VITE_SURVEY_BRAND || "hospital";
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
