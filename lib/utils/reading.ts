import type { ProgressUnit, ReadingSession, SessionSummaryData } from "@/lib/types";

const MINUTES_PER_HOUR = 60;

export function calculatePagesRead(startValue: number, endValue: number) {
  return Math.max(0, endValue - startValue);
}

export function calculateDurationMinutes(startedAt: Date, endedAt: Date) {
  const diffSeconds = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
  return Math.max(1, Math.round(diffSeconds / 60));
}

export function calculateDurationSeconds(startedAt: Date, endedAt: Date) {
  return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
}

export function calculateProgressPercentage(currentPage: number, totalPages: number) {
  if (totalPages <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((currentPage / totalPages) * 10000) / 100);
}

export function calculatePagesPerHour(pagesRead: number, durationMinutes: number) {
  if (durationMinutes <= 0) {
    return 0;
  }

  return Math.round((pagesRead / durationMinutes) * MINUTES_PER_HOUR);
}

export function updateStreak(previousStreak: number, lastSessionDate: string | undefined, nextSessionDate: string) {
  if (!lastSessionDate) {
    return 1;
  }

  const last = new Date(lastSessionDate);
  const next = new Date(nextSessionDate);
  const lastDay = Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate());
  const nextDay = Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate());
  const diffDays = Math.round((nextDay - lastDay) / 86400000);

  if (diffDays <= 0) {
    return previousStreak;
  }

  if (diffDays === 1) {
    return previousStreak + 1;
  }

  return 1;
}

export function getAutoStartPage(bookId: string, sessions: ReadingSession[], fallback: number) {
  const latest = sessions.find((session) => session.bookId === bookId && typeof session.endValue === "number");
  return latest?.endValue ?? fallback;
}

export function startSession(bookId: string, startValue: number, progressUnit: ProgressUnit): ReadingSession {
  return {
    id: `session-${Date.now()}`,
    bookId,
    startedAt: new Date().toISOString(),
    startValue,
    progressUnit,
    note: "",
    caffeineAmount: 0,
  };
}

interface CreateSessionSummaryInput {
  bookTotalPages: number;
  startValue: number;
  endValue: number;
  progressUnit: ProgressUnit;
  startedAt: string;
  endedAt: string;
  previousStreak: number;
  lastSessionDate?: string;
  caffeineAmount: number;
}

export function createSessionSummary(input: CreateSessionSummaryInput): SessionSummaryData {
  const startPage = input.progressUnit === "percent" ? Math.round((input.startValue / 100) * input.bookTotalPages) : input.startValue;
  const endPage = input.progressUnit === "percent" ? Math.round((input.endValue / 100) * input.bookTotalPages) : input.endValue;
  const pagesRead = calculatePagesRead(startPage, endPage);
  const minutesRead = calculateDurationMinutes(new Date(input.startedAt), new Date(input.endedAt));
  const pagesPerHour = calculatePagesPerHour(pagesRead, minutesRead);
  const progressBefore = calculateProgressPercentage(startPage, input.bookTotalPages);
  const progressAfter = calculateProgressPercentage(endPage, input.bookTotalPages);
  const streakDay = updateStreak(input.previousStreak, input.lastSessionDate, input.endedAt);

  return {
    pagesRead,
    minutesRead,
    pagesPerHour,
    progressBefore,
    progressAfter,
    streakDay,
    caffeineAmount: input.caffeineAmount,
  };
}
