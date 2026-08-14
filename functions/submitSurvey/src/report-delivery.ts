import type { PersistedSubmission } from "../../../src/domain/submission";
import { buildHospitalClientReportModel, type HospitalClientReportModel } from "./report-model";
import { hospitalClientReportFilename, renderHospitalClientReportPdf } from "./report-pdf";
import { sendWeComFile, uploadWeComFile, WeComDeliveryError } from "./wecom";
import { buildFemaleClientReportModel, type FemaleClientReportModel } from "./female-report-model";
import { femaleClientReportFilename, renderFemaleClientReportPdf } from "./female-report-pdf";

export type ReportDeliveryStatus = "sent" | "failed" | "not_configured";

export interface ReportDeliveryDependencies {
  fontPath: string;
  buildModel?: (record: PersistedSubmission) => HospitalClientReportModel;
  renderPdf?: (model: HospitalClientReportModel, fontPath: string) => Promise<Buffer>;
  filename?: (model: Pick<HospitalClientReportModel, "name" | "confirmationId">) => string;
  upload?: (webhookUrl: string, filename: string, file: Buffer) => Promise<string>;
  send?: (webhookUrl: string, mediaId: string) => Promise<void>;
  logError?: (message: string) => void;
}

export async function deliverHospitalClientReport(
  record: PersistedSubmission,
  webhookUrl: string | undefined,
  dependencies: ReportDeliveryDependencies,
): Promise<ReportDeliveryStatus> {
  if (!webhookUrl) return "not_configured";

  const buildModel = dependencies.buildModel ?? buildHospitalClientReportModel;
  const renderPdf = dependencies.renderPdf ?? renderHospitalClientReportPdf;
  const filename = dependencies.filename ?? hospitalClientReportFilename;
  const upload = dependencies.upload ?? uploadWeComFile;
  const send = dependencies.send ?? sendWeComFile;
  const logError = dependencies.logError ?? console.log;
  let phase: "model" | "render" | "upload" | "send" = "model";

  try {
    const model = buildModel(record);
    phase = "render";
    const pdf = await renderPdf(model, dependencies.fontPath);
    phase = "upload";
    const mediaId = await upload(webhookUrl, filename(model), pdf);
    phase = "send";
    await send(webhookUrl, mediaId);
    return "sent";
  } catch (error) {
    const code = error instanceof WeComDeliveryError ? `:${error.deliveryCode}` : "";
    logError(`hospital WeCom PDF report delivery failed (${phase}${code})`);
    return "failed";
  }
}

export interface FemaleReportDeliveryDependencies {
  fontPath: string;
  buildModel?: (record: PersistedSubmission) => FemaleClientReportModel;
  renderPdf?: (model: FemaleClientReportModel, fontPath: string) => Promise<Buffer>;
  filename?: (model: Pick<FemaleClientReportModel, "name" | "confirmationId">) => string;
  upload?: (webhookUrl: string, filename: string, file: Buffer) => Promise<string>;
  send?: (webhookUrl: string, mediaId: string) => Promise<void>;
  logError?: (message: string) => void;
}

export async function deliverFemaleClientReport(
  record: PersistedSubmission,
  webhookUrl: string | undefined,
  dependencies: FemaleReportDeliveryDependencies,
): Promise<ReportDeliveryStatus> {
  if (!webhookUrl) return "not_configured";
  const buildModel = dependencies.buildModel ?? buildFemaleClientReportModel;
  const renderPdf = dependencies.renderPdf ?? renderFemaleClientReportPdf;
  const filename = dependencies.filename ?? femaleClientReportFilename;
  const upload = dependencies.upload ?? uploadWeComFile;
  const send = dependencies.send ?? sendWeComFile;
  const logError = dependencies.logError ?? console.log;
  let phase: "model" | "render" | "upload" | "send" = "model";
  try {
    const model = buildModel(record);
    phase = "render";
    const pdf = await renderPdf(model, dependencies.fontPath);
    phase = "upload";
    const mediaId = await upload(webhookUrl, filename(model), pdf);
    phase = "send";
    await send(webhookUrl, mediaId);
    return "sent";
  } catch (error) {
    const code = error instanceof WeComDeliveryError ? `:${error.deliveryCode}` : "";
    logError(`hospital female WeCom PDF report delivery failed (${phase}${code})`);
    return "failed";
  }
}
