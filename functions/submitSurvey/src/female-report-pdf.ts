import PDFDocument from "pdfkit";
import type { FemaleClientReportModel } from "./female-report-model";

const W = 595.28;
const H = 841.89;
const M = 44;
const CW = W - M * 2;
const PAGES = 3;

const c = {
  plum: "#5E245D", plumDeep: "#351739", iris: "#7658C4", coral: "#DD6A72", gold: "#C79D55",
  teal: "#198E82", ink: "#34263A", muted: "#786A7A", line: "#E8DDE5", ivory: "#FFFAF2",
  lilac: "#F6F0FA", rose: "#FFF0EF", mint: "#EDF8F5", white: "#FFFFFF", red: "#B94259",
};

const levelColor = (level: FemaleClientReportModel["domains"][number]["level"]) => ({
  clinical_priority: c.red, evaluate: c.coral, signal: c.iris, stable: c.teal,
})[level];

function safePart(value: string, max: number) {
  return [...value.replace(/[^\p{L}\p{N} _.\-]/gu, "").replace(/\s+/g, "")].slice(0, max).join("") || "未命名";
}

export function femaleClientReportFilename(model: Pick<FemaleClientReportModel, "name" | "confirmationId">) {
  return `建始民族医院_女性健康评估报告_${safePart(model.name, 24)}_${safePart(model.confirmationId, 40)}.pdf`;
}

function panel(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, fill = c.white, stroke = c.line, r = 12) {
  doc.save().roundedRect(x, y, w, h, r).fillAndStroke(fill, stroke).restore();
}

function label(doc: PDFKit.PDFDocument, text: string, x: number, y: number, color = c.muted) {
  doc.fontSize(8).fillColor(color).text(text, x, y, { lineBreak: false });
}

function value(doc: PDFKit.PDFDocument, text: string, x: number, y: number, w: number, size = 10.5, color = c.ink, h = 36) {
  doc.fontSize(size).fillColor(color).text(text, x, y, { width: w, height: h, ellipsis: true, lineGap: 2 });
}

function pill(doc: PDFKit.PDFDocument, text: string, x: number, y: number, color: string, w = 104) {
  doc.save().roundedRect(x, y, w, 23, 12).fill(color).restore();
  doc.fontSize(8.5).fillColor(c.white).text(text, x, y + 6, { width: w, align: "center", lineBreak: false });
}

function heading(doc: PDFKit.PDFDocument, number: string, title: string, y: number, subtitle?: string) {
  doc.save().circle(M + 10, y + 10, 10).fill(c.plum).restore();
  doc.fontSize(8.5).fillColor(c.white).text(number, M + 1, y + 5, { width: 18, align: "center", lineBreak: false });
  doc.fontSize(14.5).fillColor(c.plumDeep).text(title, M + 29, y + 1, { lineBreak: false });
  if (subtitle) doc.fontSize(8).fillColor(c.muted).text(subtitle, M + 29, y + 22, { width: CW - 29 });
}

function chrome(doc: PDFKit.PDFDocument, model: FemaleClientReportModel, page: number) {
  if (page > 1) {
    const grad = doc.linearGradient(0, 0, W, 0).stop(0, c.plum).stop(.56, c.iris).stop(1, c.coral);
    doc.save().rect(0, 0, W, 7).fill(grad).restore();
    doc.fontSize(9).fillColor(c.plumDeep).text(model.institution, M, 25, { lineBreak: false });
    doc.fontSize(8).fillColor(c.muted).text(model.title, M, 26, { width: CW, align: "right", lineBreak: false });
    doc.save().moveTo(M, 48).lineTo(W - M, 48).strokeColor(c.line).stroke().restore();
  }
  doc.save().moveTo(M, H - 39).lineTo(W - M, H - 39).strokeColor(c.line).stroke().restore();
  doc.fontSize(7.2).fillColor(c.muted).text(`记录编号 ${model.confirmationId}`, M, H - 29, { lineBreak: false });
  doc.text(`第 ${page} / ${PAGES} 页`, W - M - 74, H - 29, { width: 74, align: "right", lineBreak: false });
}

