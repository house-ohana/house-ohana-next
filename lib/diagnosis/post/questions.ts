import type { PostAnswers, PostQuestionId } from "./types";

/**
 * 「3分整理ナビ｜事後ブランチ」（m=post）の設問データ。
 * docs/phase2-design.md（Phase2 質問構造再設計・承認済み）をそのまま実装したもの。
 * 文言・回答IDは同文書と完全に一致させること。
 *
 * 構成:
 * - 共通質問 C1〜C8（全員に表示）
 * - 条件付き質問 S1（支援枝）／H1・H2（実家枝）／CT1（契約枝）（該当者のみ表示）
 * 表示順は常に C1〜C8 の後に S1 → H1 → H2 → CT1（該当するもののみ）。
 */

export type PostQuestionOption = {
  value: string;
  label: string;
};

export type PostQuestion = {
  id: PostQuestionId;
  title: string;
  /** 質問の直前に表示する説明文（CT1のみ使用） */
  lead?: string;
  /** 質問の直後に表示する補足文（C4のみ使用） */
  hint?: string;
  options: PostQuestionOption[];
  /** 前の回答によって質問文が変わる場合（C2はC1の値、CT1はH1の値で変わる） */
  getTitle?: (answers: PostAnswers) => string;
  /** 前の回答によって説明文（lead）が変わる場合（CT1はH1の値で変わる） */
  getLead?: (answers: PostAnswers) => string;
  /** 前の回答によって選択肢が変わる場合（C2はC1の値で変わる） */
  getOptions?: (answers: PostAnswers) => PostQuestionOption[];
  /** 前の回答によってこの設問自体が成立しない場合はfalse（表示せず、URLにも追加しない） */
  isApplicable?: (answers: PostAnswers) => boolean;
};

// ---- C2: C1の値によって質問文・選択肢の文言が変わる（入院中／施設探し中／退院済みで別物） ----

const C2_HOSPITALIZED_OPTIONS: PostQuestionOption[] = [
  { value: "within_7_days", label: "1週間以内" },
  { value: "within_30_days", label: "1か月以内" },
  { value: "date_unknown", label: "まだ分からないと言われている" },
  { value: "no_deadline", label: "退院の話はまだ出ていない" },
  { value: "unknown", label: "分からない" },
];

const C2_FACILITY_SEARCH_OPTIONS: PostQuestionOption[] = [
  { value: "within_7_days", label: "1週間以内" },
  { value: "within_30_days", label: "1か月以内" },
  { value: "date_unknown", label: "まだ具体的には決めていない" },
  { value: "no_deadline", label: "急いでいない" },
  { value: "unknown", label: "分からない" },
];

const C2_DISCHARGED_OPTIONS: PostQuestionOption[] = [
  { value: "urgent_after_discharge", label: "住まいや支援がまだ整っていない" },
  { value: "some_unresolved", label: "一部、決まっていないことがある" },
  { value: "mostly_settled", label: "当面の生活は整っている" },
  { value: "unknown", label: "分からない" },
];

function c2Title(answers: PostAnswers): string {
  if (answers.c1 === "discharged") return "退院後の暮らしについて、今すぐ困っていることはありますか？";
  if (answers.c1 === "facility_search") return "いつ頃までに住み替えたいと考えていますか？";
  return "退院はいつ頃になりそうですか？";
}

function c2Options(answers: PostAnswers): PostQuestionOption[] {
  if (answers.c1 === "discharged") return C2_DISCHARGED_OPTIONS;
  if (answers.c1 === "facility_search") return C2_FACILITY_SEARCH_OPTIONS;
  return C2_HOSPITALIZED_OPTIONS;
}

// ---- CT1: H1の値（売る／貸す／解体）に応じて、確認する手続の種類を文言へ反映する ----
function ct1ActionLabel(answers: PostAnswers): string {
  if (answers.h1 === "rent") return "賃貸";
  if (answers.h1 === "demolish") return "解体";
  // h1が"sell"、またはCT1が非該当のはずの値のときのフォールバックとして、売却を既定にする
  return "売却";
}

// ---- 「分からない」が多い場合の収束判定（docs/phase2-design.md 第7節） ----
// C4・C6・C7・C8がすべて「分からない」のとき、支援枝・実家枝（契約枝含む）をスキップする。
export function isMaximallyUncertain(answers: PostAnswers): boolean {
  return answers.c4 === "unknown" && answers.c6 === "unknown" && answers.c7 === "unknown" && answers.c8 === "unknown";
}

