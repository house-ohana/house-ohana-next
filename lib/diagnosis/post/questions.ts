import type { PostAnswers, PostQuestionId } from "./types";

/**
 * 「3分整理ナビ｜事後ブランチ」（m=post）の設問データ。
 * 実装最終版仕様書 第5節をそのまま実装したもの。文言・回答IDは仕様書と完全に一致させること。
 */

export type PostQuestionOption = {
  value: string;
  label: string;
};

export type PostQuestion = {
  id: PostQuestionId;
  title: string;
  /** 質問の直前に表示する説明文（Q9のみ使用） */
  lead?: string;
  /** 質問の直後に表示する補足文（Q4のみ使用） */
  hint?: string;
  options: PostQuestionOption[];
  /** 前の回答によって質問文が変わる場合（Q2はQ1の値で変わる） */
  getTitle?: (answers: PostAnswers) => string;
  /** 前の回答によって選択肢が変わる場合（Q2はQ1、Q7はQ6の値で変わる） */
  getOptions?: (answers: PostAnswers) => PostQuestionOption[];
};

const Q2_ACTIVE_OPTIONS: PostQuestionOption[] = [
  { value: "within_7_days", label: "1週間以内" },
  { value: "within_30_days", label: "1か月以内" },
  { value: "date_unknown", label: "話は出ているが、日は決まっていない" },
  { value: "no_deadline", label: "今のところ期限はない" },
  { value: "unknown", label: "分からない" },
];

const Q2_DISCHARGED_OPTIONS: PostQuestionOption[] = [
  { value: "urgent_after_discharge", label: "住まいや支援がまだ整っていない" },
  { value: "some_unresolved", label: "一部、決まっていないことがある" },
  { value: "mostly_settled", label: "当面の生活は整っている" },
  { value: "unknown", label: "分からない" },
];

const Q7_OPTIONS: PostQuestionOption[] = [
  { value: "likely_sufficient", label: "年金や本人の預貯金で当面は足りそう" },
  { value: "unknown_amount", label: "足りるか分からない" },
  { value: "consider_home_income", label: "実家を売る・貸すことも考えている" },
  { value: "family_pays", label: "家族が負担する見込み" },
  { value: "mixed", label: "本人と家族の両方で負担する見込み" },
  { value: "unknown", label: "まだ考えていない・分からない" },
];

export const POST_QUESTIONS: PostQuestion[] = [
  {
    id: "q1",
    title: "ご本人は今、どの段階ですか？",
    options: [
      { value: "hospitalized", label: "入院中で、退院の話が出ている" },
      { value: "discharged", label: "すでに退院している" },
      { value: "facility_search", label: "施設や住み替え先を探している" },
      { value: "future", label: "まだ先だが、今後に向けて考え始めた" },
    ],
  },
  {
    id: "q2",
    title: "退院日や入居期限は、どのくらい先ですか？",
    options: Q2_ACTIVE_OPTIONS,
    getTitle: (answers) =>
      answers.q1 === "discharged" ? "退院後の暮らしについて、今すぐ困っていることはありますか？" : "退院日や入居期限は、どのくらい先ですか？",
    getOptions: (answers) => (answers.q1 === "discharged" ? Q2_DISCHARGED_OPTIONS : Q2_ACTIVE_OPTIONS),
  },
  {
    id: "q3",
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
    id: "q4",
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
    id: "q5",
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
    id: "q6",
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
    id: "q7",
    title: "これからの生活費・施設費・実家の維持費は、どのように賄う見込みですか？",
    options: Q7_OPTIONS,
    // Q6=no_home_issueの場合、実家を前提とする選択肢は表示しない
    getOptions: (answers) =>
      answers.q6 === "no_home_issue" ? Q7_OPTIONS.filter((option) => option.value !== "consider_home_income") : Q7_OPTIONS,
  },
  {
    id: "q8",
    title: "ご本人のことを支える人は、どのような状況ですか？",
    options: [
      { value: "shared", label: "家族や周囲の人と分担できる" },
      { value: "mostly_one_person", label: "主に一人が担っている" },
      { value: "few_supporters", label: "身寄りや頼れる人が少ない" },
      { value: "unknown", label: "分からない" },
    ],
  },
  {
    id: "q9",
    title: "ご本人は、実家やお金の大きな契約について、説明を理解し、ご自身の考えを伝えられていますか？",
    lead: "実家やお金に関する大きな契約は、ご本人が説明を理解し、ご自身の考えを伝えられる段階と、そうすることが難しくなった段階とで、進め方が変わる場合があります。ここでは法律上・医学上の判断能力を判定しません。ご家族などから見た、現在の様子をお聞きします。",
    options: [
      { value: "clearly_understands", label: "理解して、自分の考えを伝えられている" },
      { value: "fluctuates", label: "日や時間によって様子が違う" },
      { value: "seems_difficult", label: "説明を理解することが難しそう" },
      { value: "not_confirmed", label: "まだ確認していない" },
      { value: "unknown", label: "分からない" },
    ],
  },
];

export function getPostQuestionTitle(question: PostQuestion, answers: PostAnswers): string {
  return question.getTitle ? question.getTitle(answers) : question.title;
}

export function getPostQuestionOptions(question: PostQuestion, answers: PostAnswers): PostQuestionOption[] {
  return question.getOptions ? question.getOptions(answers) : question.options;
}
