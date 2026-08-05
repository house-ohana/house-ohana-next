"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  POST_QUESTIONS,
  getPostQuestionOptions,
  getPostQuestionTitle,
  getPostQuestionLead,
  isPostQuestionApplicable,
  pruneInapplicableAnswers,
} from "@/lib/diagnosis/post/questions";
import { buildPostResultPath } from "@/lib/diagnosis/post/schema";
import type { PostAnswers, PostValidAnswers } from "@/lib/diagnosis/post/types";

type Stage = "intro" | "question" | "future";

// docs/01-phase2-question-architecture.md: 共通8問＋条件付き最大4問（該当者のみ）。
const MIN_QUESTIONS = 8;
const MAX_QUESTIONS = 8 + 4;

function applicableQuestions(answers: PostAnswers) {
  return POST_QUESTIONS.filter((question) => isPostQuestionApplicable(question, answers));
}

function nextApplicableIndex(fromIndex: number, answers: PostAnswers): number {
  let index = fromIndex + 1;
  while (index < POST_QUESTIONS.length && !isPostQuestionApplicable(POST_QUESTIONS[index], answers)) {
    index += 1;
  }
  return index;
}

function prevApplicableIndex(fromIndex: number, answers: PostAnswers): number {
  let index = fromIndex - 1;
  while (index >= 0 && !isPostQuestionApplicable(POST_QUESTIONS[index], answers)) {
    index -= 1;
  }
  return index;
}

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
      const withNewAnswer: PostAnswers = { ...prev, [question.id]: value };
      // 変更した回答によって非該当になった、他の設問の回答をまとめて破棄する
      // （C1変更→C2、C4変更→S1、C6変更→H1/H2/CT1、H1変更→H2/CT1、など）
      return pruneInapplicableAnswers(withNewAnswer);
    });
  };

  const goNext = () => {
    if (!question || !selected) return;

    if (question.id === "c1" && selected === "future") {
      setStage("future");
      return;
    }

    const next = nextApplicableIndex(stepIndex, answers);
    if (next < POST_QUESTIONS.length) {
      setStepIndex(next);
      return;
    }

    setIsNavigating(true);
    router.push(buildPostResultPath(answers as PostValidAnswers));
  };

  const goBack = () => {
    const prev = prevApplicableIndex(stepIndex, answers);
    if (prev >= 0) {
      setStepIndex(prev);
      return;
    }
    setStage("intro");
  };

  const restartFromC1 = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next.c1;
      delete next.c2;
      return next;
    });
    setStepIndex(0);
    setStage("question");
  };

  if (stage === "intro") {
    return (
      <div ref={headingRef} className="flex scroll-mt-20 flex-col gap-6">
        <p className="text-base leading-loose text-ohana-gray sm:text-lg">
          {MIN_QUESTIONS}〜{MAX_QUESTIONS}問程度の質問に答えると、今の状況と、まず最初にすることを整理します。質問数は回答によって変わり、該当する方にだけ追加の質問が表示されます。医療・介護・法律・税務・不動産の診断や判定ではありません。
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
            onClick={restartFromC1}
            className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ohana-gray px-6 py-3 text-base font-semibold text-ohana-ink hover:bg-ohana-beige"
          >
            入院・退院など今の対応を整理し直す
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
  const title = getPostQuestionTitle(question, answers);
  const lead = getPostQuestionLead(question, answers);
  const isLastQuestion = nextApplicableIndex(stepIndex, answers) >= POST_QUESTIONS.length;

  return (
    <div ref={headingRef} className="flex scroll-mt-20 flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-ohana-brown" aria-live="polite">
          質問 {currentPosition} / {totalQuestions}（目安）
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

      {lead ? <p className="text-sm leading-loose text-ohana-gray sm:text-base">{lead}</p> : null}

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
          {isNavigating ? "結果を作成しています…" : isLastQuestion ? "結果を見る" : "次の質問へ"}
        </button>
      </div>
    </div>
  );
}
