import { formatDurationFromSeconds } from "@/lib/utils/time";
import type { Book, ReadingSession, ShareCard } from "@/lib/types";

export function buildShareCardFromSession(session: ReadingSession, book: Book): ShareCard | null {
  if (
    typeof session.pagesRead !== "number" ||
    typeof session.durationMinutes !== "number" ||
    typeof session.durationSeconds !== "number" ||
    typeof session.progressBefore !== "number" ||
    typeof session.progressAfter !== "number" ||
    typeof session.streakDay !== "number" ||
    typeof session.endedAt !== "string" ||
    typeof session.endValue !== "number"
  ) {
    return null;
  }

  return {
    bookTitle: book.title,
    author: book.author ?? "",
    dateLabel: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(session.endedAt)),
    totalPages: book.totalPages,
    startPage: session.startPage ?? session.startValue,
    endPage: session.endPage ?? session.endValue,
    pagesRead: session.pagesRead,
    minutesRead: session.durationMinutes,
    durationLabel: formatDurationFromSeconds(session.durationSeconds),
    durationShortLabel: formatDurationFromSeconds(session.durationSeconds),
    pagesPerHour: Math.round((session.pagesRead / Math.max(session.durationMinutes, 1)) * 60),
    progressBefore: session.progressBefore,
    progressAfter: session.progressAfter,
    streakCount: session.streakDay,
    caffeineAmount: session.caffeineAmount,
    note: session.note,
  };
}