function cover(doc: PDFKit.PDFDocument, model: FemaleClientReportModel) {
  const grad = doc.linearGradient(0, 0, W, 188).stop(0, c.plumDeep).stop(.55, c.plum).stop(1, c.iris);
  doc.save().rect(0, 0, W, 188).fill(grad).restore();
  doc.save().circle(W - 66, 40, 60).lineWidth(1).strokeColor("#BCA9E8").opacity(.42).stroke().restore();
  doc.save().circle(W - 66, 40, 38).lineWidth(1).strokeColor("#F2A7A9").opacity(.48).stroke().restore();
  doc.fontSize(11.5).fillColor("#E7D8E7").text(model.institution, M, 32, { lineBreak: false });
  doc.fontSize(24).fillColor(c.white).text(model.title, M, 62, { width: CW, lineBreak: false });
  doc.fontSize(8.7).fillColor("#DCCFDF").text("女性生命周期 · 功能状态 · 生活方式的综合健康管理参考", M, 101, { width: CW });
  pill(doc, model.followUpLabel, M, 132, model.safetyNotice ? c.red : c.coral, 132);
  doc.fontSize(7.8).fillColor("#DCCFDF").text(`生成时间 ${model.submittedAt}`, W - M - 185, 140, { width: 185, align: "right", lineBreak: false });

  const infoY = 207;
  const gap = 9;
  const iw = (CW - gap * 3) / 4;
  [["姓名", model.name], ["手机号", model.phone], ["年龄", model.ageLabel], ["记录编号", model.confirmationId]].forEach(([k, v], i) => {
    const x = M + i * (iw + gap);
    panel(doc, x, infoY, iw, 57, i === 2 ? c.lilac : c.ivory);
    label(doc, k, x + 12, infoY + 11);
    value(doc, v, x + 12, infoY + 29, iw - 24, 9.5, c.ink, 19);
  });

  heading(doc, "1", "当前女性健康画像", 289, "只呈现问卷体感分类，不计算衰老总分或身体年龄");
  const focusY = 334;
  panel(doc, M, focusY, 314, 100, c.white);
  label(doc, "女性生命周期状态", M + 16, focusY + 14, c.plum);
  value(doc, model.lifecycle, M + 16, focusY + 34, 282, 12.5, c.plumDeep, 43);
  doc.save().roundedRect(M + 16, focusY + 79, 188, 5, 2).fill(c.lilac).restore();
  doc.save().roundedRect(M + 16, focusY + 79, 118, 5, 2).fill(c.iris).restore();

  const scoreX = M + 326;
  panel(doc, scoreX, focusY, CW - 326, 100, c.lilac, "#DCCFE8");
  label(doc, "整体健康自评", scoreX + 16, focusY + 14, c.plum);
  doc.fontSize(35).fillColor(c.plum).text(model.healthRating === null ? "-" : String(model.healthRating), scoreX + 15, focusY + 36, { lineBreak: false });
  doc.fontSize(10).fillColor(c.muted).text("/ 10", scoreX + 62, focusY + 57, { lineBreak: false });

  heading(doc, "2", "本次重点关注", 458);
  const concernY = 498;
  const cg = 9;
  const cw = (CW - cg * 2) / 3;
  [...model.concerns, "未填写", "未填写"].slice(0, 3).forEach((text, i) => {
    const x = M + i * (cw + cg);
    panel(doc, x, concernY, cw, 62, i === 0 ? c.rose : c.white, i === 0 ? "#F0C8CA" : c.line);
    doc.save().circle(x + 22, concernY + 31, 11).fill(i === 0 ? c.coral : c.iris).restore();
    doc.fontSize(8.5).fillColor(c.white).text(String(i + 1), x + 14, concernY + 25, { width: 16, align: "center", lineBreak: false });
    value(doc, text, x + 41, concernY + 16, cw - 52, 9.5, c.ink, 34);
  });

  heading(doc, "3", "八维状态概览", 586);
  const sy = 628;
  const total = Math.max(1, model.statusCounts.evaluate + model.statusCounts.signal + model.statusCounts.stable);
  const segments = [["建议评估", model.statusCounts.evaluate, c.coral], ["变化信号", model.statusCounts.signal, c.iris], ["基本稳定", model.statusCounts.stable, c.teal]] as const;
  let x = M;
  segments.forEach(([, count, color], i) => {
    const width = i === 2 ? W - M - x : Math.max(5, CW * count / total);
    doc.save().roundedRect(x, sy, width, 14, 4).fill(color).restore(); x += width;
  });
  segments.forEach(([text, count, color], i) => {
    const sx = M + i * CW / 3;
    doc.save().circle(sx + 5, sy + 35, 4).fill(color).restore();
    doc.fontSize(8.5).fillColor(c.muted).text(text, sx + 15, sy + 29, { lineBreak: false });
    doc.fontSize(18).fillColor(c.plumDeep).text(String(count), sx + 15, sy + 44, { lineBreak: false });
  });

  const ny = 704;
  panel(doc, M, ny, CW, model.safetyNotice ? 72 : 61, model.safetyNotice ? c.rose : c.mint, model.safetyNotice ? "#EDB8BE" : "#C9E7DF");
  doc.save().circle(M + 21, ny + 22, 8).fill(model.safetyNotice ? c.red : c.teal).restore();
  doc.fontSize(8).fillColor(c.white).text("!", M + 16, ny + 16, { width: 10, align: "center", lineBreak: false });
  value(doc, model.safetyNotice ?? "本报告用于健康评估与管理沟通，不作为疾病诊断或独立检测结论。", M + 38, ny + 15, CW - 52, 9, c.ink, 40);
}

