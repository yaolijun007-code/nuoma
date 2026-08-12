import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

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
});

