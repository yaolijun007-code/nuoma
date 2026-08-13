import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";
import { brandRegistry } from "./brand";

describe("survey application", () => {
  it("requires privacy acknowledgement before starting", async () => {
    const user = userEvent.setup();
    render(<App />);

    const start = screen.getByRole("button", { name: "开始填写" });
    expect(start).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /我已阅读并理解/ }));
    expect(start).toBeEnabled();
    await user.click(start);
    expect(screen.getByRole("heading", { name: "基本信息" })).toBeInTheDocument();
  });

  it("announces required-field errors and stays on the current step", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("checkbox", { name: /我已阅读并理解/ }));
    await user.click(screen.getByRole("button", { name: "开始填写" }));
    await user.click(screen.getByRole("button", { name: "下一步" }));

    expect(screen.getByRole("alert")).toHaveTextContent("还有内容需要完成");
    expect(screen.getByRole("heading", { name: "基本信息" })).toBeInTheDocument();
  });

  it("renders the independent Nuoma Yuanyi identity without hospital copy", () => {
    render(<App brand={brandRegistry["nuoma-yuanyi"]} />);

    expect(screen.getByText("诺玛元一")).toBeInTheDocument();
    expect(screen.getByText("生命健康管理")).toBeInTheDocument();
    expect(screen.queryByText("建始民族医院")).not.toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("data-survey-brand", "nuoma-yuanyi");
    expect(document.title).toBe("健康与功能状态问卷｜诺玛元一");
  });

  it("preserves the existing hospital identity", () => {
    render(<App brand={brandRegistry.hospital} />);

    expect(screen.getByText("建始民族医院")).toBeInTheDocument();
    expect(screen.getByText("衰老与健康管理中心")).toBeInTheDocument();
  });
});
