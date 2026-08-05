import type { PostValidAnswers } from "./types";

/**
 * 「3分整理ナビ｜事後ブランチ」（m=post）判定用の内部変数。
 * docs/phase2-design.md（Phase2 質問構造再設計）に合わせて参照元をc1〜c8/s1/h1/h2/ct1へ
 * 切り替えたもの。変数名・計算式はPhase1.5までと同じ意味を保つ（結果画面のロジックである
 * actions.ts/insights.ts/contacts.ts/decisions.ts/selfHelp.ts/consultation.tsは無変更）。
 * 生成AIやランダム処理は使わず、回答からの純粋関数として計算する。
 */
export type PostVariables = ReturnType<typeof computePostVariables>;

export function computePostVariables(answers: PostValidAnswers) {
  const { c1, c2, c3, c4, c5, c6, c7, c8, s1, h1, h2, ct1 } = answers;

  const isImmediateDeadline = c2 === "within_7_days" || c2 === "urgent_after_discharge";
  const isNearDeadline = c2 === "within_30_days" || c2 === "some_unresolved";

  const supportUnclear = c4 === "not_arranged" || c4 === "unknown";
  const supportPartlyUnclear = c4 === "partly_arranged";
  const residenceUnclear = c3 === "undecided";

  const wishesUnclear = c5 === "not_discussed" || c5 === "unknown";
  const wishesHardToConfirm = c5 === "hard_to_confirm";

  // 対象となる実家がない場合は、実家・空き家・売却・税務系を一律で抑止する
  const noHome = c6 === "no_home_issue";

  const homeWillRemain = !noHome && (c6 === "will_be_vacant" || c6 === "already_vacant" || c6 === "may_return");

  // 「空き家になる」（C6）ことと、「売る・貸す・解体することを考えている」（H1）ことは別。
  // 契約に関する案内は、実際にその意向がある場合にのみ表示する（旧q7=consider_home_incomeから
  // H1（実家枝）へ入力元を切り替えた。解体も不可逆な契約行為のため対象に含める）。
  // 売却・賃貸・解体は、それぞれ異なる制度・手続が関わるため内部変数を分離する
  // （docs/phase2-design.md 再修正版④）。既存の判定条件は homeActionExpected（3つのOR）を
  // 参照したままで変わらない。
  const sellIntent = h1 === "sell";
  const rentIntent = h1 === "rent";
  const demolishIntent = h1 === "demolish";
  const homeDisposalIntent = sellIntent || rentIntent || demolishIntent;
  const homeActionExpected = !noHome && homeDisposalIntent;

  const contractConcern = ct1 === "fluctuates" || ct1 === "seems_difficult";
  const contractStatusUnknown = ct1 === "not_confirmed" || ct1 === "unknown";

  const moneyUnclear = c7 === "unknown_amount" || c7 === "unknown";
  const familyContribution = c7 === "family_pays" || c7 === "mixed";

  // 「主に一人が担っている」と「身寄りや頼れる人が少ない」は、必要な行動が異なるため分離する。
  const singleMainSupporter = c8 === "mostly_one_person";
  const fewSupporters = c8 === "few_supporters";
  const supporterRisk = singleMainSupporter || fewSupporters;

  const atHomeDirection = c3 === "return_home" || c3 === "temporary_home";

  // 入院中で、退院日が未定でも、支援・住まいが未調整なら取りこぼさない
  const hospitalizedSupportGap = c1 === "hospitalized" && (supportUnclear || residenceUnclear);

  // 施設・住み替え先を探していて期限が未定でも、住まい・支援が未調整なら取りこぼさない
  const facilitySearchSupportGap = c1 === "facility_search" && (supportUnclear || residenceUnclear);

  const activeSupportGap = hospitalizedSupportGap || facilitySearchSupportGap;

  // 退院・入居期限が近く、費用不明または家族負担がある場合は、通常の資産整理より先に拾う
  const moneyNeedsEarlyCheck = (moneyUnclear || familyContribution) && (isImmediateDeadline || isNearDeadline || activeSupportGap);

  const moneyCheckDeadline: "今日" | "3日以内" = isImmediateDeadline ? "今日" : "3日以内";

  const needsRegionalSupport =
    (c1 === "discharged" && (supportUnclear || supportPartlyUnclear || residenceUnclear)) || facilitySearchSupportGap || supporterRisk;

  // 税理士（住まなくなった後の売却期限）は「売る」場合のみ対象とする。
  // 「貸す」「解体」は別の税務論点のため、既存の税務カード文言（売却期限）は流用しない。
  const homeFinancePlanning = !noHome && sellIntent;

  // Phase3で知識カード（要介護認定・ケアマネジャー未定カード／本人所有旧居譲渡カードの
  // 名義確認）を追加する際に使う変数。Phase2時点ではどのカード・行動条件にも使用しない。
  const careLevelUnclear = s1 === "applying" || s1 === "not_applied" || s1 === "unknown";
  const careManagerUnclear = s1 === "certified_no_manager" || s1 === "applying" || s1 === "not_applied" || s1 === "unknown";
  const ownershipUnclear = h2 === "unknown";
  const ownershipShared = h2 === "shared_owner";
  // 本人に持分がない名義（本人以外の名義）。本人所有を前提とするカードの対象外判定に使う。
  const ownershipOther = h2 === "other_owner";

  // Phase3成果物専用（4-4「今回整理できたこと」／4-5「まだ確認できていないこと」）の派生フラグ。
  // 回答値が文字通り「unknown」であることのみを表す。「まだ決まっていない／調整中／話せていない」等の
  // 他の未確定状態（not_arranged/not_discussed/hard_to_confirm/unknown_amount等）とは区別する。
  // 既存のsupportUnclear/wishesUnclear/moneyUnclearはこれらを一括りにしているため意味が異なり、
  // 既存フラグの計算式・使用箇所（actions.ts/decisions.ts/insights.ts/contacts.ts/selfHelp.ts/
  // consultation.ts）はこの追加によって一切変更しない。
  const supportAnswerUnknown = c4 === "unknown";
  const wishesAnswerUnknown = c5 === "unknown";
  const moneyAnswerUnknown = c7 === "unknown";
  const deadlineAnswerUnknown = c2 === "unknown";
  const homeStatusAnswerUnknown = c6 === "unknown";
  const careAnswerUnknown = s1 === "unknown";
  const contractAnswerUnknown = ct1 === "unknown";

  // 「まだ決めていない／まだ確認していない」は、literalなunknownとは異なる確定した回答事実として扱う
  // （成果物層のconfirmedFacts候補用。unknownItemsには使わない）。
  const homeIntentUndecided = h1 === "undecided";
  const contractNotConfirmed = ct1 === "not_confirmed";

  // 成果物層が「実家枝／契約枝に回答済みか」を判定する際、h1/ct1のraw undefinedチェックを
  // 直接使わないようにするための派生フラグ。
  const homeIntentAnswered = h1 !== undefined;
  const contractUnderstandingAnswered = ct1 !== undefined;

  return {
    isImmediateDeadline,
    isNearDeadline,
    supportUnclear,
    supportPartlyUnclear,
    residenceUnclear,
    wishesUnclear,
    wishesHardToConfirm,
    noHome,
    homeWillRemain,
    sellIntent,
    rentIntent,
    demolishIntent,
    homeActionExpected,
    contractConcern,
    contractStatusUnknown,
    moneyUnclear,
    familyContribution,
    singleMainSupporter,
    fewSupporters,
    supporterRisk,
    atHomeDirection,
    hospitalizedSupportGap,
    facilitySearchSupportGap,
    activeSupportGap,
    moneyNeedsEarlyCheck,
    moneyCheckDeadline,
    needsRegionalSupport,
    homeFinancePlanning,
    careLevelUnclear,
    careManagerUnclear,
    ownershipUnclear,
    ownershipShared,
    ownershipOther,
    supportAnswerUnknown,
    wishesAnswerUnknown,
    moneyAnswerUnknown,
    deadlineAnswerUnknown,
    homeStatusAnswerUnknown,
    careAnswerUnknown,
    contractAnswerUnknown,
    homeIntentUndecided,
    contractNotConfirmed,
    homeIntentAnswered,
    contractUnderstandingAnswered,
  };
}
