"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRE_QUESTIONS, getPreQuestionOptions, isPreQuestionApplicable } from "@/lib/diagnosis/pre/questions";
import { buildPreResultPath } from "@/lib/diagnosis/pre/schema";
import type { PreAnswers, PreQuestionId, PreWho } from "@/lib/diagnosis/pre/types";

type Stage = "intro" | "who" | "question";

function applicableQuestions(answers: PreAnswers) {
  return PRE_QUESTIONS.filter((question) => isPreQuestionApplicable(question, answers));
}

function nextApplicableIndex(fromIndex: number, answers: PreAnswers): number {
  let index = fromIndex + 1;
  while (index < PRE_QUESTIONS.length && !isPreQuestionApplicable(PRE_QUESTIONS[index], answers)) {
    index += 1;
  }
  return index;
}

function prevApplicableIndex(fromIndex: number, answers: PreAnswers): number {
  let index = fromIndex - 1;
  while (index >= 0 && !isPreQuestionApplicable(PRE_QUESTIONS[index], answers)) {
    index -= 1;
  }
  return index;
}

export default function DiagnosisWizardPre() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("intro");
  const [who, setWho] = useState<PreWho | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<PreAnswers>({});
  const [isNavigating, setIsNavigating] = useState(false);

  const question = PRE_QUESTIONS[stepIndex];
  const options = question ? getPreQuestionOptions(question, answers) : [];
  const selected = question ? answers[question.id] : undefined;

  const setAnswer = (id: PreQuestionId, value: string) => {
    setAnswers((prev) => {
      const next: PreAnswers = { ...prev, [id]: value };
      // 前の回答を変えたことで非該当になった設問の回答は、URLに残さないよう消す
      if (id === "Q1" && value !== "a") delete next.T1;
      if (id === "Q7" && value !== "a") delete next.T4;
      if (id === "Q10" && value !== "a" && next.T5 === "b") delete next.T5;
      return next;
    });
  };

  const goToFirstQuestion = () => {
    setStage("question");
    setStepIndex(isPreQuestionApplicable(PRE_QUESTIONS[0], {}) ? 0 : nextApplicableIndex(-1, {}));
  };

  const goNext = () => {
    const next = nextApplicableIndex(stepIndex, answers);
    if (next < PRE_QUESTIONS.length) {
      setStepIndex(next);
      return;
    }
    if (!who) return;
    setIsNavigating(true);
    router.push(buildPreResultPath(who, answers));
  };

  const goBack = () => {
    const prev = prevApplicableIndex(stepIndex, answers);
    if (prev >= 0) {
      setStepIndex(prev);
      return;
    }
    setStage("who");
  };

  if (stage === "intro") {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-base leading-loose text-ohana-gray sm:text-lg">
          このナビでは、これからの暮らしについて考える方を「ご本人」と表します。
          ご本人自身でも、ご家族や身近な方でも回答できます。
        </p>
        <ul className="flex flex-col gap-2 text-sm text-ohana-gray sm:text-base">
          <li>・氏名や住所、病名、資産額などはお伺いしません。</li>
          <li>・結果は選択式回答をもとにURLへ記録され、そのURLを知っている人だけが結果を見られます。</li>
          <li>・前の質問に戻ってやり直すこともできます。</li>
        </ul>
        <button
          type="button"
          onClick={() => setStage("who")}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-base font-semibold text-ohana-white hover:bg-ohana-green-dark sm:w-auto"
        >
          質問をはじめる
        </button>
      </div>
    );
  }

  if (stage === "who") {
    return (
      <div className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4">
          <legend className="text-xl font-bold leading-snug text-ohana-ink sm:text-2xl">
            今回は、どなたが回答しますか
          </legend>
          <div className="flex flex-col gap-3">
            {(
              [
                { value: "self", label: "ご本人が回答する" },
                { value: "family", label: "ご家族や身近な方が回答する" },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-base transition-colors ${
                  who === option.value
                    ? "border-ohana-green bg-ohana-green-light text-ohana-ink"
                    : "border-ohana-beige-dark bg-ohana-white text-ohana-ink hover:border-ohana-green"
                }`}
              >
                <input
                  type="radio"
                  name="who"
                  value={option.value}
                  checked={who === option.value}
                  onChange={() => setWho(option.value)}
                  className="h-5 w-5 flex-none accent-[#4d6656]"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStage("intro")}
            className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-gray px-6 py-3 text-base font-semibold text-ohana-ink hover:bg-ohana-beige"
          >
            前へ戻る
          </button>
          <button
            type="button"
            onClick={goToFirstQuestion}
            disabled={!who}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-base font-semibold text-ohana-white hover:bg-ohana-green-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            次の質問へ
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const applicable = applicableQuestions(answers);
  const totalQuestions = applicable.length;
  const currentPosition = applicable.findIndex((item) => item.id === question.id) + 1;
  const progressPercent = totalQuestions > 0 ? Math.round((currentPosition / totalQuestions) * 100) : 0;
  const canProceed = Boolean(selected);
  const isLastQuestion = nextApplicableIndex(stepIndex, answers) >= PRE_QUESTIONS.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-ohana-brown" aria-live="polite">
          質問 {currentPosition} / {totalQuestions}
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

        <div className="flex flex-col gap-3">
          {options.map((option) => {
            const isChecked = selected === option.value;
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
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={isChecked}
                  onChange={() => setAnswer(question.id, option.value)}
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
          {isNavigating ? "結果を作成しています…" : isLastQuestion ? "結果を見る" : "次の質問へ"}
        </button>
      </div>
    </div>
  );
}
