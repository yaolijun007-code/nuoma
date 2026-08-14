import PDFDocument from "pdfkit";
import type { HospitalClientReportModel } from "./report-model";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TOTAL_PAGES = 3;

const colors = {
  navy: "#0B2745",
  blue: "#1479B8",
  cyan: "#00A6A6",
  orange: "#F0783C",
  red: "#D9544D",
  green: "#159A7D",
  ink: "#17324D",
  muted: "#62778B",
  line: "#DCE7F0",
  pale: "#F3F8FC",
  white: "#FFFFFF",
};

const levelColor = (level: HospitalClientReportModel["domains"][number]["level"]) => ({
  clinical_priority: colors.red,
  evaluate: colors.orange,
  signal: colors.blue,
  stable: colors.green,
})[level];

function safeFilenamePart(value: string, maxLength: number) {
  return [...value
    .replace(/[^\p{L}\p{N} _.\-]/gu, "")
    .replace(/\s+/g, "")]
    .slice(0, maxLength)
    .join("") || "未命名";
}

export function hospitalClientReportFilename(
  model: Pick<HospitalClientReportModel, "name" | "confirmationId">,
) {
  const name = safeFilenamePart(model.name, 24);
  const confirmationId = safeFilenamePart(model.confirmationId, 40);
  return `建始民族医院_健康评估报告_${name}_${confirmationId}.pdf`;
}

function roundedPanel(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = colors.white,
  stroke = colors.line,
  radius = 10,
) {
  doc.save().roundedRect(x, y, width, height, radius).fillAndStroke(fill, stroke).restore();
}

function label(doc: PDFKit.PDFDocument, text: string, x: number, y: number, color = colors.muted) {
  doc.fontSize(8.5).fillColor(color).text(text, x, y, { lineBreak: false });
}

function value(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  size = 11,
  color = colors.ink,
  height = 34,
) {
  doc.fontSize(size).fillColor(color).text(text, x, y, { width, height, ellipsis: true, lineGap: 2 });
}

function statusPill(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  color: string,
  width = 104,
) {
  doc.save().roundedRect(x, y, width, 24, 12).fill(color).restore();
  doc.fontSize(9).fillColor(colors.white).text(text, x, y + 6, { width, align: "center", lineBreak: false });
}

function sectionTitle(doc: PDFKit.PDFDocument, index: string, title: string, y: number, subtitle?: string) {
  doc.save().circle(MARGIN + 10, y + 10, 10).fill(colors.blue).restore();
  doc.fontSize(9).fillColor(colors.white).text(index, MARGIN + 1, y + 5, { width: 18, align: "center", lineBreak: false });
  doc.fontSize(15).fillColor(colors.navy).text(title, MARGIN + 29, y + 2, { lineBreak: false });
  if (subtitle) {
    doc.fontSize(8.5).fillColor(colors.muted).text(subtitle, MARGIN + 29, y + 22, { width: CONTENT_WIDTH - 29 });
  }
}

function pageChrome(doc: PDFKit.PDFDocument, model: HospitalClientReportModel, pageNumber: number) {
  if (pageNumber > 1) {
    doc.save().rect(0, 0, PAGE_WIDTH, 8).fill(colors.cyan).restore();
    doc.fontSize(9).fillColor(colors.navy).text(model.institution, MARGIN, 26, { lineBreak: false });
    doc.fontSize(8.5).fillColor(colors.muted).text(model.title, MARGIN, 27, { width: CONTENT_WIDTH, align: "right", lineBreak: false });
    doc.save().moveTo(MARGIN, 49).lineTo(PAGE_WIDTH - MARGIN, 49).strokeColor(colors.line).stroke().restore();
  }
  doc.save().moveTo(MARGIN, PAGE_HEIGHT - 39).lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 39).strokeColor(colors.line).stroke().restore();
  doc.fontSize(7.5).fillColor(colors.muted).text(`记录编号 ${model.confirmationId}`, MARGIN, PAGE_HEIGHT - 29, { lineBreak: false });
  doc.text(`第 ${pageNumber} / ${TOTAL_PAGES} 页`, PAGE_WIDTH - MARGIN - 80, PAGE_HEIGHT - 29, { width: 80, align: "right", lineBreak: false });
}

