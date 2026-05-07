"use client";

import { useState } from "react";

import type { Book, BookFormat, ProgressUnit } from "@/lib/types";

interface BookFormProps {
  initialStartValue: number;
  onSubmit: (payload: Omit<Book, "id" | "currentPage">, startValue: number) => void;
  onUseSample: () => void;
}

export function BookForm({ initialStartValue, onSubmit, onUseSample }: BookFormProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [format, setFormat] = useState<BookFormat>("physical");
  const [totalPages, setTotalPages] = useState("304");
  const [progressUnit, setProgressUnit] = useState<ProgressUnit>("page");
  const [startValue, setStartValue] = useState(String(initialStartValue));

  return (
    <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Add Book</p>
      <div className="mt-4 grid gap-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-[var(--orange)]"
        />
        <input
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          placeholder="Author"
          className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-[var(--orange)]"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value as BookFormat)}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-[var(--orange)]"
          >
            <option value="physical">Physical</option>
            <option value="kindle">Kindle</option>
            <option value="pdf">PDF</option>
            <option value="audiobook">Audiobook</option>
          </select>
          <select
            value={progressUnit}
            onChange={(event) => setProgressUnit(event.target.value as ProgressUnit)}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-[var(--orange)]"
          >
            <option value="page">Page mode</option>
            <option value="percent">Percent mode</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            value={totalPages}
            onChange={(event) => setTotalPages(event.target.value)}
            placeholder="Total pages"
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-[var(--orange)]"
          />
          <input
            value={startValue}
            onChange={(event) => setStartValue(event.target.value)}
            placeholder={progressUnit === "page" ? "Start page" : "Start %"}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-[var(--orange)]"
          />
        </div>
        <button
          type="button"
          onClick={() =>
            onSubmit(
              {
                title,
                author,
                format,
                sourceType: "manual",
                totalPages: Number(totalPages) || 0,
                progressUnit,
              },
              Number(startValue) || 0,
            )
          }
          className="mt-2 rounded-full bg-[var(--orange)] px-5 py-3 text-sm font-bold text-white"
        >
          Add book
        </button>
        <button
          type="button"
          onClick={onUseSample}
          className="rounded-full border border-neutral-200 px-5 py-3 text-sm font-bold text-neutral-900"
        >
          Use sample book
        </button>
      </div>
    </div>
  );
}