function domainPage(doc: PDFKit.PDFDocument, model: FemaleClientReportModel) {
  heading(doc, "4", "八维女性功能状态画像", 68, "每个方向均需结合体检、实验室、既往资料及临床需要综合判断");
  const gapX = 11;
  const cardW = (CW - gapX) / 2;
  const cardH = 155;
  const gapY = 11;
  const startY = 116;
  model.domains.slice(0, 8).forEach((d, i) => {
    const x = M + (i % 2) * (cardW + gapX);
    const y = startY + Math.floor(i / 2) * (cardH + gapY);
    const accent = levelColor(d.level);
    panel(doc, x, y, cardW, cardH, i % 3 === 0 ? c.ivory : c.white);
    doc.save().roundedRect(x, y, 5, cardH, 3).fill(accent).restore();
    value(doc, d.title, x + 16, y + 13, cardW - 126, 9.8, c.plumDeep, 27);
    pill(doc, d.levelLabel, x + cardW - 106, y + 11, accent, 94);
    label(doc, "主要线索", x + 16, y + 51);
    value(doc, d.reason, x + 16, y + 66, cardW - 32, 8.7, c.ink, 31);
    label(doc, "建议方向", x + 16, y + 103);
    value(doc, d.recommendation, x + 16, y + 118, cardW - 32, 8.2, c.muted, 29);
  });
}

function detailsPage(doc: PDFKit.PDFDocument, model: FemaleClientReportModel) {
  heading(doc, "5", "筛查时间与关注项", 68, "提示仅用于与医务人员确认个体化安排，不自动判断筛查不足");
  const sy = 116;
  const gap = 10;
  const sw = (CW - gap * 2) / 3;
  model.screenings.forEach((item, i) => {
    const x = M + i * (sw + gap);
    panel(doc, x, sy, sw, 83, item.attention ? c.rose : c.mint, item.attention ? "#EDC2C6" : "#C9E7DF");
    label(doc, item.label, x + 13, sy + 13, item.attention ? c.coral : c.teal);
    value(doc, item.value, x + 13, sy + 33, sw - 26, 10.5, c.plumDeep, 30);
    doc.fontSize(7.3).fillColor(c.muted).text(item.attention ? "建议确认安排" : "按当前记录", x + 13, sy + 65, { lineBreak: false });
  });

  heading(doc, "6", "生活方式概览", 227);
  const ly = 269;
  const lw = (CW - 11) / 2;
  model.lifestyle.slice(0, 4).forEach((item, i) => {
    const x = M + (i % 2) * (lw + 11);
    const y = ly + Math.floor(i / 2) * 70;
    panel(doc, x, y, lw, 64, i % 3 === 0 ? c.ivory : c.lilac);
    label(doc, item.label, x + 13, y + 10);
    value(doc, item.value, x + 13, y + 27, lw - 26, 8.3, c.ink, 33);
  });

  heading(doc, "7", "既往与家族健康线索", 424);
  const hy = 465;
  const hw = (CW - gap * 2) / 3;
  model.healthContext.slice(0, 3).forEach((item, i) => {
    const x = M + i * (hw + gap);
    panel(doc, x, hy, hw, 69, c.white);
    label(doc, item.label, x + 13, hy + 11, c.plum);
    value(doc, item.value, x + 13, hy + 30, hw - 26, 9.2, c.ink, 29);
  });

  heading(doc, "8", "建议的后续路径", 564);
  const steps = [["01", "信息核实", "医务人员确认问卷线索、既往资料和筛查记录。"], ["02", "补充评估", "按优先方向选择体检、实验室或女性专项检查。"], ["03", "12周管理", "确定可执行目标，并在第4、8、12周观察变化。"]];
  const py = 607;
  const pw = (CW - gap * 2) / 3;
  steps.forEach(([n, title, copy], i) => {
    const x = M + i * (pw + gap);
    panel(doc, x, py, pw, 91, i === 0 ? c.rose : c.lilac);
    doc.fontSize(17).fillColor(i === 0 ? c.coral : c.iris).text(n, x + 13, py + 12, { lineBreak: false });
    doc.fontSize(10).fillColor(c.plumDeep).text(title, x + 49, py + 16, { lineBreak: false });
    value(doc, copy, x + 13, py + 45, pw - 26, 8.3, c.muted, 37);
  });

  panel(doc, M, 719, CW, 50, c.ivory, "#E9D9BD");
  doc.fontSize(7.5).fillColor(c.muted).text("说明：本问卷不是疾病诊断工具，也不独立判断生物年龄。正式评估需结合当前体检与实验室检测、既往健康资料及专项检测。", M + 14, 734, { width: CW - 28, lineGap: 2 });
}

export function renderFemaleClientReportPdf(model: FemaleClientReportModel, fontPath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: true, bufferPages: true, compress: true, info: { Title: `${model.institution} ${model.title}`, Author: model.institution, Subject: `记录编号 ${model.confirmationId}`, Creator: "建始民族医院女性健康问卷系统" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    try {
      doc.registerFont("NotoSansSC", fontPath);
      doc.font("NotoSansSC");
      cover(doc, model); chrome(doc, model, 1);
      doc.addPage({ size: "A4", margin: 0 }); doc.font("NotoSansSC"); domainPage(doc, model); chrome(doc, model, 2);
      doc.addPage({ size: "A4", margin: 0 }); doc.font("NotoSansSC"); detailsPage(doc, model); chrome(doc, model, 3);
      doc.end();
    } catch (error) { reject(error); }
  });
}