function drawCover(doc: PDFKit.PDFDocument, model: HospitalClientReportModel) {
  doc.save().rect(0, 0, PAGE_WIDTH, 175).fill(colors.navy).restore();
  doc.save().rect(0, 0, 10, 175).fill(colors.cyan).restore();
  doc.fontSize(12).fillColor("#9ADFE0").text(model.institution, MARGIN, 35, { lineBreak: false });
  doc.fontSize(25).fillColor(colors.white).text(model.title, MARGIN, 64, { width: CONTENT_WIDTH, lineBreak: false });
  doc.fontSize(9).fillColor("#B8C9D7").text("基于近期功能状态、生活方式及较既往变化形成的健康管理参考", MARGIN, 105, { width: CONTENT_WIDTH });
  statusPill(doc, model.followUpLabel, MARGIN, 132, model.safetyNotice ? colors.red : colors.orange, 128);
  doc.fontSize(8).fillColor("#B8C9D7").text(`生成时间 ${model.submittedAt}`, PAGE_WIDTH - MARGIN - 180, 140, { width: 180, align: "right", lineBreak: false });

  const infoY = 196;
  const infoGap = 10;
  const infoWidth = (CONTENT_WIDTH - infoGap * 2) / 3;
  [
    ["姓名", model.name],
    ["手机号", model.phone],
    ["记录编号", model.confirmationId],
  ].forEach(([heading, content], index) => {
    const x = MARGIN + index * (infoWidth + infoGap);
    roundedPanel(doc, x, infoY, infoWidth, 62, colors.pale);
    label(doc, heading, x + 14, infoY + 12);
    value(doc, content, x + 14, infoY + 31, infoWidth - 28, 10.5, colors.ink, 20);
  });

  sectionTitle(doc, "1", "当前最关注的问题", 282, "用于安排健康沟通和后续管理优先级");
  const concernY = 326;
  const concernGap = 10;
  const concernWidth = (CONTENT_WIDTH - concernGap * 2) / 3;
  const concerns = [...model.concerns, "未填写", "未填写"].slice(0, 3);
  concerns.forEach((concern, index) => {
    const x = MARGIN + index * (concernWidth + concernGap);
    roundedPanel(doc, x, concernY, concernWidth, 58, colors.white);
    doc.save().circle(x + 22, concernY + 29, 12).fill(index === 0 ? colors.orange : colors.blue).restore();
    doc.fontSize(9).fillColor(colors.white).text(String(index + 1), x + 13, concernY + 23, { width: 18, align: "center", lineBreak: false });
    value(doc, concern, x + 42, concernY + 18, concernWidth - 53, 10.5, colors.ink, 30);
  });

  const compareY = 400;
  const compareWidth = (CONTENT_WIDTH - 12) / 2;
  roundedPanel(doc, MARGIN, compareY, compareWidth, 72, "#F8FBFE");
  label(doc, "最近半年最明显变化", MARGIN + 15, compareY + 14);
  value(doc, model.mainChange, MARGIN + 15, compareY + 35, compareWidth - 30, 12, colors.navy, 24);
  roundedPanel(doc, MARGIN + compareWidth + 12, compareY, compareWidth, 72, "#F8FBFE");
  label(doc, "未来12周首要改善目标", MARGIN + compareWidth + 27, compareY + 14);
  value(doc, model.primaryGoal, MARGIN + compareWidth + 27, compareY + 35, compareWidth - 30, 12, colors.navy, 24);

  sectionTitle(doc, "2", "八维状态概览", 500, "只展示分类数量，不计算总分、百分比或身体年龄");
  const summaryY = 548;
  const total = Math.max(1, model.statusCounts.evaluate + model.statusCounts.signal + model.statusCounts.stable);
  const segments = [
    { label: "建议评估", count: model.statusCounts.evaluate, color: colors.orange },
    { label: "变化信号", count: model.statusCounts.signal, color: colors.blue },
    { label: "基本稳定", count: model.statusCounts.stable, color: colors.green },
  ];
  let segmentX = MARGIN;
  segments.forEach((segment, index) => {
    const remaining = PAGE_WIDTH - MARGIN - segmentX;
    const width = index === segments.length - 1 ? remaining : Math.max(4, CONTENT_WIDTH * (segment.count / total));
    doc.save().roundedRect(segmentX, summaryY, width, 18, 4).fill(segment.color).restore();
    segmentX += width;
  });
  segments.forEach((segment, index) => {
    const x = MARGIN + index * (CONTENT_WIDTH / 3);
    doc.save().circle(x + 5, summaryY + 43, 5).fill(segment.color).restore();
    doc.fontSize(9).fillColor(colors.muted).text(segment.label, x + 17, summaryY + 36, { lineBreak: false });
    doc.fontSize(19).fillColor(colors.navy).text(String(segment.count), x + 17, summaryY + 51, { lineBreak: false });
  });

  const noticeY = 646;
  roundedPanel(doc, MARGIN, noticeY, CONTENT_WIDTH, model.safetyNotice ? 82 : 70, model.safetyNotice ? "#FFF5F2" : "#F2FAF8", model.safetyNotice ? "#F4C7BD" : "#C9E9DF");
  doc.save().circle(MARGIN + 22, noticeY + 25, 9).fill(model.safetyNotice ? colors.red : colors.green).restore();
  doc.fontSize(9).fillColor(colors.white).text("!", MARGIN + 17, noticeY + 18, { width: 10, align: "center", lineBreak: false });
  doc.fontSize(10.5).fillColor(model.safetyNotice ? colors.red : colors.green).text(
    model.safetyNotice ? "医学安全信息提示" : "报告使用边界",
    MARGIN + 40,
    noticeY + 15,
    { lineBreak: false },
  );
  value(
    doc,
    model.safetyNotice ?? "本报告用于健康评估与管理沟通，不作为疾病诊断或独立检测结论。",
    MARGIN + 40,
    noticeY + 36,
    CONTENT_WIDTH - 58,
    9,
    colors.ink,
    34,
  );
}

