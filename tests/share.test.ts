import { beforeEach, describe, expect, it, vi } from "vitest";
import { toBlob } from "html-to-image";

vi.mock("html-to-image", () => ({
  toBlob: vi.fn(async () => new Blob(["png"], { type: "image/png" })),
}));

import { downloadShareCard } from "@/lib/utils/share";

describe("share helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:mock"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(() => undefined),
    });
  });

  it("preserves transparency when no background color is provided", async () => {
    const node = document.createElement("div");
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    await downloadShareCard(node, {
      width: 1080,
      height: 1920,
    });

    expect(vi.mocked(toBlob).mock.calls[0]?.[1]?.backgroundColor).toBe("transparent");
    expect(clickSpy).toHaveBeenCalled();
  });
});
