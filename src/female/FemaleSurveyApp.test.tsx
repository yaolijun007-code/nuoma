import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { brandRegistry } from "../brand";
import App from "../App";
import { FemaleSurveyApp } from "./FemaleSurveyApp";

describe("hospital female survey experience", () => {
  it("renders a distinct women health welcome page", () => {
    render(<FemaleSurveyApp brand={brandRegistry["hospital-female"]} />);
    expect(screen.getByRole("heading", { name: "女性健康与功能状态评估" })).toBeInTheDocument();
    expect(screen.getByText("55个轻量问题")).toBeInTheDocument();
    expect(screen.getByText(/40岁及以上女性/)).toBeInTheDocument();
  });

  it("starts with identity questions and a system-generated date", async () => {
    const user = userEvent.setup();
    render(<FemaleSurveyApp brand={brandRegistry["hospital-female"]} />);
    await user.click(screen.getByRole("checkbox", { name: /同意按院方隐私说明/ }));
    await user.click(screen.getByRole("button", { name: "开始评估" }));
    expect(screen.getByRole("heading", { name: "请问您的姓名是？" })).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "请问您的姓名是？" }), "李女士");
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(screen.getByRole("textbox", { name: "请填写您的手机号码" })).toHaveAttribute("inputmode", "numeric");
  });

  it("routes the female brand to the female experience", () => {
    render(<App brand={brandRegistry["hospital-female"]} />);
    expect(screen.getByRole("heading", { name: "女性健康与功能状态评估" })).toBeInTheDocument();
  });
});
