import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {
    workerSrc: "",
  },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 220,
    }),
  })),
}));

import { buildShareCardFromSession } from "@/lib/utils/share-card";
import { createPdfBookFromUpload, extractPdfMetadata, updatePdfBookProgress } from "@/lib/utils/pdf";
import type { Book, ReadingSession } from "@/lib/types";

describe("pdf utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates PDF metadata from an uploaded file mock", async () => {
    const file = new File(["pdf"], "My PDF Book.pdf", { type: "application/pdf" });
    Object.defineProperty(file, "arrayBuffer", {
      configurable: true,
      value: vi.fn(async () => new Uint8Array([1, 2, 3]).buffer),
    });
    const metadata = await extractPdfMetadata(file);

    expect(metadata.title).toBe("My PDF Book");
    expect(metadata.fileName).toBe("My PDF Book.pdf");
    expect(metadata.totalPages).toBe(220);
  });

  it("creates a PDF book entry and updates current page progress", () => {
    const book = createPdfBookFromUpload({
      fileId: "pdf-1",
      fileUrl: "blob:mock",
      metadata: {
        title: "My PDF Book",
        fileName: "My PDF Book.pdf",
        totalPages: 220,
      },
    });

    expect(book.sourceType).toBe("pdf");
    expect(book.currentPage).toBe(1);

    const updated = updatePdfBookProgress([book], book.id, 14);
    expect(updated[0]?.currentPage).toBe(14);
  });

  it("builds share stats from a completed PDF session", () => {
    const book: Book = {
      id: "book-1",
      title: "My PDF Book",
      format: "pdf",
      sourceType: "pdf",
      totalPages: 220,
      currentPage: 14,
      progressUnit: "page",
      fileName: "My PDF Book.pdf",
      fileId: "pdf-1",
    };

    const session: ReadingSession = {
      id: "session-1",
      bookId: book.id,
      sourceType: "pdf",
      startedAt: "2026-05-06T20:00:00.000Z",
      endedAt: "2026-05-06T20:02:03.000Z",
      startValue: 10,
      endValue: 14,
      startPage: 10,
      endPage: 14,
      progressUnit: "page",
      note: "",
      caffeineAmount: 1,
      durationMinutes: 2,
      durationSeconds: 123,
      pagesRead: 4,
      progressBefore: 4.55,
      progressAfter: 6.36,
      streakDay: 2,
    };

    const shareCard = buildShareCardFromSession(session, book);

    expect(shareCard?.durationShortLabel).toBe("2m 3s");
    expect(shareCard?.startPage).toBe(10);
    expect(shareCard?.endPage).toBe(14);
    expect(shareCard?.pagesRead).toBe(4);
  });
});
