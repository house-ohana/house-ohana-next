import type { PostValidAnswers } from "./types";
import type { PostVariables } from "./variables";

/**
 * 「②まず最初にすること」「③次に確認すること」（第10節・第11節）の行動カタログ。
 * 第10節の優先順位1〜12を primaryPriority の唯一の正本とし、②③の両方をこの1つの
 * カタログから導出する（別々のif文群で文章を作らない）。
 */

type ActionCandidate = {
  id: string;
  when: boolean;
  primaryPriority: number;
  /** 「次に確認すること」での並び順（固定6グループのみ。含まれないものは②専用） */
  secondaryGroupOrder: number | null;
  dedupeGroup: string;
  headline: string;
  deadline: string;
  contact: string;
  title: string;
};

const SECONDARY_GROUP_ORDER: Record<string, number> = {
  discharge_support: 1,
  money_3_months: 2,
  wishes: 3,
  family_support_load: 4,
  contract_before_home_action: 5,
  home_minimum_management: 6,
};

export function buildActionCandidates(answers: PostValidAnswers, v: PostVariables): ActionCandidate[] {
  const isDischarged = answers.q1 === "discharged";

  return [
    {
      id: "p1_hospital",
      when: v.isImmediateDeadline && (v.supportUnclear || v.residenceUnclear) && answers.q1 === "hospitalized",
      primaryPriority: 1,
      dedupeGroup: "discharge_support",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.discharge_support,
      headline:
        "今日、病院の退院支援担当者に確認してください。「退院予定日」「退院直後に必要な支援」「退院までに家族が決める必要があること」の3点を確認します。",
      deadline: "今日",
      contact: "病院の退院支援担当者",
      title: "退院予定日・直後に必要な支援・家族が決めることを確認する",
    },
    {
      id: "p1_discharged",
      when: v.isImmediateDeadline && (v.supportUnclear || v.residenceUnclear) && isDischarged,
      primaryPriority: 1,
      dedupeGroup: "discharge_support",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.discharge_support,
      headline:
        "今日、ご本人の住所地を担当する地域包括支援センターへ相談してください。「退院後の住まいや支援がまだ整っていない」と伝え、最初に確認すべき窓口を聞きます。",
      deadline: "今日",
      contact: "地域包括支援センター",
      title: "退院後の住まいや支援が整っていないことを相談し、最初の窓口を確認する",
    },
    {
      id: "p2_hospital",
      when: v.isImmediateDeadline && v.supportPartlyUnclear && answers.q1 === "hospitalized",
      primaryPriority: 2,
      dedupeGroup: "discharge_support",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.discharge_support,
      headline:
        "今日、退院後の支援で未決定の項目を確認してください。病院の退院支援担当者やケアマネジャーに、「決まっていること」と「まだ決まっていないこと」を分けて確認します。",
      deadline: "今日",
      contact: "病院の退院支援担当者やケアマネジャー",
      title: "決まっていることとまだ決まっていないことを分けて確認する",
    },
    {
      id: "p2_discharged",
      when: v.isImmediateDeadline && v.supportPartlyUnclear && isDischarged,
      primaryPriority: 2,
      dedupeGroup: "discharge_support",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.discharge_support,
      headline:
        "今日、退院後の支援で未決定の項目を確認してください。現在相談している担当者、または地域包括支援センターに、「決まっていること」と「まだ決まっていないこと」を分けて確認します。",
      deadline: "今日",
      contact: "現在相談している担当者、または地域包括支援センター",
      title: "決まっていることとまだ決まっていないことを分けて確認する",
    },
    {
      id: "p3_near_deadline",
      when: v.isNearDeadline && (v.supportUnclear || v.residenceUnclear),
      primaryPriority: 3,
      dedupeGroup: "discharge_support",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.discharge_support,
      headline:
        "3日以内に、退院後の住まいと支援について担当者と確認してください。完全な結論を出すのではなく、「退院直後はどこで、誰の支援を受けるか」を仮置きします。",
      deadline: "3日以内",
      contact: "退院後の担当者",
      title: "退院直後の住まいと支援の仮置きを確認する",
    },
    {
      id: "p4_hospitalized_gap",
      when: v.activeSupportGap && answers.q1 === "hospitalized",
      primaryPriority: 4,
      dedupeGroup: "discharge_support",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.discharge_support,
      headline:
        "今日、病院の退院支援担当者に、退院の見込み時期と必要な支援を確認してください。退院日がまだ決まっていなくても、「退院の見込み」「退院までに家族が決めること」「退院直後に必要な支援」の3点を先に確認しておきます。",
      deadline: "今日",
      contact: "病院の退院支援担当者",
      title: "退院の見込み時期と必要な支援を確認する",
    },
    {
      id: "p4_facility_search_gap",
      when: v.activeSupportGap && answers.q1 === "facility_search",
      primaryPriority: 4,
      dedupeGroup: "discharge_support",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.discharge_support,
      headline:
        "3日以内に、現在相談している担当者または地域包括支援センターへ確認してください。「住み替えの希望時期」「候補を絞る前に確認する支援」「当面の費用」の3点を整理します。",
      deadline: "3日以内",
      contact: "現在相談している担当者、または地域包括支援センター",
      title: "住み替えの希望時期・確認すべき支援・当面の費用を整理する",
    },
    {
      id: "p5_money_early",
      when: v.moneyNeedsEarlyCheck,
      primaryPriority: 5,
      dedupeGroup: "money_3_months",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.money_3_months,
      headline: `${v.moneyCheckDeadline}、退院・入居後3か月のお金を1枚に並べてください。年金、預貯金、加入済み保険の給付、施設・住居費、医療・介護費、実家の維持費、家族の持ち出しを分けます。住まいと支援の確認を止めず、並行して行います。`,
      deadline: v.moneyCheckDeadline,
      contact: "家族内",
      title: "退院・入居後3か月の収支を1枚に並べる",
    },
    {
      id: "p6_wishes_unclear",
      when: v.wishesUnclear && !v.wishesHardToConfirm,
      primaryPriority: 6,
      dedupeGroup: "wishes",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.wishes,
      headline:
        "3日以内に、ご本人が続けたい暮らしを一つ確認してください。「どこに住みたいか」だけでなく、「今までの生活で何を続けたいか」を聞きます。",
      deadline: "3日以内",
      contact: "ご本人",
      title: "続けたい暮らしを一つ確認する",
    },
    {
      id: "p7_wishes_hard",
      when: v.wishesHardToConfirm,
      primaryPriority: 7,
      dedupeGroup: "wishes",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.wishes,
      headline:
        "3日以内に、ご本人のこれまでの希望を知る人へ確認してください。家族や支援者に、「本人が以前どのような暮らしを望んでいたか」を確認します。これだけで本人の意思を決めつけないでください。",
      deadline: "3日以内",
      contact: "本人の希望を知る家族や支援者",
      title: "以前どのような暮らしを望んでいたかを確認する",
    },
    {
      id: "p8_contract_concern",
      when: v.contractConcern && v.homeActionExpected,
      primaryPriority: 8,
      dedupeGroup: "contract_before_home_action",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.contract_before_home_action,
      headline:
        "実家を売る・貸す契約を進める前に、法律の専門家へ確認してください。ご本人の現在の様子と、予定している契約を伝え、誰がどのような手続を行えるかを確認します。",
      deadline: "契約前",
      contact: "司法書士または弁護士",
      title: "ご本人の現在の様子と予定している契約を伝え、進め方を確認する",
    },
    {
      id: "p9_contract_unknown",
      when: v.contractStatusUnknown && v.homeActionExpected,
      primaryPriority: 9,
      dedupeGroup: "contract_before_home_action",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.contract_before_home_action,
      headline:
        "実家について契約を進める前に、ご本人の現在の理解と希望を確認してください。確認が難しい場合は、契約を先に進めず、司法書士や弁護士などへ相談します。",
      deadline: "契約前",
      contact: "司法書士または弁護士",
      title: "ご本人の現在の理解と希望を確認する（難しい場合は専門家へ相談する）",
    },
    {
      id: "p10_money_later",
      when: (v.moneyUnclear || v.familyContribution) && !v.moneyNeedsEarlyCheck,
      primaryPriority: 10,
      dedupeGroup: "money_3_months",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.money_3_months,
      headline:
        "1週間以内に、これから3か月のお金を1枚に並べてください。年金、預貯金、保険の給付、施設・住居費、医療・介護費、実家の維持費、家族の持ち出しを分けて記録します。",
      deadline: "1週間以内",
      contact: "家族内",
      title: "これから3か月のお金を1枚に並べて記録する",
    },
    {
      id: "p11_home_management",
      when: v.homeWillRemain,
      primaryPriority: 11,
      dedupeGroup: "home_minimum_management",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.home_minimum_management,
      headline: "1週間以内に、実家を誰が管理するか決めてください。鍵、郵便物、換気、通水、庭、火災保険、緊急連絡先の担当を確認します。",
      deadline: "1週間以内",
      contact: "家族内",
      title: "実家の管理担当（鍵・郵便物・換気・通水・庭・火災保険・緊急連絡先）を決める",
    },
    {
      id: "p12_family_talk",
      when: true,
      primaryPriority: 12,
      dedupeGroup: "family_meeting_baseline",
      // 汎用的な内容のため、次に確認することの一覧には出さない（②の最終フォールバック専用）
      secondaryGroupOrder: null,
      headline:
        "2週間以内に、ご本人と家族で今後の大枠を話してください。「続けたい暮らし」「家族ができること」「今は決めなくてよいこと」の3点を言葉にします。",
      deadline: "2週間以内",
      contact: "ご本人と家族",
      title: "続けたい暮らし・家族ができること・今は決めなくてよいことを話す",
    },
    {
      id: "p_few_supporters",
      // 身寄りや頼れる人が少ない場合は、汎用の「家族で話す」フォールバック（p12, 常に真）より
      // 優先させ、地域包括支援センターへの接続を最初の行動にできるようにする。
      when: v.fewSupporters,
      primaryPriority: 4.5,
      dedupeGroup: "family_support_load",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.family_support_load,
      headline:
        "3日以内に、ご本人の住所地を担当する地域包括支援センターへ「身寄りや頼れる人が少ない」と伝えてください。介護、生活支援、権利擁護など、頼れる相談先を一緒に整理してもらえます。",
      deadline: "3日以内",
      contact: "地域包括支援センター",
      title: "身寄りや頼れる人が少ないことを伝え、頼れる相談先を整理する",
    },
    {
      id: "p_single_main_supporter",
      when: v.singleMainSupporter,
      primaryPriority: 4.6,
      dedupeGroup: "family_support_load",
      secondaryGroupOrder: SECONDARY_GROUP_ORDER.family_support_load,
      headline: "3日以内に、家族内または地域包括支援センターへ連絡、通院、費用確認、実家管理のうち、一人で抱えている項目を分けてください。",
      deadline: "3日以内",
      contact: "家族内または地域包括支援センター",
      title: "連絡・通院・費用確認・実家管理のうち、一人で抱えている項目を分ける",
    },
  ];
}

