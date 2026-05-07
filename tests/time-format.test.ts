import { describe, expect, it } from "vitest";

import { formatDurationFromSeconds } from "@/lib/utils/time";

describe("time formatting", () => {
  it("formats minutes and seconds on one line", () => {
    expect(formatDurationFromSeconds(63)).toBe("1m 3s");
    expect(formatDurationFromSeconds(120)).toBe("2m 0s");
  });

  it("formats sub-minute durations as seconds only", () => {
    expect(formatDurationFromSeconds(45)).toBe("45s");
  });
});