function isSupportBranchApplicable(answers: PostAnswers): boolean {
  if (isMaximallyUncertain(answers)) return false;
  return answers.c4 === "partly_arranged" || answers.c4 === "not_arranged" || answers.c4 === "unknown";
}

function isHomeBranchApplicable(answers: PostAnswers): boolean {
  if (isMaximallyUncertain(answers)) return false;
  return Boolean(answers.c6) && answers.c6 !== "no_home_issue" && answers.c6 !== "unknown";
}

function isContractBranchApplicable(answers: PostAnswers): boolean {
  return answers.h1 === "sell" || answers.h1 === "rent" || answers.h1 === "demolish";
}

export const POST_QUESTIONS: PostQuestion[] = [
  // ---- 共通質問 ----
  {
    id: "c1",
    title: "ご本人は今、どの段階ですか？",
    options: [
      { value: "hospitalized", label: "入院中で、退院の話が出ている" },
      { value: "discharged", label: "すでに退院している" },
      { value: "facility_search", label: "施設や住み替え先を探している" },
      { value: "future", label: "まだ先だが、今後に向けて考え始めた" },
    ],
  },
  {
    id: "c2",
    title: "退院はいつ頃になりそうですか？",
    options: C2_HOSPITALIZED_OPTIONS,
    getTitle: c2Title,
    getOptions: c2Options,
  },
  {
    id: "c3",
    title: "退院後・住み替え後の住まいは、今どの方向ですか？",
    options: [
      { value: "return_home", label: "自宅に戻る方向" },
      { value: "temporary_home", label: "いったん自宅に戻る方向" },
      { value: "facility", label: "施設や高齢者住宅を探している・入る方向" },
      { value: "undecided", label: "まだ決まっていない" },
      { value: "other", label: "それ以外の住まいを考えている" },
    ],
  },
  {
    id: "c4",
    title: "退院後の医療・介護・日常生活の支援は、どこまで決まっていますか？",
    hint: "自宅で生活できるかどうかを判定する質問ではありません。病院や介護の担当者との調整状況をお聞きします。",
    options: [
      { value: "arranged", label: "必要な支援はおおむね決まっている" },
      { value: "partly_arranged", label: "一部は決まっている" },
      { value: "not_arranged", label: "まだ決まっていない" },
      { value: "not_needed_said", label: "今のところ必要ないと言われている" },
      { value: "unknown", label: "何が必要か分からない" },
    ],
  },
  {
    id: "c5",
    title: "ご本人は、これからどのように暮らしたいと話していますか？",
    options: [
      { value: "wants_home", label: "自宅で暮らしたいと話している" },
      { value: "wants_facility", label: "施設や別の住まいを希望している" },
      { value: "considering", label: "本人もまだ迷っている" },
      { value: "not_discussed", label: "まだ本人と話せていない" },
      { value: "hard_to_confirm", label: "本人の希望を確認することが難しい" },
      { value: "unknown", label: "分からない" },
    ],
  },
  {
    id: "c6",
    title: "退院・入居後、ご本人の家はどうなりそうですか？",
    options: [
      { value: "person_returns", label: "ご本人が戻って住む予定" },
      { value: "may_return", label: "将来戻る可能性を残したい" },
      { value: "will_be_vacant", label: "空き家になる見込み" },
      { value: "already_vacant", label: "すでに空き家" },
      { value: "family_uses", label: "家族が使う予定" },
      { value: "no_home_issue", label: "対象になる実家はない" },
      { value: "unknown", label: "分からない" },
    ],
  },
  {
    id: "c7",
    title: "生活費や当面の費用について、見通しはどうですか？",
    options: [
      { value: "likely_sufficient", label: "年金や預貯金で当面は足りそう" },
      { value: "unknown_amount", label: "足りるか分からない" },
      { value: "family_pays", label: "家族の持ち出しが必要になりそう" },
      { value: "mixed", label: "本人と家族の両方で負担する見込み" },
      { value: "unknown", label: "まだ考えていない・分からない" },
    ],
  },
  {
    id: "c8",
    title: "ご本人のことを支える人は、どのような状況ですか？",
    options: [
      { value: "shared", label: "家族や周囲の人と分担できる" },
      { value: "mostly_one_person", label: "主に一人が担っている" },
      { value: "few_supporters", label: "身寄りや頼れる人が少ない" },
      { value: "unknown", label: "分からない" },
    ],
  },

  // ---- 条件付き質問（該当者のみ） ----
  {
    id: "s1",
    title: "要介護認定やケアマネジャーについて、今の状況を教えてください",
    options: [
      { value: "certified_with_manager", label: "認定を受けていて、ケアマネジャーも決まっている" },
      { value: "certified_no_manager", label: "認定は受けているが、ケアマネジャーはまだ決まっていない" },
      { value: "applying", label: "申請中" },
      { value: "not_applied", label: "まだ申請していない" },
      { value: "unknown", label: "分からない" },
    ],
    isApplicable: isSupportBranchApplicable,
  },
  {
    id: "h1",
    title: "実家について、今のところどう考えていますか？",
    options: [
      { value: "sell", label: "売ることを考えている" },
      { value: "rent", label: "貸すことを考えている" },
      { value: "demolish", label: "解体を考えている" },
      { value: "keep_for_now", label: "当面はそのまま残す" },
      { value: "undecided", label: "まだ決めていない" },
    ],
    isApplicable: isHomeBranchApplicable,
  },
  {
    id: "h2",
    title: "実家の名義はどうなっていますか？",
    options: [
      { value: "sole_owner", label: "ご本人お一人の名義" },
      { value: "shared_owner", label: "ご本人と他の方との共有名義" },
      { value: "other_owner", label: "ご本人以外の名義" },
      { value: "unknown", label: "わからない" },
    ],
    isApplicable: isContractBranchApplicable,
  },
  {
    id: "ct1",
    title: "ご本人は、実家の売却の手続について、説明を理解し、ご自身の考えを伝えられていますか？",
    lead: "実家の売却の手続は、ご本人が説明を理解し、ご自身の考えを伝えられる段階と、そうすることが難しくなった段階とで、進め方が変わる場合があります。ここでは法律上・医学上の判断能力を判定しません。ご家族などから見た、現在の様子をお聞きします。",
    getTitle: (answers) => `ご本人は、実家の${ct1ActionLabel(answers)}の手続について、説明を理解し、ご自身の考えを伝えられていますか？`,
    getLead: (answers) =>
      `実家の${ct1ActionLabel(answers)}の手続は、ご本人が説明を理解し、ご自身の考えを伝えられる段階と、そうすることが難しくなった段階とで、進め方が変わる場合があります。ここでは法律上・医学上の判断能力を判定しません。ご家族などから見た、現在の様子をお聞きします。`,
    options: [
      { value: "clearly_understands", label: "理解して、自分の考えを伝えられている" },
      { value: "fluctuates", label: "日や時間によって様子が違う" },
      { value: "seems_difficult", label: "説明を理解することが難しそう" },
      { value: "not_confirmed", label: "まだ確認していない" },
      { value: "unknown", label: "分からない" },
    ],
    isApplicable: isContractBranchApplicable,
  },
];

