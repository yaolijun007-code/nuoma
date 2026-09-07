import { describe, expect, it } from "vitest";
import {
  buildPreadmissionMarkdown,
  normalizePatientQuery,
  notificationStatusLabel,
  validatePreadmissionDraft,
  type PreadmissionMessageModel,
} from "./market-preadmission";

const validDraft = {
  clientSubmissionId: "ad1a5d26-7f3d-4a81-8230-fc7ff5fd14c7",
  patientId: "P-001",
  contactPhone: "13800138000",
  plannedAdmissionDate: "2026-09-20",
  intendedDepartment: "消化内科",
  mainProblem: "反复腹胀，希望进一步评估",
  contactResult: "patient_interested" as const,
  notes: "上午联系方便",
};

const message: PreadmissionMessageModel = {
  recordId: "PY-20260907-0001",
  patientName: "张三",
  contactPhone: "13800138000",
  sex: "男",
  age: 62,
  admissionCount: 3,
  latestAdmissionDate: "2026-05-02",
  latestDischargeDate: "2026-05-08",
  plannedAdmissionDate: "2026-09-20",
  intendedDepartment: "消化内科",
  mainProblem: "反复腹胀，希望进一步评估",
  contactResult: "patient_interested",
  createdByName: "市场一组",
  createdAt: "2026-09-07T08:30:00.000Z",
};

describe("market preadmission domain", () => {
  it("classifies normalized patient queries", () => {
    expect(normalizePatientQuery(" 138 0013 8000 ")).toEqual({ kind: "phone", value: "13800138000" });
    expect(normalizePatientQuery(" 202600123 ")).toEqual({ kind: "hospitalNo", value: "202600123" });
    expect(normalizePatientQuery(" 张三 ")).toEqual({ kind: "name", value: "张三" });
    expect(normalizePatientQuery("a")).toEqual({ kind: "patientId", value: "A" });
    expect(() => normalizePatientQuery("张")).toThrow("至少输入 2 个字");
  });

  it("validates and trims a complete preadmission draft", () => {
    expect(validatePreadmissionDraft(validDraft)).toEqual(validDraft);
    expect(validatePreadmissionDraft({ ...validDraft, notes: "  上午联系方便  " }).notes).toBe("上午联系方便");
  });

  it("accepts a validated new-patient profile when no historical patient was selected", () => {
    expect(validatePreadmissionDraft({
      ...validDraft,
      patientId: "",
      newPatient: { name: " 李四 ", sex: "女", age: 47 },
    })).toMatchObject({
      patientId: "",
      newPatient: { name: "李四", sex: "女", age: 47 },
    });
    expect(() => validatePreadmissionDraft({ ...validDraft, patientId: "", newPatient: undefined }))
      .toThrow("请选择历史患者或填写新患者资料");
  });

  it("rejects missing, malformed, and excessive form values", () => {
    expect(() => validatePreadmissionDraft({ ...validDraft, plannedAdmissionDate: "" })).toThrow("请选择计划住院日期");
    expect(() => validatePreadmissionDraft({ ...validDraft, contactPhone: "abc" })).toThrow("联系方式格式不正确");
    expect(() => validatePreadmissionDraft({ ...validDraft, mainProblem: "x".repeat(501) })).toThrow("主要问题不能超过 500 个字");
    expect(() => validatePreadmissionDraft({ ...validDraft, clientSubmissionId: "duplicate" })).toThrow("提交标识无效");
  });

  it("builds a minimal WeCom message with the explicitly required full identity fields", () => {
    const markdown = buildPreadmissionMarkdown(message);
    expect(markdown).toContain("**患者姓名**：张三");
    expect(markdown).toContain("**联系电话**：13800138000");
    expect(markdown).toContain("待医务人员确认");
    expect(markdown).toContain("05月02日 至 05月08日");
    expect(markdown).not.toContain("住院费用");
    expect(markdown).not.toContain("全部诊断");
  });

  it("removes markdown controls and line breaks from user-entered message fields", () => {
    const markdown = buildPreadmissionMarkdown({
      ...message,
      patientName: "张<三>`\n[测试]",
      mainProblem: "第一行\r\n第二行",
    });
    expect(markdown).not.toMatch(/[<>`\[\]]/);
    expect(markdown).not.toContain("第一行\r\n第二行");
  });

  it("uses unambiguous notification labels", () => {
    expect(notificationStatusLabel("sent")).toBe("已推送");
    expect(notificationStatusLabel("failed")).toBe("登记已保存，群推送失败");
    expect(notificationStatusLabel("not_configured")).toBe("登记已保存，群机器人未配置");
    expect(notificationStatusLabel("pending")).toBe("登记已保存，等待推送");
  });
});
