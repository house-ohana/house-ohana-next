import type { PreAnswers, PreQuestionId } from "./types";

/**
 * 「3分整理ナビ｜平時ブランチ」（m=pre）の設問データ。
 * docs/navi-result-mapping.md 第1節（v4）をそのまま実装したもの。
 * 文言・選択肢コード（a/b/c/d/e）は仕様書と完全に一致させること。
 */

export type PreQuestionOption = {
  value: string;
  label: string;
};

export type PreQuestion = {
  id: PreQuestionId;
  title: string;
  options: PreQuestionOption[];
  /** 前の回答によってこの設問自体が成立しない場合はfalse（表示せず、URLにも追加しない） */
  isApplicable?: (answers: PreAnswers) => boolean;
  /** 選択肢そのものが前の回答で変わる設問（T5）用。指定時はoptionsの代わりにこちらを使う */
  getOptions?: (answers: PreAnswers) => PreQuestionOption[];
};

export const PRE_QUESTIONS: PreQuestion[] = [
  // ① 本人の希望と医療
  {
    id: "Q1",
    title: "体調が変わったとき、どこでどのように過ごしたいか、ご本人の希望はありますか",
    options: [
      { value: "a", label: "希望がある" },
      { value: "b", label: "まだ決めていない" },
      { value: "c", label: "考えたことがない" },
    ],
  },
  {
    id: "Q2",
    title: "普段診てもらう、かかりつけの先生は決まっていますか",
    options: [
      { value: "a", label: "決まっている" },
      { value: "b", label: "いない" },
      { value: "c", label: "分からない" },
    ],
  },
  {
    id: "T1",
    title: "その希望を、ご家族や信頼できる方に伝えていますか",
    options: [
      { value: "a", label: "伝えている" },
      { value: "b", label: "伝えていない" },
      { value: "d", label: "伝える相手が決まっていない" },
    ],
    isApplicable: (answers) => answers.Q1 === "a",
  },

  // ② お金
  {
    id: "Q3",
    title: "入院や介護が続いたときに使えるお金の場所と、おおよその額を把握していますか",
    options: [
      { value: "a", label: "把握している" },
      { value: "b", label: "おおよそ把握している" },
      { value: "c", label: "確認が必要" },
    ],
  },
  {
    id: "Q4",
    title: "加入している保険の内容を、最後に確認したのはいつですか",
    options: [
      { value: "a", label: "1年以内" },
      { value: "b", label: "1年超〜3年以内" },
      { value: "c", label: "3年超〜5年未満" },
      { value: "d", label: "5年以上前" },
      { value: "e", label: "覚えていない" },
    ],
  },
  {
    id: "T2",
    title: "必要になったとき、預貯金や保険の情報を、ご家族や信頼できる方が確認できる状態ですか",
    options: [
      { value: "a", label: "確認できる" },
      { value: "b", label: "一部なら確認できる" },
      { value: "c", label: "確認できない・分からない" },
      { value: "d", label: "確認できる相手が決まっていない" },
    ],
  },

  // ③ 住まい
  {
    id: "Q5",
    title: "今のお住まいで、体が弱ったときに困りそうな場所はありますか（段差・階段・浴室など）",
    options: [
      { value: "a", label: "ある" },
      { value: "b", label: "ない" },
      { value: "c", label: "考えたことがない" },
    ],
  },
  {
    id: "Q6",
    title: "その家をこの先どうするか（住み続ける／手を入れる／移る）、話し合ったことがありますか",
    options: [
      { value: "a", label: "話し合った" },
      { value: "b", label: "話し合っていない" },
      { value: "c", label: "話す相手が決まっていない" },
    ],
  },
  {
    id: "T3",
    title: "住まいの今後について、ご家族や信頼できる方の考えを聞いたことがありますか",
    options: [
      { value: "a", label: "聞いたことがある" },
      { value: "b", label: "聞いたことがない" },
      { value: "c", label: "聞く相手が決まっていない" },
    ],
  },

  // ④ 支える人
  {
    id: "Q7",
    title: "もし介護が必要になったら、中心になる方は決まっていますか",
    options: [
      { value: "a", label: "決まっている" },
      { value: "b", label: "決まっていない" },
      { value: "c", label: "身近に頼れる方がいない" },
      { value: "d", label: "考えたことがない" },
    ],
  },
  {
    id: "Q8",
    title: "支える可能性のある方には、お仕事がありますか",
    options: [
      { value: "a", label: "仕事をしている方がいる" },
      { value: "b", label: "仕事をしている方はいない" },
      { value: "c", label: "支える方がまだ決まっていない" },
      { value: "d", label: "分からない" },
    ],
  },
  {
    id: "T4",
    title: "支える役割について、その方と話していますか",
    options: [
      { value: "a", label: "話している" },
      { value: "b", label: "話していない" },
      { value: "d", label: "分からない" },
    ],
    isApplicable: (answers) => answers.Q7 === "a",
  },

  // ⑤ 希望を知る人・動く人
  {
    id: "Q9",
    title: "ご本人が意思を伝えにくくなったとき、希望を知り、相談や連絡の中心になる方は決まっていますか",
    options: [
      { value: "a", label: "決まっている" },
      { value: "b", label: "決まっていない" },
      { value: "c", label: "身近に頼れる方がいない" },
      { value: "d", label: "考えたことがない" },
    ],
  },
  {
    id: "Q10",
    title: "通帳・保険証券・権利証などの場所を知っている人はいますか",
    options: [
      { value: "a", label: "いる" },
      { value: "b", label: "いない" },
      { value: "c", label: "知らせる相手が決まっていない" },
    ],
  },
  {
    id: "T5",
    title: "通帳・保険証券・重要な書類の場所を、書面やデータにまとめていますか",
    options: [
      { value: "a", label: "書面やデータにまとめている" },
      { value: "b", label: "口頭でのみ伝えている" },
      { value: "c", label: "まとめていない" },
    ],
    // Q10=b/cのとき「口頭でのみ伝えている」は非表示（第1-⑤節）
    getOptions: (answers) => {
      const base = [
        { value: "a", label: "書面やデータにまとめている" },
        { value: "b", label: "口頭でのみ伝えている" },
        { value: "c", label: "まとめていない" },
      ];
      if (answers.Q10 === "a") return base;
      return base.filter((option) => option.value !== "b");
    },
  },
];

export function isPreQuestionApplicable(question: PreQuestion, answers: PreAnswers): boolean {
  return question.isApplicable ? question.isApplicable(answers) : true;
}

export function getPreQuestionOptions(question: PreQuestion, answers: PreAnswers): PreQuestionOption[] {
  return question.getOptions ? question.getOptions(answers) : question.options;
}
