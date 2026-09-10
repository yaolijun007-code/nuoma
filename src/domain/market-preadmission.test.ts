import { describe, expect, it } from "vitest";
import {
  buildPreadmissionMarkdown,
  intendedDepartmentOptions,
  normalizePatientQuery,
  notificationStatusLabel,
  patientTypeOptions,
  validatePreadmissionDraft,
  type PreadmissionMessageModel,
} from "./market-preadmission";

const validDraft = {
  clientSubmissionId: "ad1a5d26-7f3d-4a81-8230-fc7ff5fd14c7",
  patientId: "P-001",
  contactPhone: "13800138000",
  patientType: "普通居民医保" as const,
  plannedAdmissionDate: "2026-09-20",
  intendedDepartment: "风湿免疫科" as const,
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
  patientType: "普通居民医保",
  plannedAdmissionDate: "2026-09-20",
  intendedDepartment: "风湿免疫科",
  mainProblem: "反复腹胀，希望进一步评估",
  contactResult: "patient_interested",
  notes: "上午联系方便",
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

  it("limits patient type and intended department to the approved option lists", () => {
    expect(patientTypeOptions).toEqual(["城镇职工医保", "低保人员医保", "普通居民医保", "特困供养人员医保", "自费"]);
    expect(intendedDepartmentOptions).toEqual(["风湿免疫科", "康复科", "老年医学科", "住院内一科", "住院外一科"]);
    expect(() => validatePreadmissionDraft({ ...validDraft, patientType: "" as never })).toThrow("请选择患者类型");
    expect(() => validatePreadmissionDraft({ ...validDraft, patientType: "商业保险" as never })).toThrow("患者类型无效");
    expect(() => validatePreadmissionDraft({ ...validDraft, intendedDepartment: "消化内科" as never })).toThrow("拟住院科室无效");
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
    expect(validatePreadmissionDraft({ ...validDraft, notes: "" }).notes).toBe("");
    expect(validatePreadmissionDraft({ ...validDraft, notes: "备".repeat(500) }).notes).toHaveLength(500);
    expect(() => validatePreadmissionDraft({ ...validDraft, notes: "备".repeat(501) })).toThrow("备注不能超过 500 个字");
    expect(() => validatePreadmissionDraft({ ...validDraft, clientSubmissionId: "duplicate" })).toThrow("提交标识无效");
  });

  it("builds a motivational WeCom message with the explicitly required full identity fields and notes", () => {
    const markdown = buildPreadmissionMarkdown(message);
    expect(markdown).toContain("### 🎯 新增预住院线索");
    expect(markdown).toContain('<font color="info">● 有效意向线索｜建议优先确认</font>');
    expect(markdown).toContain("**患者姓名**：张三");
    expect(markdown).toContain("**联系电话**：13800138000");
    expect(markdown).toContain("**患者类型**：普通居民医保");
    expect(markdown).toContain("**拟住院科室**：风湿免疫科");
    expect(markdown).toContain("**备注**：上午联系方便");
    expect(markdown).toContain("感谢及时登记，请继续保持完整记录");
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
      notes: "方便<上午>`\n[联系]",
    });
    expect(markdown).not.toContain("张<三>");
    expect(markdown).not.toContain("[测试]");
    expect(markdown).not.toContain("方便<上午>");
    expect(markdown).not.toContain("[联系]");
    expect(markdown).not.toContain("`");
    expect(markdown).not.toContain("第一行\r\n第二行");
  });

  it.each([
    ["family_interested", "info", "有效意向线索｜建议优先确认"],
    ["considering", "warning", "待持续跟进｜请安排下一次联系"],
    ["no_answer", "warning", "待持续跟进｜请安排下一次联系"],
    ["declined", "comment", "已完成触达记录｜感谢完成真实记录"],
    ["other", "comment", "已完成触达记录｜感谢完成真实记录"],
  ] as const)("maps %s to its approved visual status", (contactResult, color, label) => {
    const markdown = buildPreadmissionMarkdown({ ...message, contactResult });
    expect(markdown).toContain(`<font color="${color}">● ${label}</font>`);
  });

  it("shows an explicit placeholder when notes are empty", () => {
    expect(buildPreadmissionMarkdown({ ...message, notes: "" })).toContain("**备注**：未填写");
  });

  it("keeps full patient identity while limiting the message to 4096 UTF-8 bytes", () => {
    const patientName = "患者".repeat(20);
    const contactPhone = "138001380001380013800013800013";
    const markdown = buildPreadmissionMarkdown({
      ...message,
      recordId: "PY-".padEnd(40, "9"),
      patientName,
      contactPhone,
      sex: "未记录信息".repeat(2),
      mainProblem: "主要问题".repeat(125),
      notes: "跟进备注".repeat(125),
      createdByName: "市场人员".repeat(10),
    });
    expect(markdown).toContain(`**患者姓名**：${patientName}`);
    expect(markdown).toContain(`**联系电话**：${contactPhone}`);
    expect(new TextEncoder().encode(markdown).byteLength).toBeLessThanOrEqual(4096);
  });

  it("uses unambiguous notification labels", () => {
    expect(notificationStatusLabel("sent")).toBe("已推送");
    expect(notificationStatusLabel("failed")).toBe("登记已保存，群推送失败");
    expect(notificationStatusLabel("not_configured")).toBe("登记已保存，群机器人未配置");
    expect(notificationStatusLabel("pending")).toBe("登记已保存，等待推送");
  });
});
