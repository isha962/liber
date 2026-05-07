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
    <div>
      <p className="text-muted text-xs font-semibold uppercase tracking-[0.24em]">Add Book</p>
      <div className="mt-4 grid gap-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="ui-input rounded-[22px] px-4 py-3.5 text-sm placeholder:text-neutral-400"
        />
        <input
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          placeholder="Author"
          className="ui-input rounded-[22px] px-4 py-3.5 text-sm placeholder:text-neutral-400"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value as BookFormat)}
            className="ui-input rounded-[22px] px-4 py-3.5 text-sm"
          >
            <option value="physical">Physical</option>
            <option value="kindle">Kindle</option>
            <option value="pdf">PDF</option>
            <option value="audiobook">Audiobook</option>
          </select>
          <select
            value={progressUnit}
            onChange={(event) => setProgressUnit(event.target.value as ProgressUnit)}
            className="ui-input rounded-[22px] px-4 py-3.5 text-sm"
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
            className="ui-input rounded-[22px] px-4 py-3.5 text-sm placeholder:text-neutral-400"
          />
          <input
            value={startValue}
            onChange={(event) => setStartValue(event.target.value)}
            placeholder={progressUnit === "page" ? "Start page" : "Start %"}
            className="ui-input rounded-[22px] px-4 py-3.5 text-sm placeholder:text-neutral-400"
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
          className="primary-cta mt-2 rounded-full px-5 py-3.5 text-sm font-bold text-white"
        >
          Add book
        </button>
        <button
          type="button"
          onClick={onUseSample}
          className="secondary-cta text-ink rounded-full px-5 py-3.5 text-sm font-bold"
        >
          Use sample book
        </button>
      </div>
    </div>
  );
}
