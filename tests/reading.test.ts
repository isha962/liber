import { describe, expect, it } from "vitest";

import {
  calculateDurationMinutes,
  calculatePagesPerHour,
  calculatePagesRead,
  calculateProgressPercentage,
  createSessionSummary,
  getAutoStartPage,
  updateStreak,
} from "@/lib/utils/reading";
import type { ReadingSession } from "@/lib/types";

describe("reading utilities", () => {
  it("calculates pages read from page numbers", () => {
    expect(calculatePagesRead(24, 52)).toBe(28);
  });

  it("calculates session duration in minutes", () => {
    expect(calculateDurationMinutes(new Date("2026-05-01T10:00:00.000Z"), new Date("2026-05-01T10:47:00.000Z"))).toBe(47);
  });

  it("calculates pages per hour", () => {
    expect(calculatePagesPerHour(30, 45)).toBe(40);
  });

  it("calculates progress percentage", () => {
    expect(calculateProgressPercentage(52, 320)).toBe(16.25);
  });

  it("reads the next start page from the latest session", () => {
    const sessions: ReadingSession[] = [
      {
        id: "session-1",
        bookId: "book-1",
        startedAt: "2026-05-01T10:00:00.000Z",
        endedAt: "2026-05-01T10:20:00.000Z",
        startValue: 24,
        endValue: 52,
        progressUnit: "page",
        caffeineAmount: 1,
        durationMinutes: 20,
        pagesRead: 28,
      },
    ];

    expect(getAutoStartPage("book-1", sessions, 10)).toBe(52);
  });

  it("creates a summary for the share flow", () => {
    const summary = createSessionSummary({
      bookTotalPages: 320,
      startValue: 24,
      endValue: 52,
      progressUnit: "page",
      startedAt: "2026-05-01T10:00:00.000Z",
      endedAt: "2026-05-01T10:48:00.000Z",
      previousStreak: 2,
      lastSessionDate: "2026-04-30T08:00:00.000Z",
      caffeineAmount: 2,
    });

    expect(summary.pagesRead).toBe(28);
    expect(summary.minutesRead).toBe(48);
    expect(summary.progressBefore).toBe(7.5);
    expect(summary.progressAfter).toBe(16.25);
    expect(summary.caffeineAmount).toBe(2);
  });

  it("updates streak for consecutive days", () => {
    expect(updateStreak(3, "2026-05-01T08:00:00.000Z", "2026-05-02T10:00:00.000Z")).toBe(4);
  });
});
