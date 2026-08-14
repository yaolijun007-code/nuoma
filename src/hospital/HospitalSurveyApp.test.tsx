import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { brandRegistry } from "../brand";
import { CompletionPage } from "./components/CompletionPage";
import { ChoiceGroup } from "./components/ChoiceGroup";
import { saveHospitalDraft } from "./draft";
import { HospitalSurveyApp } from "./HospitalSurveyApp";
import { findHospitalQuestion } from "./surveyDefinition";

describe("hospital one-question mobile experience", () => {
  afterEach(() => vi.useRealTimers());

  it("renders the restrained hospital welcome page", () => {
    render(<HospitalSurveyApp brand={brandRegistry.hospital} />);
    expect(screen.getByRole("heading", { name: "男性健康与功能状态评估" })).toBeInTheDocument();
    expect(screen.getByText("一题一页")).toBeInTheDocument();
    expect(screen.getByText(/上海诺玛元一生物科技发展有限公司/)).toBeInTheDocument();
    expect(screen.queryByText("读懂身体正在发生的细微变化")).not.toBeInTheDocument();
  });

  it("collects only name and full phone before entering click-based questions", async () => {
    const user = userEvent.setup();
    render(<HospitalSurveyApp brand={brandRegistry.hospital} />);
    await user.click(screen.getByRole("checkbox", { name: /同意按院方隐私说明/ }));
    await user.click(screen.getByRole("button", { name: "开始评估" }));
    await user.click(screen.getByRole("button", { name: "继续" }));

    expect(screen.getByRole("heading", { name: "请问您的姓名是？" })).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "请问您的姓名是？" }), "张三");
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(screen.getByRole("textbox", { name: "请填写您的手机号码" })).toHaveAttribute("inputmode", "numeric");
    expect(screen.queryByText("年龄")).not.toBeInTheDocument();
  });

  it("advances ordinary single choices after a short selected-state delay", async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const onAutoAdvance = vi.fn();
    const question = findHospitalQuestion("q4");
    if (!question) throw new Error("q4 missing");
    render(<ChoiceGroup question={question} value={undefined} onChange={onChange} onAutoAdvance={onAutoAdvance} />);
    fireEvent.click(screen.getByRole("radio", { name: "从不" }));
    expect(onChange).toHaveBeenCalledWith("0");
    expect(onAutoAdvance).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(210); });
    expect(onAutoAdvance).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
  });

  it("renders a non-diagnostic completion flow and a gentle safety notice", () => {
    render(<CompletionPage hasRedFlag confirmationId="JS-TEST" />);
    expect(screen.getByRole("heading", { name: "健康信息采集完成" })).toBeInTheDocument();
    expect(screen.getByText("微生态检测")).toBeInTheDocument();
    expect(screen.getByText(/建议由医务人员进一步确认/)).toBeInTheDocument();
    expect(screen.queryByText("您的功能状态画像")).not.toBeInTheDocument();
    expect(screen.getByText(/与微生态检测数据及已有健康资料进行综合分析/)).toBeInTheDocument();
  });

  it("uses the female-specific completion disclaimer only for the female variant", () => {
    render(<CompletionPage hasRedFlag={false} confirmationId="JS-FEMALE" variant="female" />);
    expect(screen.getByText(/与当前体检、既往健康资料及必要的专项检测综合分析/)).toBeInTheDocument();
    expect(screen.queryByText(/与微生态检测数据及已有健康资料进行综合分析/)).not.toBeInTheDocument();
  });

  it("offers resume or restart for a valid hospital draft", async () => {
    const user = userEvent.setup();
    saveHospitalDraft({ name: "张三", phone: "13800138000", q1: "2", date: "2026-08-13" }, "q1", brandRegistry.hospital.draftKey);

    render(<HospitalSurveyApp brand={brandRegistry.hospital} />);
    expect(screen.getByText("检测到未完成的健康评估")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "继续填写" }));
    expect(screen.getByRole("heading", { name: "您如何评价自己目前整体身体状态？" })).toBeInTheDocument();
  });
});
