"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { POST_QUESTIONS, getPostQuestionOptions, getPostQuestionTitle } from "@/lib/diagnosis/post/questions";
import { buildPostResultPath } from "@/lib/diagnosis/post/schema";
import type { PostAnswers, PostValidAnswers } from "@/lib/diagnosis/post/types";

type Stage = "intro" | "question" | "future";

const TOTAL_QUESTIONS = POST_QUESTIONS.length;

export default function DiagnosisWizard() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<PostAnswers>({});
  const [isNavigating, setIsNavigating] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stage, stepIndex]);

  const question = POST_QUESTIONS[stepIndex];
  const options = question ? getPostQuestionOptions(question, answers) : [];
  const selected = question ? answers[question.id] : undefined;

  const setAnswer = (value: string) => {
    if (!question) return;
    setAnswers((prev) => {
      const next: PostAnswers = { ...prev, [question.id]: value };
      // Q1を変更したら、以前のQ2回答（型が異なる可能性がある）は破棄する
      if (question.id === "q1") delete next.q2;
      // Q6を変更したら、consider_home_incomeが成立しなくなる可能性があるQ7回答を破棄する
      if (question.id === "q6" && value === "no_home_issue" && next.q7 === "consider_home_income") delete next.q7;
      return next;
    });
  };

  const goNext = () => {
    if (!question || !selected) return;

    if (question.id === "q1" && selected === "future") {
      setStage("future");
      return;
    }

    if (stepIndex + 1 < TOTAL_QUESTIONS) {
      setStepIndex((prev) => prev + 1);
      return;
    }

    setIsNavigating(true);
    router.push(buildPostResultPath(answers as PostValidAnswers));
  };

  const goBack = () => {
    if (stepIndex === 0) {
      setStage("intro");
      return;
    }
    setStepIndex((prev) => prev - 1);
  };

  const restartFromQ1 = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next.q1;
      delete next.q2;
      return next;
    });
    setStepIndex(0);
    setStage("question");
  };

  if (stage === "intro") {
    return (
      <div ref={headingRef} className="flex scroll-mt-20 flex-col gap-6">
        <p className="text-base leading-loose text-ohana-gray sm:text-lg">
          {TOTAL_QUESTIONS}問の質問に答えると、今の状況と、まず最初にすることを整理します。医療・介護・法律・税務・不動産の診断や判定ではありません。
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

  if (stage === "future") {
    return (
      <div ref={headingRef} className="flex scroll-mt-20 flex-col gap-6">
        <p className="text-base leading-loose text-ohana-ink sm:text-lg">
          今回の回答では、退院・入居への今すぐの対応より、これからの備えを整理する質問の方が合っています。
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/diagnosis?m=pre"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-base font-semibold text-ohana-white hover:bg-ohana-green-dark"
          >
            これからの備えを整理する
          </Link>
          <button
            type="button"
            onClick={restartFromQ1}
            className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-gray px-6 py-3 text-base font-semibold text-ohana-ink hover:bg-ohana-beige"
          >
            入院・退院など今の対応を整理し直す
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const progressPercent = Math.round(((stepIndex + 1) / TOTAL_QUESTIONS) * 100);
  const canProceed = Boolean(selected);
  const title = getPostQuestionTitle(question, answers);

  return (
    <div ref={headingRef} className="flex scroll-mt-20 flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-ohana-brown" aria-live="polite">
          質問 {stepIndex + 1} / {TOTAL_QUESTIONS}
        </p>
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="質問の進捗"
          className="h-2 w-full overflow-hidden rounded-full bg-ohana-beige-dark"
        >
          <div className="h-full rounded-full bg-ohana-green transition-[width]" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {question.lead ? <p className="text-sm leading-loose text-ohana-gray sm:text-base">{question.lead}</p> : null}

      <fieldset className="flex flex-col gap-4">
        <legend className="text-xl font-bold leading-snug text-ohana-ink sm:text-2xl">{title}</legend>
        {question.hint ? <p className="text-sm text-ohana-gray">{question.hint}</p> : null}

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
                  onChange={() => setAnswer(option.value)}
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
          {isNavigating ? "結果を作成しています…" : stepIndex + 1 === TOTAL_QUESTIONS ? "結果を見る" : "次の質問へ"}
        </button>
      </div>
    </div>
  );
}
