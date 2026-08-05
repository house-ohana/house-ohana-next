import type { PostValidAnswers, C1Value, C3Value, C4Value, C5Value, C6Value, C7Value, ActiveStageC2, DischargedC2 } from "./types";
import type { PostVariables } from "./variables";

/**
 * 「①あなたの状況」で使う固定フレーズ辞書。
 * ここに定義されていない回答IDは、Record型の網羅性チェックによりビルド時（型チェック時）に
 * エラーとなる。自然文の自由生成は行わない。
 *
 * Phase2で回答フィールド名がq1〜q9からc1〜c8/h1/ct1へ変わったことに伴う参照元の切替のみ。
 * 文言そのものはPhase1.5までと同じ（結果画面UXの文言は変更しない）。
 * 旧Q7の「実家を売る・貸すことも考えています」（consider_home_income）は、
 * 実家処分の意向がH1（実家枝）へ分離されたため、この状況文からは削除している。
 */

type NonFutureC1 = Exclude<C1Value, "future">;

// 文頭：「ご本人は〜」から始まり、C2フレーズへそのまま接続する
const C1_CLAUSE: Record<NonFutureC1, string> = {
  hospitalized: "ご本人は現在入院中で、",
  discharged: "ご本人はすでに退院しており、",
  facility_search: "ご本人は施設や住み替え先を探しており、",
};

const C2_ACTIVE_CLAUSE: Record<ActiveStageC2, string> = {
  within_7_days: "退院・入居まで1週間以内という状況ですね。",
  within_30_days: "退院・入居まで1か月以内という状況ですね。",
  date_unknown: "退院・入居の話は出ているものの、日はまだ決まっていない状況ですね。",
  no_deadline: "退院・入居の期限は、今のところない状況ですね。",
  unknown: "退院・入居までの時期は、まだ分からない状況ですね。",
};

const C2_DISCHARGED_CLAUSE: Record<DischargedC2, string> = {
  urgent_after_discharge: "退院後の住まいや支援が、まだ整っていない状況ですね。",
  some_unresolved: "退院後、一部まだ決まっていないことがある状況ですね。",
  mostly_settled: "退院後の当面の生活は、おおむね整っている状況ですね。",
  unknown: "退院後の状況について、まだ分からない点がある状況ですね。",
};

// 「これからの住まいは〜で、」に接続する体言止め
const C3_CLAUSE: Record<C3Value, string> = {
  return_home: "自宅に戻る方向",
  temporary_home: "いったん自宅に戻る方向",
  facility: "施設や高齢者住宅を探している・入る方向",
  undecided: "まだ決まっていない状態",
  other: "それ以外の住まいを考えている状態",
};

// 「、医療・介護・生活支援は〜」に接続する文末
const C4_CLAUSE: Record<C4Value, string> = {
  arranged: "おおむね決まっている状況です。",
  partly_arranged: "一部決まっている状況です。",
  not_arranged: "まだ決まっていない状況です。",
  not_needed_said: "今のところ必要ないと言われている状況です。",
  unknown: "何が必要か、まだ分からない状況です。",
};

// 「本人の希望は、〜。」に接続する文末（不明確な場合のみ採用）
const C5_CLAUSE: Record<C5Value, string> = {
  wants_home: "自宅で暮らしたいと話しています",
  wants_facility: "施設や別の住まいを希望しています",
  considering: "本人もまだ迷っています",
  not_discussed: "まだ本人と話せていません",
  hard_to_confirm: "確認することが難しい状況です",
  unknown: "まだ確認できていません",
};

// 「費用については、〜。」に接続する文末（不明確・負担ありの場合のみ採用）
const C7_CLAUSE: Record<C7Value, string> = {
  likely_sufficient: "年金や本人の預貯金で当面は足りそうです",
  unknown_amount: "足りるかどうか、まだ分かりません",
  family_pays: "家族の持ち出しが必要になりそうです",
  mixed: "本人と家族の両方で負担する見込みです",
  unknown: "まだ考えていません",
};

// 「ご本人の家は、〜。」に接続する文末（空き家見込みの場合のみ採用）
const C6_CLAUSE: Record<C6Value, string> = {
  person_returns: "ご本人が戻って住む予定です",
  may_return: "将来戻る可能性を残したい状態です",
  will_be_vacant: "空き家になる見込みです",
  already_vacant: "すでに空き家です",
  family_uses: "家族が使う予定です",
  no_home_issue: "対象になる実家はありません",
  unknown: "まだ分かりません",
};

const SITUATION_MAX_LENGTH = 120;

function c2Clause(answers: PostValidAnswers): string {
  if (answers.c1 === "discharged") {
    return C2_DISCHARGED_CLAUSE[answers.c2 as DischargedC2];
  }
  return C2_ACTIVE_CLAUSE[answers.c2 as ActiveStageC2];
}

export function buildSituation(answers: PostValidAnswers, vars: PostVariables): string {
  const sentence1 = C1_CLAUSE[answers.c1 as NonFutureC1] + c2Clause(answers);
  const sentence2 = `これからの住まいは${C3_CLAUSE[answers.c3]}で、医療・介護・生活支援は${C4_CLAUSE[answers.c4]}`;
  const base = sentence1 + sentence2;

  const optionalCandidates: string[] = [];
  if (vars.wishesUnclear || vars.wishesHardToConfirm) {
    optionalCandidates.push(`本人の希望は、${C5_CLAUSE[answers.c5]}。`);
  }
  if (vars.moneyUnclear || vars.familyContribution) {
    optionalCandidates.push(`費用については、${C7_CLAUSE[answers.c7]}。`);
  }
  if (answers.c6 === "will_be_vacant" || answers.c6 === "already_vacant") {
    optionalCandidates.push(`ご本人の家は、${C6_CLAUSE[answers.c6]}。`);
  }

  for (const optional of optionalCandidates) {
    if ((base + optional).length <= SITUATION_MAX_LENGTH) {
      return base + optional;
    }
  }

  return base;
}
