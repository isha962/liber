import type { Book, ReadingSession, User } from "@/lib/types";

export const demoUser: User = {
  id: "user-1",
  name: "Liber Reader",
  streakCount: 3,
  totalPagesRead: 118,
  totalMinutesRead: 143,
  lastSessionDate: "2026-05-05T18:10:00.000Z",
};

export const sampleBook: Book = {
  id: "book-sample",
  title: "The Midnight Library",
  author: "Matt Haig",
  format: "physical",
  sourceType: "manual",
  totalPages: 304,
  currentPage: 43,
  progressUnit: "page",
};

export const demoBooks: Book[] = [sampleBook];

export const demoSessions: ReadingSession[] = [
  {
    id: "session-demo-1",
    bookId: sampleBook.id,
    startedAt: "2026-05-05T18:00:00.000Z",
    endedAt: "2026-05-05T18:02:03.000Z",
    startValue: 40,
    endValue: 43,
    startPage: 40,
    endPage: 43,
    sourceType: "manual",
    progressUnit: "page",
    note: "",
    caffeineAmount: 2,
    durationMinutes: 2,
    durationSeconds: 123,
    pagesRead: 3,
    progressBefore: 13,
    progressAfter: 14,
    streakDay: 3,
  },
];
