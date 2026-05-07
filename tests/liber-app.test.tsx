import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toBlob } from "html-to-image";

vi.mock("html-to-image", () => ({
  toBlob: vi.fn(async () => new Blob(["png"], { type: "image/png" })),
}));

vi.mock("@/lib/utils/pdf", async () => {
  const actual = await vi.importActual<typeof import("@/lib/utils/pdf")>("@/lib/utils/pdf");
  return {
    ...actual,
    extractPdfMetadata: vi.fn(async (file: File) => ({
      title: file.name.replace(/\.pdf$/i, ""),
      fileName: file.name,
      totalPages: 220,
    })),
  };
});

vi.mock("@/lib/utils/pdf-storage", () => ({
  savePdfFile: vi.fn(async () => undefined),
  loadPdfFile: vi.fn(async () => new File(["pdf-content"], "Uploaded PDF.pdf", { type: "application/pdf" })),
}));

import { LiberApp } from "@/components/LiberApp";

describe("LiberApp core flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:mock"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(() => undefined),
    });
  });

  it("moves through add book to share card with calculated stats", async () => {
    render(<LiberApp />);

    fireEvent.click(screen.getByRole("button", { name: "Books" }));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "The Midnight Library" } });
    fireEvent.change(screen.getByPlaceholderText("Author"), { target: { value: "Matt Haig" } });
    fireEvent.change(screen.getByPlaceholderText("Start page"), { target: { value: "24" } });
    fireEvent.click(screen.getByRole("button", { name: "Add book" }));

    fireEvent.click(await screen.findByRole("button", { name: "Start session" }));
    fireEvent.click(await screen.findByRole("button", { name: "End session" }));
    expect(await screen.findByText("What page did you finish on?")).toBeInTheDocument();
    for (let i = 0; i < 28; i += 1) fireEvent.click(screen.getByRole("button", { name: "Increase end page" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase caffeine" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase caffeine" }));
    expect(screen.getByText("28")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save session" }));
    fireEvent.click(await screen.findByRole("button", { name: "Generate Share Card" }));

    expect((await screen.findAllByText("READING SESSION")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("The Midnight Library").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Page 52").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/52 \/ 304 pages/i).length).toBeGreaterThan(0);
  });

  it("saves caffeine from the end-session form and keeps summary read-only", async () => {
    render(<LiberApp />);

    fireEvent.click(screen.getByRole("button", { name: "Books" }));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "The Midnight Library" } });
    fireEvent.change(screen.getByPlaceholderText("Author"), { target: { value: "Matt Haig" } });
    fireEvent.change(screen.getByPlaceholderText("Start page"), { target: { value: "24" } });
    fireEvent.click(screen.getByRole("button", { name: "Add book" }));

    fireEvent.click(await screen.findByRole("button", { name: "Start session" }));
    fireEvent.click(await screen.findByRole("button", { name: "End session" }));
    for (let i = 0; i < 28; i += 1) fireEvent.click(screen.getByRole("button", { name: "Increase end page" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase caffeine" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase caffeine" }));
    fireEvent.click(screen.getByRole("button", { name: "Save session" }));

    const stored = JSON.parse(localStorage.getItem("liber-mvp-state-v2") ?? "{}");
    expect(stored.sessions?.[0]?.caffeineAmount).toBe(2);
    expect(screen.queryByRole("button", { name: "Increase caffeine" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Generate Share Card" }));
    expect(screen.getAllByText("Caffeine").length).toBeGreaterThan(0);
  });

  it("uses the simplified share flow without note or display toggles", async () => {
    render(<LiberApp />);

    fireEvent.click(screen.getByRole("button", { name: "Books" }));
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "The Midnight Library" } });
    fireEvent.change(screen.getByPlaceholderText("Author"), { target: { value: "Matt Haig" } });
    fireEvent.change(screen.getByPlaceholderText("Start page"), { target: { value: "24" } });
    fireEvent.click(screen.getByRole("button", { name: "Add book" }));

    fireEvent.click(await screen.findByRole("button", { name: "Start session" }));
    fireEvent.click(await screen.findByRole("button", { name: "End session" }));
    for (let i = 0; i < 28; i += 1) fireEvent.click(screen.getByRole("button", { name: "Increase end page" }));
    fireEvent.click(screen.getByRole("button", { name: "Save session" }));
    expect(screen.queryByText("Customize share")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Generate Share Card" }));

    expect(screen.getAllByText("YOU ARE HERE").length).toBeGreaterThan(0);
    expect(screen.queryByText("Show note on share card")).not.toBeInTheDocument();
  });

  it("edits a completed session in place and updates the share card", async () => {
    render(<LiberApp />);

    fireEvent.click(screen.getByRole("button", { name: "Session" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(await screen.findByText("Edit Session")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Increase end page" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase caffeine" }));
    fireEvent.click(screen.getByRole("button", { name: "Update session" }));

    const stored = JSON.parse(localStorage.getItem("liber-mvp-state-v2") ?? "{}");
    expect(stored.sessions).toHaveLength(1);
    expect(stored.sessions?.[0]?.endPage).toBe(44);
    expect(stored.sessions?.[0]?.caffeineAmount).toBe(3);

    fireEvent.click(screen.getByRole("button", { name: "Generate Share Card" }));

    expect(screen.getAllByText("Page 44").length).toBeGreaterThan(0);
  });

  it("has no back button on books or session", () => {
    render(<LiberApp />);
    fireEvent.click(screen.getByRole("button", { name: "Books" }));
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Session" }));
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("exports a transparent share when selected", async () => {
    render(<LiberApp />);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    fireEvent.click(screen.getByRole("button", { name: "Transparent Overlay" }));
    fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));

    await waitFor(() => {
      expect(vi.mocked(toBlob)).toHaveBeenCalled();
    });

    expect(vi.mocked(toBlob).mock.calls.at(-1)?.[1]?.backgroundColor).toBe("transparent");
  });

  it("uploads a PDF, persists its current page, and shares PDF session stats", async () => {
    render(<LiberApp />);

    fireEvent.click(screen.getByRole("button", { name: "Books" }));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["pdf-content"], "Uploaded PDF.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByRole("button", { name: "Read PDF" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Read PDF" }));

    expect(await screen.findByText("PDF page 1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Page 3 / 220")).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem("liber-mvp-state-v2") ?? "{}");
    expect(stored.books?.[0]?.currentPage).toBe(3);

    fireEvent.click(screen.getByRole("button", { name: "End Session" }));
    expect(await screen.findByText("What page did you finish on?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save session" }));
    expect(await screen.findByText("Session saved")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Generate Share Card" }));

    expect(screen.getAllByText("Uploaded PDF").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Page 3").length).toBeGreaterThan(0);
  });

  it("supports fullscreen PDF reading and hides the bottom nav there", async () => {
    render(<LiberApp />);

    fireEvent.click(screen.getByRole("button", { name: "Books" }));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["pdf-content"], "Uploaded PDF.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(await screen.findByRole("button", { name: "Read PDF" }));
    fireEvent.click(await screen.findByRole("button", { name: "Enter fullscreen" }));

    expect(screen.queryByRole("button", { name: "Home" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exit fullscreen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeInTheDocument();
  });
});
