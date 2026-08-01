import type { PostValidAnswers, PostResult } from "./types";
import { POST_SCHEMA_VERSION } from "./schema";
import { computePostVariables } from "./variables";
import { buildSituation } from "./phrases";
import { buildFirstAndNextActions } from "./actions";
import { buildDecisions } from "./decisions";
import { buildInsights } from "./insights";
import { buildContacts } from "./contacts";
import { buildSelfHelp, buildAskProfessional } from "./selfHelp";
import { computeConsultationFlags } from "./consultation";

/**
 * 「3分整理ナビ｜事後ブランチ」（m=post）結果ロジックの入口。
 *
 * これは医療・介護・法律・税務・不動産の判断を行うものではありません。
 * 回答から「今、何が起きているか」「まず最初にすること」「誰に何を確認するか」を
 * 決定論的に組み立てるだけの、簡易なルールベースです（生成AI・ランダム処理は使用しない）。
 * 同じ回答には常に同じ結果を返す。
 *
 * q1="future" の回答はこの関数の対象外（ウィザード内の案内画面で完結し、結果URLを生成しない）。
 */
export function buildPostResult(answers: PostValidAnswers): PostResult {
  const v = computePostVariables(answers);

  const { firstAction, nextActions } = buildFirstAndNextActions(answers, v);
  const decisions = buildDecisions(answers, v);

  return {
    schemaVersion: POST_SCHEMA_VERSION,
    situation: buildSituation(answers, v),
    firstAction,
    nextActions,
    decideNow: decisions.decideNow,
    decideLater: decisions.decideLater,
    decideLaterCaveat: decisions.laterCaveat,
    insights: buildInsights(answers, v),
    contacts: buildContacts(answers, v),
    selfHelp: buildSelfHelp(answers, v),
    askProfessional: buildAskProfessional(answers, v),
    consultation: computeConsultationFlags(v),
  };
}
