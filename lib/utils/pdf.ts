import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

import type { Book } from "@/lib/types";

if (typeof window !== "undefined" && !GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
}

export interface PdfUploadMetadata {
  title: string;
  fileName: string;
  totalPages: number;
}

export async function extractPdfMetadata(file: File): Promise<PdfUploadMetadata> {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const title = file.name.replace(/\.pdf$/i, "");

  return {
    title,
    fileName: file.name,
    totalPages: pdf.numPages,
  };
}

export function createPdfBookFromUpload({
  fileId,
  fileUrl,
  metadata,
}: {
  fileId: string;
  fileUrl?: string;
  metadata: PdfUploadMetadata;
}): Book {
  return {
    id: `book-${Date.now()}`,
    title: metadata.title,
    author: "",
    format: "pdf",
    sourceType: "pdf",
    totalPages: metadata.totalPages,
    currentPage: 1,
    progressUnit: "page",
    fileName: metadata.fileName,
    fileId,
    fileUrl,
  };
}

export function updatePdfBookProgress(books: Book[], bookId: string, currentPage: number) {
  return books.map((book) =>
    book.id === bookId
      ? {
          ...book,
          currentPage: Math.max(1, Math.min(book.totalPages, currentPage)),
        }
      : book,
  );
}