export type PostFirstAction = { headline: string };
export type PostNextAction = { deadline: string; contact: string; title: string };

export function buildFirstAndNextActions(
  answers: PostValidAnswers,
  v: PostVariables,
): { firstAction: PostFirstAction; nextActions: PostNextAction[] } {
  const candidates = buildActionCandidates(answers, v);
  const eligible = candidates.filter((c) => c.when);

  const primary = eligible.reduce((min, c) => (c.primaryPriority < min.primaryPriority ? c : min));

  const remaining = eligible.filter((c) => c.id !== primary.id && c.dedupeGroup !== primary.dedupeGroup && c.secondaryGroupOrder !== null);

  // dedupeGroupごとに、当選しているもの（primaryPriorityが最小のもの）を1件だけ残す
  const byGroup = new Map<string, ActionCandidate>();
  for (const candidate of remaining) {
    const current = byGroup.get(candidate.dedupeGroup);
    if (!current || candidate.primaryPriority < current.primaryPriority) {
      byGroup.set(candidate.dedupeGroup, candidate);
    }
  }

  const nextActions = Array.from(byGroup.values())
    .sort((a, b) => (a.secondaryGroupOrder ?? 99) - (b.secondaryGroupOrder ?? 99))
    .slice(0, 2)
    .map((c) => ({ deadline: c.deadline, contact: c.contact, title: c.title }));

  return { firstAction: { headline: primary.headline }, nextActions };
}