export function getPostQuestionTitle(question: PostQuestion, answers: PostAnswers): string {
  return question.getTitle ? question.getTitle(answers) : question.title;
}

export function getPostQuestionLead(question: PostQuestion, answers: PostAnswers): string | undefined {
  return question.getLead ? question.getLead(answers) : question.lead;
}

export function getPostQuestionOptions(question: PostQuestion, answers: PostAnswers): PostQuestionOption[] {
  return question.getOptions ? question.getOptions(answers) : question.options;
}

export function isPostQuestionApplicable(question: PostQuestion, answers: PostAnswers): boolean {
  return question.isApplicable ? question.isApplicable(answers) : true;
}

/**
 * 現在の回答状態で削除すべき（非該当になった）回答をすべて取り除く。
 * POST_QUESTIONSはゲートとなる設問が依存設問より先に並んでいるため、
 * 配列の先頭から1回走査するだけで、連鎖的な非該当（例: C6変更→H1非該当→H2/CT1も非該当）も
 * まとめて解消できる。
 */
export function pruneInapplicableAnswers(answers: PostAnswers): PostAnswers {
  const next: PostAnswers = { ...answers };
  for (const question of POST_QUESTIONS) {
    if (question.isApplicable && !question.isApplicable(next) && next[question.id] !== undefined) {
      delete next[question.id];
    }
  }
  return next;
}
