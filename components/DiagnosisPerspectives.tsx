"use client";

import { useState } from "react";
import type { DiagnosisSummary } from "@/lib/diagnosis/types";

type Section = {
  key: keyof DiagnosisSummary;
  title: string;
  description: string;
};

type Props = {
  sections: Section[];
  summary: DiagnosisSummary;
};

// 既存の「4つの視点」による整理。結果画面の中心からは外し、
// 下部の補足として折りたたみ表示する（詳しく整理すると）。
export default function DiagnosisPerspectives({ sections, summary }: Props) {
  const [open, setOpen] = useState(false);
  const visibleSections = sections.filter((section) => summary[section.key].length > 0);

  if (visibleSections.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 border-t border-ohana-beige-dark pt-6">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full border-2 border-ohana-green px-6 py-3 text-base font-semibold text-ohana-green-dark hover:bg-ohana-green-light"
      >
        {open ? "詳しく整理するを閉じる" : "詳しく整理すると"}
      </button>
      <p className="text-sm leading-loose text-ohana-gray sm:text-base">
        ご回答いただいた内容を、4つの視点にさらに分けて整理したものです。
      </p>

      {open ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {visibleSections.map((section) => (
            <div
              key={section.key}
              className="flex flex-col gap-3 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-6"
            >
              <h3 className="text-lg font-bold text-ohana-ink">{section.title}</h3>
              <p className="text-sm text-ohana-gray">{section.description}</p>
              <ul className="flex flex-col gap-2">
                {summary[section.key].map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-loose text-ohana-ink/90 sm:text-base">
                    <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-ohana-green" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
