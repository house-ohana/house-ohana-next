import type { PostValidAnswers, Q1Value, Q3Value, Q4Value, Q5Value, Q6Value, Q7Value, ActiveStageQ2, DischargedQ2 } from "./types";
import type { PostVariables } from "./variables";

/**
 * 「①あなたの状況」（第9節）で使う固定フレーズ辞書。
 * ここに定義されていない回答IDは、Record型の網羅性チェックによりビルド時（型チェック時）に
 * エラーとなる。自然文の自由生成は行わない。
 */

type NonFutureQ1 = Exclude<Q1Value, "future">;

// 文頭：「ご本人は〜」から始まり、Q2フレーズへそのまま接続する
const Q1_CLAUSE: Record<NonFutureQ1, string> = {
  hospitalized: "ご本人は現在入院中で、",
  discharged: "ご本人はすでに退院しており、",
  facility_search: "ご本人は施設や住み替え先を探しており、",
};

const Q2_ACTIVE_CLAUSE: Record<ActiveStageQ2, string> = {
  within_7_days: "退院・入居まで1週間以内という状況です。",
  within_30_days: "退院・入居まで1か月以内という状況です。",
  date_unknown: "退院・入居の話は出ているものの、日はまだ決まっていない状況です。",
  no_deadline: "退院・入居の期限は、今のところない状況です。",
  unknown: "退院・入居までの時期は、まだ分からない状況です。",
};

const Q2_DISCHARGED_CLAUSE: Record<DischargedQ2, string> = {
  urgent_after_discharge: "退院後の住まいや支援が、まだ整っていない状況です。",
  some_unresolved: "退院後、一部まだ決まっていないことがある状況です。",
  mostly_settled: "退院後の当面の生活は、おおむね整っている状況です。",
  unknown: "退院後の状況について、まだ分からない点がある状況です。",
};

// 「これからの住まいは〜で、」に接続する体言止め
const Q3_CLAUSE: Record<Q3Value, string> = {
  return_home: "自宅に戻る方向",
  temporary_home: "いったん自宅に戻る方向",
  facility: "施設や高齢者住宅を探している・入る方向",
  undecided: "まだ決まっていない状態",
  other: "それ以外の住まいを考えている状態",
};

// 「、医療・介護・生活支援は〜」に接続する文末
const Q4_CLAUSE: Record<Q4Value, string> = {
  arranged: "おおむね決まっている状況です。",
  partly_arranged: "一部決まっている状況です。",
  not_arranged: "まだ決まっていない状況です。",
  not_needed_said: "今のところ必要ないと言われている状況です。",
  unknown: "何が必要か、まだ分からない状況です。",
};

// 「本人の希望は、〜。」に接続する文末（不明確な場合のみ採用）
const Q5_CLAUSE: Record<Q5Value, string> = {
  wants_home: "自宅で暮らしたいと話しています",
  wants_facility: "施設や別の住まいを希望しています",
  considering: "本人もまだ迷っています",
  not_discussed: "まだ本人と話せていません",
  hard_to_confirm: "確認することが難しい状況です",
  unknown: "まだ確認できていません",
};

// 「費用については、〜。」に接続する文末（不明確・負担ありの場合のみ採用）
const Q7_CLAUSE: Record<Q7Value, string> = {
  likely_sufficient: "年金や本人の預貯金で当面は足りそうです",
  unknown_amount: "足りるかどうか、まだ分かりません",
  consider_home_income: "実家を売る・貸すことも考えています",
  family_pays: "家族が負担する見込みです",
  mixed: "本人と家族の両方で負担する見込みです",
  unknown: "まだ考えていません",
};

// 「ご本人の家は、〜。」に接続する文末（空き家見込みの場合のみ採用）
const Q6_CLAUSE: Record<Q6Value, string> = {
  person_returns: "ご本人が戻って住む予定です",
  may_return: "将来戻る可能性を残したい状態です",
  will_be_vacant: "空き家になる見込みです",
  already_vacant: "すでに空き家です",
  family_uses: "家族が使う予定です",
  no_home_issue: "対象になる実家はありません",
  unknown: "まだ分かりません",
};

const SITUATION_MAX_LENGTH = 120;

function q2Clause(answers: PostValidAnswers): string {
  if (answers.q1 === "discharged") {
    return Q2_DISCHARGED_CLAUSE[answers.q2 as DischargedQ2];
  }
  return Q2_ACTIVE_CLAUSE[answers.q2 as ActiveStageQ2];
}

export function buildSituation(answers: PostValidAnswers, vars: PostVariables): string {
  const sentence1 = Q1_CLAUSE[answers.q1 as NonFutureQ1] + q2Clause(answers);
  const sentence2 = `これからの住まいは${Q3_CLAUSE[answers.q3]}で、医療・介護・生活支援は${Q4_CLAUSE[answers.q4]}`;
  const base = sentence1 + sentence2;

  const optionalCandidates: string[] = [];
  if (vars.wishesUnclear || vars.wishesHardToConfirm) {
    optionalCandidates.push(`本人の希望は、${Q5_CLAUSE[answers.q5]}。`);
  }
  if (vars.moneyUnclear || vars.familyContribution) {
    optionalCandidates.push(`費用については、${Q7_CLAUSE[answers.q7]}。`);
  }
  if (answers.q6 === "will_be_vacant" || answers.q6 === "already_vacant") {
    optionalCandidates.push(`ご本人の家は、${Q6_CLAUSE[answers.q6]}。`);
  }

  for (const optional of optionalCandidates) {
    if ((base + optional).length <= SITUATION_MAX_LENGTH) {
      return base + optional;
    }
  }

  return base;
}