function drawDomains(doc: PDFKit.PDFDocument, model: HospitalClientReportModel) {
  sectionTitle(doc, "3", "八维功能状态画像", 69, "状态来自问卷体感线索，需结合体检、实验室和既往健康资料综合判断");
  const gapX = 12;
  const cardWidth = (CONTENT_WIDTH - gapX) / 2;
  const cardHeight = 154;
  const gapY = 12;
  const startY = 118;
  model.domains.slice(0, 8).forEach((domain, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + column * (cardWidth + gapX);
    const y = startY + row * (cardHeight + gapY);
    const accent = levelColor(domain.level);
    roundedPanel(doc, x, y, cardWidth, cardHeight, colors.white);
    doc.save().roundedRect(x, y, 5, cardHeight, 3).fill(accent).restore();
    value(doc, domain.title, x + 17, y + 15, cardWidth - 132, 12, colors.navy, 22);
    statusPill(doc, domain.levelLabel, x + cardWidth - 110, y + 12, accent, 96);
    label(doc, "主要线索", x + 17, y + 52);
    value(doc, domain.reason, x + 17, y + 68, cardWidth - 34, 9, colors.ink, 30);
    label(doc, "健康管理建议", x + 17, y + 101);
    value(doc, domain.recommendation, x + 17, y + 117, cardWidth - 34, 8.5, colors.muted, 29);
  });
}

