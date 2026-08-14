import { build } from "esbuild";

for (const name of ["submitSurvey", "adminSurvey"]) {
  await build({
    entryPoints: [`functions/${name}/src/index.ts`],
    outfile: `functions/${name}/index.js`,
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    external: ["@cloudbase/node-sdk", "pdfkit"],
    sourcemap: false,
    minify: false,
  });
}
