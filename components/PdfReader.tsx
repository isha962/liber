"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

const workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
}

interface PdfReaderProps {
  title: string;
  fileUrl: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEndSession: () => void;
  missingMessage?: string;
}

export function PdfReader({
  title,
  fileUrl,
  currentPage,
  totalPages,
  onPageChange,
  onEndSession,
  missingMessage,
}: PdfReaderProps) {
  const [pageWidth, setPageWidth] = useState(320);

  useEffect(() => {
    function update() {
      setPageWidth(Math.min(window.innerWidth - 48, 360));
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="mt-4 space-y-4 pb-28">
      <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">PDF Reader</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">{title}</h2>

        {fileUrl ? (
          <div className="mt-5 overflow-hidden rounded-[24px] bg-neutral-100 p-3">
            <Document file={fileUrl} loading={<div className="p-10 text-center text-sm text-neutral-500">Loading PDF…</div>}>
              <Page pageNumber={currentPage} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
            </Document>
          </div>
        ) : (
          <div className="mt-5 rounded-[24px] bg-neutral-50 p-4 text-sm leading-6 text-neutral-500">
            {missingMessage ?? "Re-upload this PDF to continue reading."}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="rounded-full border border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-900"
          >
            Previous page
          </button>
          <p className="text-sm font-bold text-neutral-600">
            Page {currentPage} / {totalPages}
          </p>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="rounded-full border border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-900"
          >
            Next page
          </button>
        </div>

        <button
          type="button"
          onClick={onEndSession}
          className="mt-5 w-full rounded-full bg-[var(--orange)] px-5 py-3 text-base font-bold text-white"
        >
          End Session
        </button>
      </div>
    </div>
  );
}
