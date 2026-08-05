import type {
  ActiveStageC2,
  DischargedC2,
  C3Value,
  C4Value,
  C5Value,
  C6Value,
  C7Value,
  H1Value,
  CT1Value,
  PostValidAnswers,
} from "../types";

/**
 * confirmedFacts（「今回整理できたこと」）専用の固定変換表。
 * 回答値ごとに、表示文とartifactPriority（成果物内の表示順専用の値）を固定で持つ。
 * 生成AIや自由文章生成は使わず、回答値からの単純な参照のみで構成する。
 * artifactPriorityは診断ロジックの優先順位（variables.ts／actions.ts等）とは独立しており、
 * 既存判定には一切使用・参照されない。
 */
export type FactPhrase = {
  text: string;
  artifactPriority: number;
};

// ---- C2（期限）。c1（hospitalized/facility_search/discharged）により文脈が異なるため
// 3系統に分離する。literalな"unknown"は表に含めず、呼び出し側（buildConfirmedFacts）で
// deadlineAnswerUnknownフラグにより除外する。 ----

const C2_HOSPITALIZED_FACT: Record<Exclude<ActiveStageC2, "unknown">, FactPhrase> = {
  within_7_days: { text: "退院は1週間以内の見込みです。", artifactPriority: 10 },
  within_30_days: { text: "退院は1か月以内の見込みです。", artifactPriority: 14 },
  date_unknown: { text: "退院時期は、まだ分からないと言われています。", artifactPriority: 12 },
  no_deadline: { text: "退院の話は、まだ出ていません。", artifactPriority: 55 },
};

const C2_FACILITY_SEARCH_FACT: Record<Exclude<ActiveStageC2, "unknown">, FactPhrase> = {
  within_7_days: { text: "住み替え・入居は1週間以内を希望しています。", artifactPriority: 10 },
  within_30_days: { text: "住み替え・入居は1か月以内を希望しています。", artifactPriority: 14 },
  date_unknown: { text: "住み替え・入居の時期は、まだ具体的に決めていません。", artifactPriority: 12 },
  no_deadline: { text: "住み替え・入居は、今のところ急いでいません。", artifactPriority: 55 },
};

const C2_DISCHARGED_FACT: Record<Exclude<DischargedC2, "unknown">, FactPhrase> = {
  urgent_after_discharge: { text: "退院後、住まいや支援の調整を急いでいる状況です。", artifactPriority: 10 },
  some_unresolved: { text: "退院後、一部まだ決まっていないことがあります。", artifactPriority: 16 },
  mostly_settled: { text: "退院後の当面の生活は、おおむね整っています。", artifactPriority: 55 },
};

export function c2Fact(answers: PostValidAnswers): FactPhrase {
  if (answers.c1 === "discharged") {
    return C2_DISCHARGED_FACT[answers.c2 as Exclude<DischargedC2, "unknown">];
  }
  if (answers.c1 === "facility_search") {
    return C2_FACILITY_SEARCH_FACT[answers.c2 as Exclude<ActiveStageC2, "unknown">];
  }
  return C2_HOSPITALIZED_FACT[answers.c2 as Exclude<ActiveStageC2, "unknown">];
}

// ---- C3（住まい）。c1="facility_search"のときは「退院後」ではなく「今後の住まいは」で
// 表現する（住み替え中の人に「住み替え後は自宅に戻る」という不自然な表現をしないため）。
// C3に"unknown"相当の選択肢は無いため、常に表示対象とする。 ----

const C3_DISCHARGE_STYLE_FACT: Record<C3Value, FactPhrase> = {
  return_home: { text: "退院後は自宅に戻る方向です。", artifactPriority: 32 },
  temporary_home: { text: "退院後はいったん自宅に戻る方向です。", artifactPriority: 33 },
  facility: { text: "退院後は施設や高齢者住宅を探している・入る方向です。", artifactPriority: 34 },
  undecided: { text: "退院後の住まいは、まだ決まっていません。", artifactPriority: 11 },
  other: { text: "退院後は、それ以外の住まいを考えています。", artifactPriority: 35 },
};

const C3_RELOCATION_STYLE_FACT: Record<C3Value, FactPhrase> = {
  return_home: { text: "今後の住まいは、自宅に戻る方向です。", artifactPriority: 32 },
  temporary_home: { text: "今後の住まいは、いったん自宅に戻る方向です。", artifactPriority: 33 },
  facility: { text: "今後の住まいは、施設や高齢者住宅を探している・入る方向です。", artifactPriority: 34 },
  undecided: { text: "今後の住まいは、まだ決まっていません。", artifactPriority: 11 },
  other: { text: "今後の住まいは、それ以外の方向を考えています。", artifactPriority: 35 },
};

export function c3Fact(answers: PostValidAnswers): FactPhrase {
  const table = answers.c1 === "facility_search" ? C3_RELOCATION_STYLE_FACT : C3_DISCHARGE_STYLE_FACT;
  return table[answers.c3];
}

