"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DIAGNOSIS_QUESTIONS } from "@/lib/diagnosis/questions";
import { buildDiagnosisResultPath } from "@/lib/diagnosis/schema";
import type { DiagnosisAnswers } from "@/lib/diagnosis/types";

export default function DiagnosisWizard() {
  const router = useRouter();
  const [stage, setStage] = useState<"intro" | "question">("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<DiagnosisAnswers>({});
  const [isNavigating, setIsNavigating] = useState(false);

  const totalQuestions = DIAGNOSIS_QUESTIONS.length;
  const question = DIAGNOSIS_QUESTIONS[stepIndex];
  const selected = answers[question?.id ?? ""] ?? [];

  const toggleOption = (value: string) => {
    if (!question) return;
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      if (question.multiple) {
        const next = current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];
        return { ...prev, [question.id]: next };
      }
      return { ...prev, [question.id]: [value] };
    });
  };

  const goNext = () => {
    if (stepIndex + 1 < totalQuestions) {
      setStepIndex((prev) => prev + 1);
      return;
    }
    setIsNavigating(true);
    router.push(buildDiagnosisResultPath(answers));
  };

  const goBack = () => {
    if (stepIndex === 0) {
      setStage("intro");
      return;
    }
    setStepIndex((prev) => prev - 1);
  };

  if (stage === "intro") {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-base leading-loose text-ohana-gray sm:text-lg">
          {totalQuestions}問の質問にお答えいただくと、現在の状況を4つの視点に整理してご案内します。医療・介護・法律・税務・不動産の判断や診断ではありません。
        </p>
        <ul className="flex flex-col gap-2 text-sm text-ohana-gray sm:text-base">
          <li>・氏名や住所、病名、資産額などはお伺いしません。</li>
          <li>・結果は選択式回答をもとにURLへ記録され、そのURLを知っている人だけが結果を見られます。</li>
          <li>・前の質問に戻ってやり直すこともできます。</li>
        </ul>
        <button
          type="button"
          onClick={() => setStage("question")}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-base font-semibold text-ohana-white hover:bg-ohana-green-dark sm:w-auto"
        >
          質問をはじめる
        </button>
      </div>
    );
  }

  const progressPercent = Math.round(((stepIndex + 1) / totalQuestions) * 100);
  const canProceed = selected.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-ohana-brown" aria-live="polite">
          質問 {stepIndex + 1} / {totalQuestions}
        </p>
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="質問の進捗"
          className="h-2 w-full overflow-hidden rounded-full bg-ohana-beige-dark"
        >
          <div
            className="h-full rounded-full bg-ohana-green transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-xl font-bold leading-snug text-ohana-ink sm:text-2xl">
          {question.title}
        </legend>
        {question.hint ? <p className="text-sm text-ohana-gray">{question.hint}</p> : null}

        <div className="flex flex-col gap-3">
          {question.options.map((option) => {
            const isChecked = selected.includes(option.value);
            return (
              <label
                key={option.value}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-base transition-colors ${
                  isChecked
                    ? "border-ohana-green bg-ohana-green-light text-ohana-ink"
                    : "border-ohana-beige-dark bg-ohana-white text-ohana-ink hover:border-ohana-green"
                }`}
              >
                <input
                  type={question.multiple ? "checkbox" : "radio"}
                  name={question.id}
                  value={option.value}
                  checked={isChecked}
                  onChange={() => toggleOption(option.value)}
                  className="h-5 w-5 flex-none accent-[#4d6656]"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={isNavigating}
          className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-gray px-6 py-3 text-base font-semibold text-ohana-ink hover:bg-ohana-beige disabled:cursor-not-allowed disabled:opacity-40"
        >
          前の質問へ戻る
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!canProceed || isNavigating}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-base font-semibold text-ohana-white hover:bg-ohana-green-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isNavigating ? "結果を作成しています…" : stepIndex + 1 === totalQuestions ? "結果を見る" : "次の質問へ"}
        </button>
      </div>
    </div>
  );
}
