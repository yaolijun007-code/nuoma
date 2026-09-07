// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createWeComNotifier, validateWeComWebhook, WeComNotificationError } from "./wecom";

const validWebhook = `https://${["qyapi", "weixin", "qq", "com"].join(".")}/cgi-bin/webhook/send?key=synthetic-test-key`;

describe("market WeCom notifier", () => {
  it("accepts only the exact Enterprise WeChat webhook endpoint", () => {
    expect(validateWeComWebhook(validWebhook)).toBe(true);
    expect(validateWeComWebhook("http://example.com/webhook?key=x")).toBe(false);
    expect(validateWeComWebhook("https://example.com/cgi-bin/webhook/send?key=x")).toBe(false);
    expect(validateWeComWebhook(validWebhook.replace("key=synthetic-test-key", "other=x"))).toBe(false);
  });

  it("returns not_configured without making a request", async () => {
    const fetcher = vi.fn();
    const notifier = createWeComNotifier(() => "", fetcher);
    await expect(notifier.send({} as never, "message")).resolves.toEqual({ status: "not_configured" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("sends markdown with a timeout and accepts errcode zero", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ errcode: 0, errmsg: "ok" }), { status: 200 }));
    const notifier = createWeComNotifier(() => validWebhook, fetcher);
    await expect(notifier.send({} as never, "full identity message")).resolves.toEqual({ status: "sent", responseCode: "0" });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe(validWebhook);
    expect(JSON.parse(String(init.body))).toEqual({ msgtype: "markdown", markdown: { content: "full identity message" } });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns stable error codes without including response details", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ errcode: 93000, errmsg: "private upstream text" }), { status: 200 }));
    const notifier = createWeComNotifier(() => validWebhook, fetcher);
    await expect(notifier.send({} as never, "message")).rejects.toMatchObject({ code: "WECOM_93000" });
    await expect(notifier.send({} as never, "message")).rejects.not.toThrow("private upstream text");
  });

  it("rejects an invalid configured webhook before fetching", async () => {
    const fetcher = vi.fn();
    const notifier = createWeComNotifier(() => "https://example.com/x", fetcher);
    await expect(notifier.send({} as never, "message")).rejects.toBeInstanceOf(WeComNotificationError);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