function drawLifestyleAndGoals(doc: PDFKit.PDFDocument, model: HospitalClientReportModel) {
  sectionTitle(doc, "4", "生活方式概览", 69, "结构化呈现影响睡眠、代谢、恢复和功能储备的日常因素");
  const gapX = 12;
  const cardWidth = (CONTENT_WIDTH - gapX) / 2;
  const cardHeight = 57;
  const gapY = 10;
  const startY = 116;
  model.lifestyle.slice(0, 8).forEach((item, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + column * (cardWidth + gapX);
    const y = startY + row * (cardHeight + gapY);
    roundedPanel(doc, x, y, cardWidth, cardHeight, index % 3 === 0 ? "#F2FAF8" : "#F7FAFD");
    label(doc, item.label, x + 14, y + 10);
    value(doc, item.value, x + 14, y + 28, cardWidth - 28, 10, colors.ink, 22);
  });

  sectionTitle(doc, "5", "未来12周行动目标", 404, "选择少量、可执行的改变，并在第4、8、12周观察体感变化");
  const goalY = 451;
  const goalGap = 10;
  const goalWidth = (CONTENT_WIDTH - goalGap * 2) / 3;
  const goals = [...model.twelveWeekGoals, "尚未选择", "尚未选择"].slice(0, 3);
  goals.forEach((goal, index) => {
    const x = MARGIN + index * (goalWidth + goalGap);
    roundedPanel(doc, x, goalY, goalWidth, 67, colors.white);
    doc.save().circle(x + 20, goalY + 21, 10).fill(index === 0 ? colors.orange : colors.cyan).restore();
    doc.fontSize(8).fillColor(colors.white).text(String(index + 1), x + 12, goalY + 16, { width: 16, align: "center", lineBreak: false });
    value(doc, goal, x + 14, goalY + 39, goalWidth - 28, 9.5, colors.ink, 23);
  });

  roundedPanel(doc, MARGIN, 536, CONTENT_WIDTH, 62, "#F3F8FC");
  label(doc, "首要改善目标", MARGIN + 16, 550, colors.blue);
  value(doc, model.primaryGoal, MARGIN + 130, 546, CONTENT_WIDTH - 146, 13, colors.navy, 28);

  sectionTitle(doc, "6", "建议的后续路径", 624);
  const steps = [
    ["01", "补充检测", "根据评估线索确定体检、实验室或专项检测。"],
    ["02", "确定优先级", "结合既往资料，确定当前最值得先管理的方向。"],
    ["03", "跟踪变化", "制定12周方案，并在第4、8、12周复评。"],
  ];
  const stepY = 665;
  const stepGap = 10;
  const stepWidth = (CONTENT_WIDTH - stepGap * 2) / 3;
  steps.forEach(([number, heading, copy], index) => {
    const x = MARGIN + index * (stepWidth + stepGap);
    doc.fontSize(18).fillColor("#B8D4E5").text(number, x, stepY, { lineBreak: false });
    doc.fontSize(10.5).fillColor(colors.navy).text(heading, x + 37, stepY + 4, { lineBreak: false });
    value(doc, copy, x, stepY + 31, stepWidth, 8.5, colors.muted, 42);
  });

  doc.fontSize(7.5).fillColor(colors.muted).text(
    "说明：本问卷不是疾病诊断工具，也不独立判断生物年龄。正式评估需结合当前体检与实验室检测、既往健康资料及专项检测。",
    MARGIN,
    756,
    { width: CONTENT_WIDTH, align: "left", lineGap: 2 },
  );
}

export function renderHospitalClientReportPdf(
  model: HospitalClientReportModel,
  fontPath: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      autoFirstPage: true,
      bufferPages: true,
      compress: true,
      info: {
        Title: `${model.institution} ${model.title}`,
        Author: model.institution,
        Subject: `记录编号 ${model.confirmationId}`,
        Creator: "建始民族医院健康问卷系统",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    try {
      doc.registerFont("NotoSansSC", fontPath);
      doc.font("NotoSansSC");

      drawCover(doc, model);
      pageChrome(doc, model, 1);

      doc.addPage({ size: "A4", margin: 0 });
      doc.font("NotoSansSC");
      drawDomains(doc, model);
      pageChrome(doc, model, 2);

      doc.addPage({ size: "A4", margin: 0 });
      doc.font("NotoSansSC");
      drawLifestyleAndGoals(doc, model);
      pageChrome(doc, model, 3);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