// ---- C4（支援）。literalな"unknown"は表に含めない（supportAnswerUnknownで除外）。 ----

export const C4_FACT: Record<Exclude<C4Value, "unknown">, FactPhrase> = {
  arranged: { text: "医療・介護・生活支援は、おおむね決まっています。", artifactPriority: 56 },
  partly_arranged: { text: "医療・介護・生活支援は、一部決まっています。", artifactPriority: 17 },
  not_arranged: { text: "医療・介護・生活支援は、まだ決まっていません。", artifactPriority: 13 },
  not_needed_said: { text: "医療・介護・生活支援は、今のところ必要ないと言われています。", artifactPriority: 57 },
};

// ---- C5（本人希望）。literalな"unknown"は表に含めない（wishesAnswerUnknownで除外）。 ----

export const C5_FACT: Record<Exclude<C5Value, "unknown">, FactPhrase> = {
  wants_home: { text: "本人は自宅で暮らしたいと話しています。", artifactPriority: 58 },
  wants_facility: { text: "本人は施設や別の住まいを希望しています。", artifactPriority: 59 },
  considering: { text: "本人の希望は、まだ迷っている状況です。", artifactPriority: 19 },
  not_discussed: { text: "本人の希望は、まだ話せていません。", artifactPriority: 15 },
  hard_to_confirm: { text: "本人の希望を確認することが、難しい状況です。", artifactPriority: 13 },
};

// ---- C6（実家の状況）。literalな"unknown"は表に含めない（homeStatusAnswerUnknownで除外）。
// 「実家」は成果物上「ご本人の家」へ統一する。 ----

export const C6_FACT: Record<Exclude<C6Value, "unknown">, FactPhrase> = {
  person_returns: { text: "ご本人の家には、ご本人が戻って住む予定です。", artifactPriority: 51 },
  may_return: { text: "ご本人の家は、将来戻る可能性を残したい状態です。", artifactPriority: 38 },
  will_be_vacant: { text: "ご本人の家は空き家になる見込みです。", artifactPriority: 36 },
  already_vacant: { text: "ご本人の家は、すでに空き家です。", artifactPriority: 37 },
  family_uses: { text: "ご本人の家は、家族が使う予定です。", artifactPriority: 52 },
  no_home_issue: { text: "対象となるご本人の家はありません。", artifactPriority: 53 },
};

// ---- C7（費用）。literalな"unknown"は表に含めない（moneyAnswerUnknownで除外）。 ----

export const C7_FACT: Record<Exclude<C7Value, "unknown">, FactPhrase> = {
  likely_sufficient: { text: "年金や預貯金で、当面の費用は足りそうです。", artifactPriority: 60 },
  unknown_amount: { text: "当面の費用が足りるかは、まだ分かっていません。", artifactPriority: 10 },
  family_pays: { text: "家族の持ち出しが必要になりそうです。", artifactPriority: 12 },
  mixed: { text: "ご本人と家族の両方で費用を負担する見込みです。", artifactPriority: 14 },
};

// ---- H1（実家の意向）。H1に"unknown"相当の選択肢は無く、"undecided"を含め全値を
// 確定した回答事実として扱う。「実家」は成果物上「ご本人の家」へ統一する。 ----

export const H1_FACT: Record<H1Value, FactPhrase> = {
  sell: { text: "ご本人の家は売ることを考えています。", artifactPriority: 15 },
  rent: { text: "ご本人の家は貸すことを考えています。", artifactPriority: 16 },
  demolish: { text: "ご本人の家は解体を考えています。", artifactPriority: 17 },
  keep_for_now: { text: "ご本人の家は当面そのまま残す方針です。", artifactPriority: 39 },
  undecided: { text: "ご本人の家を今後どうするかは、まだ決めていません。", artifactPriority: 11 },
};

// ---- CT1（本人の契約理解）。literalな"unknown"は表に含めない（contractAnswerUnknownで
// 除外）。本人の判断能力の断定を避け、「ご家族から見て〜との回答です」という
// 回答事実としての表現に統一する。 ----

export const CT1_FACT: Record<Exclude<CT1Value, "unknown">, FactPhrase> = {
  clearly_understands: {
    text: "ご家族から見て、ご本人は説明を理解し、考えを伝えられているとの回答です。",
    artifactPriority: 61,
  },
  fluctuates: {
    text: "ご家族から見て、説明を理解し考えを伝える様子は、日や時間によって違うとの回答です。",
    artifactPriority: 18,
  },
  seems_difficult: {
    text: "ご家族から見て、ご本人が説明を理解し考えを伝えることは、難しそうだとの回答です。",
    artifactPriority: 16,
  },
  not_confirmed: {
    text: "ご本人が説明をどの程度理解し、考えを伝えられているかは、まだ確認していないとの回答です。",
    artifactPriority: 20,
  },
};
