export type ProgressUnit = "page" | "percent";
export type BookFormat = "physical" | "kindle" | "pdf" | "audiobook";
export type ShareVariant = "black" | "transparent";
export type SourceType = "manual" | "google_books" | "pdf";

export interface User {
  id: string;
  name: string;
  streakCount: number;
  totalPagesRead: number;
  totalMinutesRead: number;
  lastSessionDate?: string;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  format: BookFormat;
  sourceType: SourceType;
  totalPages: number;
  currentPage: number;
  progressUnit: ProgressUnit;
  coverImageUrl?: string;
  fileName?: string;
  fileId?: string;
  fileUrl?: string;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  sourceType?: SourceType;
  startedAt: string;
  endedAt?: string;
  startValue: number;
  endValue?: number;
  startPage?: number;
  endPage?: number;
  progressUnit: ProgressUnit;
  note: string;
  caffeineAmount: number;
  durationMinutes?: number;
  durationSeconds?: number;
  pagesRead?: number;
  progressBefore?: number;
  progressAfter?: number;
  streakDay?: number;
}

export interface SessionSummaryData {
  pagesRead: number;
  minutesRead: number;
  pagesPerHour: number;
  progressBefore: number;
  progressAfter: number;
  streakDay: number;
  caffeineAmount: number;
}

export interface ShareCard {
  bookTitle: string;
  author: string;
  dateLabel: string;
  totalPages: number;
  startPage: number;
  endPage: number;
  pagesRead: number;
  minutesRead: number;
  durationLabel: string;
  durationShortLabel: string;
  pagesPerHour: number;
  progressBefore: number;
  progressAfter: number;
  streakCount: number;
  caffeineAmount: number;
  note?: string;
}
