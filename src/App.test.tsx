import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";
import { brandRegistry } from "./brand";
import { saveDraft } from "./domain/draft";
import { createSurveyPages } from "./domain/survey-flow";

describe("survey application", () => {
  it("requires privacy acknowledgement before starting the hospital assessment", async () => {
    const user = userEvent.setup();
    render(<App />);

    const start = screen.getByRole("button", { name: "开始评估" });
    expect(start).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /同意按院方隐私说明/ }));
    expect(start).toBeEnabled();
    await user.click(start);
    expect(screen.getByRole("heading", { name: "先从基本信息开始" })).toBeInTheDocument();
  });

  it("keeps the independent Nuoma Yuanyi single-question validation", async () => {
    const user = userEvent.setup();
    render(<App brand={brandRegistry["nuoma-yuanyi"]} />);
    await user.click(screen.getByRole("checkbox", { name: /我已阅读并理解/ }));
    await user.click(screen.getByRole("button", { name: "开始填写" }));
    await user.click(screen.getByRole("button", { name: "下一题" }));

    expect(screen.getByRole("alert")).toHaveTextContent("还有内容需要完成");
    expect(screen.getByRole("heading", { name: "姓名" })).toBeInTheDocument();
  });

  it("renders the independent Nuoma Yuanyi identity without hospital copy", async () => {
    const user = userEvent.setup();
    render(<App brand={brandRegistry["nuoma-yuanyi"]} />);

    expect(screen.getByText("诺玛元一")).toBeInTheDocument();
    expect(screen.getByText("生命健康管理")).toBeInTheDocument();
    expect(screen.queryByText("建始民族医院")).not.toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("data-survey-brand", "nuoma-yuanyi");
    expect(document.title).toBe("健康与功能状态问卷｜诺玛元一");

    await user.click(screen.getByRole("checkbox", { name: /我已阅读并理解/ }));
    await user.click(screen.getByRole("button", { name: "开始填写" }));
    expect(screen.getByText("1 / 64")).toBeInTheDocument();
    expect(screen.getByLabelText(/姓名/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/年龄/)).not.toBeInTheDocument();
    expect(screen.queryByText("信息仅用于院内健康评估与记录匹配。")).not.toBeInTheDocument();
  });

  it("validates and advances one Nuoma question at a time", async () => {
    const user = userEvent.setup();
    render(<App brand={brandRegistry["nuoma-yuanyi"]} />);
    await user.click(screen.getByRole("checkbox", { name: /我已阅读并理解/ }));
    await user.click(screen.getByRole("button", { name: "开始填写" }));

    await user.click(screen.getByRole("button", { name: "下一题" }));
    expect(screen.getByRole("alert")).toHaveTextContent("还有内容需要完成");
    expect(screen.queryByLabelText(/年龄/)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/姓名/), "张三");
    await user.click(screen.getByRole("button", { name: "下一题" }));
    expect(screen.getByText("2 / 64")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("heading", { name: "年龄" })).toHaveFocus();
    expect(screen.getByLabelText(/年龄/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/姓名/)).not.toBeInTheDocument();
  });

  it("shows a Nuoma companion input on the same owner page", async () => {
    const brand = brandRegistry["nuoma-yuanyi"];
    const workStatusPageIndex = createSurveyPages("questions").findIndex(({ primaryQuestionId }) => primaryQuestionId === "workStatus");
    saveDraft({ workStatus: "5" }, workStatusPageIndex, window.localStorage, Date.now(), brand.draftKey);
    const user = userEvent.setup();
    render(<App brand={brand} />);
    await user.click(screen.getByRole("checkbox", { name: /我已阅读并理解/ }));
    await user.click(screen.getByRole("button", { name: "开始填写" }));

    expect(screen.getByText("5 / 64")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /职业状态/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/其他职业状态/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/优先改善3个问题/)).not.toBeInTheDocument();
  });

  it("routes the hospital brand to the new identity flow without age", async () => {
    const user = userEvent.setup();
    render(<App brand={brandRegistry.hospital} />);

    expect(screen.getByText("建始民族医院")).toBeInTheDocument();
    expect(screen.getByText("衰老与健康管理中心")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /同意按院方隐私说明/ }));
    await user.click(screen.getByRole("button", { name: "开始评估" }));
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(screen.getByRole("textbox", { name: "请问您的姓名是？" })).toBeInTheDocument();
    expect(screen.queryByText("1 / 64")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/年龄/)).not.toBeInTheDocument();
  });
});
