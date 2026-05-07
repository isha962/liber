import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("react-pdf", () => ({
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: "",
    },
  },
  Document: ({ children }: { children: React.ReactNode }) => React.createElement("div", { "data-testid": "pdf-document" }, children),
  Page: ({ pageNumber }: { pageNumber: number }) => React.createElement("div", { "data-testid": "pdf-page" }, `PDF page ${pageNumber}`),
}));
