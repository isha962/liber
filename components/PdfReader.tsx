"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

const workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
}

interface PdfReaderProps {
  title: string;
  file: File | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEndSession: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  missingMessage?: string;
}

export function PdfReader({
  title,
  file,
  currentPage,
  totalPages,
  onPageChange,
  onEndSession,
  isFullscreen,
  onToggleFullscreen,
  missingMessage,
}: PdfReaderProps) {
  const [pageWidth, setPageWidth] = useState(320);

  useEffect(() => {
    function update() {
      const gutter = isFullscreen ? 24 : 72;
      const maxWidth = isFullscreen ? 920 : 420;
      setPageWidth(Math.max(260, Math.min(window.innerWidth - gutter, maxWidth)));
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isFullscreen]);

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-40 flex flex-col bg-neutral-950 px-3 pb-4 pt-4"
          : "mt-4 space-y-4 pb-28"
      }
    >
      <div
        className={
          isFullscreen
            ? "flex h-full flex-col overflow-hidden rounded-none bg-neutral-950 p-0 text-white"
            : "rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5"
        }
      >
        <div className={isFullscreen ? "flex items-center justify-between gap-3 px-2 pb-3 pt-4" : ""}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isFullscreen ? "text-white/55" : "text-neutral-500"}`}>PDF Reader</p>
            <h2 className={`mt-2 text-2xl font-black tracking-tight ${isFullscreen ? "text-white" : "text-neutral-950"}`}>{title}</h2>
          </div>
          <div className={`flex items-center gap-2 ${isFullscreen ? "" : "mt-5"}`}>
            <button
              type="button"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={onToggleFullscreen}
              className={`rounded-full px-4 py-3 text-sm font-bold ${isFullscreen ? "border border-white/15 bg-white/10 text-white" : "border border-neutral-200 text-neutral-900"}`}
            >
              {isFullscreen ? "Exit" : "Fullscreen"}
            </button>
            {isFullscreen ? (
              <button
                type="button"
                onClick={onEndSession}
                className="rounded-full bg-[var(--orange)] px-4 py-3 text-sm font-bold text-white"
              >
                End Session
              </button>
            ) : null}
          </div>
        </div>

        {file ? (
          <div
            className={`relative mt-5 overflow-hidden ${isFullscreen ? "flex-1 rounded-[28px] bg-neutral-900 px-2 py-3" : "rounded-[24px] bg-neutral-100 p-3"}`}
          >
            <div
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className="absolute inset-y-0 left-0 z-10 w-[28%] cursor-pointer bg-transparent"
            />
            <div
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className="absolute inset-y-0 right-0 z-10 w-[28%] cursor-pointer bg-transparent"
            />
            <div className="relative z-0 flex h-full items-center justify-center">
              <Document file={file} loading={<div className="p-10 text-center text-sm text-neutral-500">Loading PDF…</div>}>
                <Page pageNumber={currentPage} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
            </div>
            {isFullscreen ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Previous page"
                      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                      className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-3xl font-medium text-white"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Next page"
                      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                      className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-3xl font-medium text-white"
                    >
                      ›
                    </button>
                  </div>
                  <p className="text-sm font-bold text-white/80">
                    Page {currentPage} / {totalPages}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className={`mt-5 rounded-[24px] p-4 text-sm leading-6 ${isFullscreen ? "bg-white/5 text-white/70" : "bg-neutral-50 text-neutral-500"}`}>
            {missingMessage ?? "Re-upload this PDF to continue reading."}
          </div>
        )}

        {!isFullscreen ? (
          <>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 text-3xl font-medium text-neutral-900"
              >
                ‹
              </button>
              <p className="text-sm font-bold text-neutral-600">
                Page {currentPage} / {totalPages}
              </p>
              <button
                type="button"
                aria-label="Next page"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 text-3xl font-medium text-neutral-900"
              >
                ›
              </button>
            </div>

            <button
              type="button"
              onClick={onEndSession}
              className="mt-5 w-full rounded-full bg-[var(--orange)] px-5 py-3 text-base font-bold text-white"
            >
              End Session
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
