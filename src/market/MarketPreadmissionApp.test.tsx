import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PatientHistory, PreadmissionRecord } from "../domain/market-preadmission";
import type { MarketApi } from "./api";
import { MarketPreadmissionApp } from "./MarketPreadmissionApp";

const marketUser = { uid: "uid-market", username: "sc001", displayName: "市场一组", role: "market" as const };
const history: PatientHistory = {
  patient: {
    patientId: "P-001",
    patientCode: "0001",
    name: "张三",
    sex: "男",
    age: 62,
    phone: "13800138000",
    hospitalNo: "202600123",
    admissionCount: 3,
    identityRisk: true,
    identityRiskReasons: ["存在同名患者，请核对住院号"],
    latestAdmissionDate: "2026-05-02",
    latestDischargeDate: "2026-05-08",
    latestDiagnosis: "腹胀",
  },
  encounters: [
    { encounterId: "E-2", admissionDate: "2026-05-02", dischargeDate: "2026-05-08", department: "内科", mainDiagnosis: "腹胀", sequence: 3 },
    { encounterId: "E-1", admissionDate: "2025-09-10", dischargeDate: "", department: "内科", mainDiagnosis: "慢性胃炎", sequence: 2 },
  ],
  diagnoses: [
    { diagnosis: "腹胀", count: 2, lastAdmissionDate: "2026-05-02" },
    { diagnosis: "慢性胃炎", count: 1, lastAdmissionDate: "2025-09-10" },
  ],
};

const failedRecord: PreadmissionRecord = {
  recordId: "PY-20260907-0001",
  clientSubmissionId: "ad1a5d26-7f3d-4a81-8230-fc7ff5fd14c7",
  patientId: "P-001",
  patientName: "张三",
  patientSnapshot: { patientCode: "0001", hospitalNo: "202600123", sex: "男", age: 62, admissionCount: 3 },
  contactPhone: "13800138000",
  plannedAdmissionDate: "2026-09-20",
  intendedDepartment: "消化内科",
  mainProblem: "反复腹胀，希望进一步评估",
  contactResult: "patient_interested",
  notes: "",
  createdByUid: "uid-market",
  createdByName: "市场一组",
  createdAt: "2026-09-07T08:30:00.000Z",
  updatedAt: "2026-09-07T08:30:00.000Z",
  notificationStatus: "failed",
  notificationAttempts: 1,
  lastNotificationErrorCode: "NETWORK_ERROR",
};

function fakeApi(overrides: Partial<MarketApi> = {}): MarketApi {
  return {
    restoreSession: vi.fn().mockResolvedValue(marketUser),
    login: vi.fn().mockResolvedValue(marketUser),
    logout: vi.fn().mockResolvedValue(undefined),
    searchPatients: vi.fn().mockResolvedValue([history.patient]),
    getPatientHistory: vi.fn().mockResolvedValue(history),
    createPreadmission: vi.fn().mockResolvedValue(failedRecord),
    listPreadmissions: vi.fn().mockResolvedValue([]),
    retryNotification: vi.fn().mockResolvedValue({ ...failedRecord, notificationStatus: "sent", notificationAttempts: 2 }),
    ...overrides,
  };
}

describe("market preadmission app", () => {
  it("shows a focused login and does not reveal whether the account exists", async () => {
    const user = userEvent.setup();
    const api = fakeApi({
      restoreSession: vi.fn().mockResolvedValue(null),
      login: vi.fn().mockRejectedValue(new Error("specific account missing")),
    });
    render(<MarketPreadmissionApp api={api} />);
    expect(await screen.findByRole("heading", { name: "患者预住院登记" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("账号"), "sc001");
    await user.type(screen.getByLabelText("密码"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "登录" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("账号或密码不正确");
    expect(screen.queryByText("specific account missing")).not.toBeInTheDocument();
  });

  it("searches, requires explicit patient selection, and renders limited admission history", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    render(<MarketPreadmissionApp api={api} />);
    expect(await screen.findByText("市场一组")).toBeInTheDocument();
    await user.type(screen.getByLabelText("患者姓名、手机号或住院号"), "张三");
    await user.click(screen.getByRole("button", { name: "查询" }));
    expect(await screen.findByText("存在同名患者，请核对住院号")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "住院记录" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /选择患者 张三/ }));
    expect(await screen.findByText("共住院 3 次")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "住院记录" })).toBeInTheDocument();
    expect(screen.getByText("出院日期未记录")).toBeInTheDocument();
    expect(screen.queryByText(/费用|地址|医保/)).not.toBeInTheDocument();
  });

  it("saves a preadmission, reports notification failure, and permits retry", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    render(<MarketPreadmissionApp api={api} />);
    await screen.findByText("市场一组");
    await user.type(screen.getByLabelText("患者姓名、手机号或住院号"), "张三");
    await user.click(screen.getByRole("button", { name: "查询" }));
    await user.click(await screen.findByRole("button", { name: /选择患者 张三/ }));
    await screen.findByRole("heading", { name: "预住院登记" });
    fireEvent.change(screen.getByLabelText("计划住院日期"), { target: { value: "2026-09-20" } });
    await user.type(screen.getByLabelText("拟入科室"), "消化内科");
    await user.type(screen.getByLabelText("主要问题"), "反复腹胀，希望进一步评估");
    await user.selectOptions(screen.getByLabelText("联系结果"), "patient_interested");
    await user.click(screen.getByRole("button", { name: "保存并推送到企业微信群" }));
    expect(await screen.findByText("登记已保存，群推送失败")).toBeInTheDocument();
    expect(screen.getByText("登记编号：PY-20260907-0001")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "重新推送" }));
    expect(await screen.findByText("已推送")).toBeInTheDocument();
    expect(api.retryNotification).toHaveBeenCalledWith("PY-20260907-0001");
  });

  it("shows the current user's recent registrations in a compact list", async () => {
    const user = userEvent.setup();
    const api = fakeApi({ listPreadmissions: vi.fn().mockResolvedValue([failedRecord]) });
    render(<MarketPreadmissionApp api={api} />);
    await screen.findByText("市场一组");
    await user.click(screen.getByRole("button", { name: "我的登记" }));
    expect(await screen.findByText("PY-20260907-0001")).toBeInTheDocument();
    expect(screen.getByText("2026-09-20")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重新推送 张三" })).toBeEnabled();
  });
});
