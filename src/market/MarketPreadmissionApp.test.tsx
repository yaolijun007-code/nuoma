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
  patientType: "普通居民医保",
  plannedAdmissionDate: "2026-09-20",
  intendedDepartment: "风湿免疫科",
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
    changePassword: vi.fn().mockResolvedValue(undefined),
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
    expect(screen.queryByText(/住院费用|家庭地址|医保编号/)).not.toBeInTheDocument();
  });

  it("lets staff register a new patient without historical admissions", async () => {
    const user = userEvent.setup();
    const newRecord = {
      ...failedRecord,
      patientId: "N-AD1A5D267F3D4A818230FC7F",
      patientName: "李四",
      contactPhone: "13900139000",
      notificationStatus: "sent" as const,
      patientSnapshot: { patientCode: "N-AD1A5D267F3D4A818230FC7F", hospitalNo: "", sex: "女", age: 47, admissionCount: 0 },
    };
    const api = fakeApi({ createPreadmission: vi.fn().mockResolvedValue(newRecord) });
    render(<MarketPreadmissionApp api={api} />);
    await screen.findByText("市场一组");
    expect(screen.getByRole("note", { name: "新患者首次登记提示" })).toHaveClass("is-prominent");
    expect(screen.getByText("首次来院或查不到档案？")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "新患者首次登记" }));
    await user.type(screen.getByLabelText("新患者姓名"), "李四");
    await user.type(screen.getByLabelText("新患者联系电话"), "13900139000");
    await user.selectOptions(screen.getByLabelText("新患者性别"), "女");
    await user.type(screen.getByLabelText("新患者年龄"), "47");
    await user.click(screen.getByRole("button", { name: "继续填写预住院信息" }));
    expect(await screen.findByText("暂无既往住院记录，新患者档案将在提交时建立")).toBeInTheDocument();
    expect([...screen.getByLabelText("患者类型").querySelectorAll("option")].map((option) => option.textContent)).toEqual([
      "请选择患者类型", "城镇职工医保", "低保人员医保", "普通居民医保", "特困供养人员医保", "自费",
    ]);
    expect([...screen.getByLabelText("拟住院科室").querySelectorAll("option")].map((option) => option.textContent)).toEqual([
      "请选择拟住院科室", "风湿免疫科", "康复科", "老年医学科", "住院内一科", "住院外一科",
    ]);
    await user.selectOptions(screen.getByLabelText("患者类型"), "普通居民医保");
    fireEvent.change(screen.getByLabelText("计划住院日期"), { target: { value: "2026-09-20" } });
    await user.selectOptions(screen.getByLabelText("拟住院科室"), "风湿免疫科");
    await user.type(screen.getByLabelText("主要问题"), "反复腹胀，希望进一步评估");
    await user.selectOptions(screen.getByLabelText("联系结果"), "patient_interested");
    await user.type(screen.getByLabelText("备注（选填）"), "上午联系方便");
    await user.click(screen.getByRole("button", { name: "保存并推送到企业微信群" }));
    expect(api.createPreadmission).toHaveBeenCalledWith(expect.objectContaining({
      patientId: "",
      contactPhone: "13900139000",
      patientType: "普通居民医保",
      intendedDepartment: "风湿免疫科",
      notes: "上午联系方便",
      newPatient: { name: "李四", sex: "女", age: 47 },
    }));
  });

  it("blocks an invalid historical-patient phone before calling CloudBase and links the error to the field", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    render(<MarketPreadmissionApp api={api} />);
    await screen.findByText("市场一组");
    await user.type(screen.getByLabelText("患者姓名、手机号或住院号"), "张三");
    await user.click(screen.getByRole("button", { name: "查询" }));
    await user.click(await screen.findByRole("button", { name: /选择患者 张三/ }));
    const phone = screen.getByLabelText("本次联系电话");
    await user.clear(phone);
    await user.type(phone, "abc");
    await user.selectOptions(screen.getByLabelText("患者类型"), "普通居民医保");
    fireEvent.change(screen.getByLabelText("计划住院日期"), { target: { value: "2026-09-20" } });
    await user.selectOptions(screen.getByLabelText("拟住院科室"), "风湿免疫科");
    await user.type(screen.getByLabelText("主要问题"), "反复腹胀，希望进一步评估");
    await user.selectOptions(screen.getByLabelText("联系结果"), "patient_interested");
    await user.click(screen.getByRole("button", { name: "保存并推送到企业微信群" }));

    expect(api.createPreadmission).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("联系方式格式不正确");
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(phone).toHaveAttribute("aria-describedby", expect.stringContaining("preadmission-submit-error"));
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
    await user.selectOptions(screen.getByLabelText("患者类型"), "普通居民医保");
    fireEvent.change(screen.getByLabelText("计划住院日期"), { target: { value: "2026-09-20" } });
    await user.selectOptions(screen.getByLabelText("拟住院科室"), "风湿免疫科");
    await user.type(screen.getByLabelText("主要问题"), "反复腹胀，希望进一步评估");
    await user.selectOptions(screen.getByLabelText("联系结果"), "patient_interested");
    await user.click(screen.getByRole("button", { name: "保存并推送到企业微信群" }));
    expect(await screen.findByText("登记已保存，群推送失败")).toBeInTheDocument();
    expect(screen.getByText("登记编号：PY-20260907-0001")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "重新推送" }));
    expect(await screen.findByText("已推送")).toBeInTheDocument();
    expect(api.retryNotification).toHaveBeenCalledWith("PY-20260907-0001");
  });

  it("locks a saved registration so a second click cannot create or send it again", async () => {
    const user = userEvent.setup();
    const sentRecord = { ...failedRecord, notificationStatus: "sent" as const };
    const api = fakeApi({ createPreadmission: vi.fn().mockResolvedValue(sentRecord) });
    render(<MarketPreadmissionApp api={api} />);
    await screen.findByText("市场一组");
    await user.type(screen.getByLabelText("患者姓名、手机号或住院号"), "张三");
    await user.click(screen.getByRole("button", { name: "查询" }));
    await user.click(await screen.findByRole("button", { name: /选择患者 张三/ }));
    await user.selectOptions(screen.getByLabelText("患者类型"), "普通居民医保");
    fireEvent.change(screen.getByLabelText("计划住院日期"), { target: { value: "2026-09-20" } });
    await user.selectOptions(screen.getByLabelText("拟住院科室"), "风湿免疫科");
    await user.type(screen.getByLabelText("主要问题"), "反复腹胀，希望进一步评估");
    await user.selectOptions(screen.getByLabelText("联系结果"), "patient_interested");
    const submit = screen.getByRole("button", { name: "保存并推送到企业微信群" });
    await user.click(submit);
    expect(await screen.findByText("已推送")).toBeInTheDocument();
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(api.createPreadmission).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "开始下一位患者" })).toBeEnabled();
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

  it("shows a retryable error instead of presenting a failed records request as empty", async () => {
    const user = userEvent.setup();
    const api = fakeApi({ listPreadmissions: vi.fn().mockRejectedValue(new Error("network")) });
    render(<MarketPreadmissionApp api={api} />);
    await screen.findByText("市场一组");
    await user.click(screen.getByRole("button", { name: "我的登记" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("登记记录加载失败");
    expect(screen.getByRole("button", { name: "重新加载登记记录" })).toBeEnabled();
    expect(screen.queryByText("还没有登记记录")).not.toBeInTheDocument();
  });

  it("shows a friendly retry error in the records view without hiding the saved record", async () => {
    const user = userEvent.setup();
    const api = fakeApi({
      listPreadmissions: vi.fn().mockResolvedValue([failedRecord]),
      retryNotification: vi.fn().mockRejectedValue(new Error("network detail")),
    });
    render(<MarketPreadmissionApp api={api} />);
    await screen.findByText("市场一组");
    await user.click(screen.getByRole("button", { name: "我的登记" }));
    expect(await screen.findByText("PY-20260907-0001")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "重新推送 张三" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("重新推送失败，请稍后再试");
    expect(screen.getByText("PY-20260907-0001")).toBeInTheDocument();
    expect(screen.queryByText("network detail")).not.toBeInTheDocument();
  });

  it("lets the signed-in user change their own password", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    render(<MarketPreadmissionApp api={api} />);
    await user.click(await screen.findByRole("button", { name: "修改密码" }));
    await user.type(screen.getByLabelText("旧密码"), "OldPass1!");
    await user.type(screen.getByLabelText("新密码"), "123456");
    await user.type(screen.getByLabelText("确认新密码"), "123456");
    await user.click(screen.getByRole("button", { name: "确认修改密码" }));

    expect(api.changePassword).toHaveBeenCalledWith("OldPass1!", "123456");
    expect(await screen.findByRole("status")).toHaveTextContent("密码修改成功");
    expect(screen.getByLabelText("旧密码")).toHaveValue("");
    expect(screen.getByLabelText("新密码")).toHaveValue("");
    expect(screen.getByLabelText("确认新密码")).toHaveValue("");
  });

  it("rejects mismatched new passwords before calling CloudBase", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    render(<MarketPreadmissionApp api={api} />);
    await user.click(await screen.findByRole("button", { name: "修改密码" }));
    await user.type(screen.getByLabelText("旧密码"), "OldPass1!");
    await user.type(screen.getByLabelText("新密码"), "NewPass2@");
    await user.type(screen.getByLabelText("确认新密码"), "Different3#");
    await user.click(screen.getByRole("button", { name: "确认修改密码" }));

    expect(screen.getByRole("alert")).toHaveTextContent("两次输入的新密码不一致");
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it("rejects a weak new password before calling CloudBase", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    render(<MarketPreadmissionApp api={api} />);
    await user.click(await screen.findByRole("button", { name: "修改密码" }));
    await user.type(screen.getByLabelText("旧密码"), "OldPass1!");
    expect(screen.getByLabelText("新密码")).toHaveAttribute("minlength", "4");
    expect(screen.getByLabelText("新密码")).toHaveAttribute("maxlength", "64");
    await user.type(screen.getByLabelText("新密码"), "123");
    await user.type(screen.getByLabelText("确认新密码"), "123");
    await user.click(screen.getByRole("button", { name: "确认修改密码" }));

    expect(screen.getByRole("alert")).toHaveTextContent("新密码至少 4 位，可以使用纯数字");
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it("clears patient information locally even if remote logout fails", async () => {
    const user = userEvent.setup();
    const api = fakeApi({ logout: vi.fn().mockRejectedValue(new Error("network")) });
    render(<MarketPreadmissionApp api={api} />);
    await screen.findByText("市场一组");
    await user.type(screen.getByLabelText("患者姓名、手机号或住院号"), "张三");
    await user.click(screen.getByRole("button", { name: "查询" }));
    await user.click(await screen.findByRole("button", { name: /选择患者 张三/ }));
    expect(await screen.findByText("共住院 3 次")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "退出登录" }));
    expect(await screen.findByLabelText("账号")).toBeInTheDocument();
    expect(screen.queryByText("共住院 3 次")).not.toBeInTheDocument();
  });
});
