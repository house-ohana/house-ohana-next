/**
 * 「3分整理ナビ｜平時ブランチ」（m=pre）結果文マッピング。
 * docs/navi-result-mapping.md 第3章（マッピング表）をそのまま実装したもの。
 * ここに定義されていない文言を表示しない（同文書 第9-9節・第4-④節「統合の共通10原則」10番）。
 *
 * T4a/T4b/T4dはQ8の回答に応じて内容が変わるため、このテーブルには含めず
 * lib/diagnosis/pre/logic.ts の専用ロジックで解決する（同文書 第4-②節）。
 */

export type PreFactCategory = "A" | "B" | "skip";

export type PreFactEntry = {
  category: PreFactCategory;
  fact?: string;
  point?: string;
  area?: string;
  priority?: number;
};

// キー: `${質問ID}${回答コード}` （例: "Q1a", "T2d"）
export const PRE_FACTS: Record<string, PreFactEntry> = {
  // ① 本人の希望と医療
  Q1a: { category: "A", fact: "これからの過ごし方について、ご本人の希望があります" },
  Q1b: {
    category: "B",
    fact: "過ごし方の希望は、まだ決まっていません",
    point: "どこで、どのように過ごしたいか。今は仮の答えでかまいません",
    area: "かかりつけ医／地域包括支援センター",
    priority: 5,
  },
  Q1c: {
    category: "B",
    fact: "過ごし方について、まだ考える機会がありませんでした",
    point: "どこで、どのように過ごしたいか。今は仮の答えでかまいません",
    area: "かかりつけ医／地域包括支援センター",
    priority: 5,
  },
  Q2a: { category: "A", fact: "かかりつけの先生が決まっています" },
  Q2b: {
    category: "B",
    fact: "かかりつけの先生は決まっていません",
    point: "体調が変わったとき、最初に相談できる先をつくる",
    area: "かかりつけ医／地域包括支援センター",
    priority: 12,
  },
  Q2c: {
    category: "B",
    fact: "かかりつけの先生については、確認できていません",
    point: "普段の受診先を確認する",
    area: "かかりつけ医",
    priority: 14,
  },
  T1a: { category: "A", fact: "希望を、ご家族や信頼できる方に伝えています" },
  T1b: {
    category: "B",
    fact: "希望は決まっていますが、まだ伝えていません",
    point: "誰に、いつ伝えるか",
    priority: 6,
  },
  T1d: {
    category: "B",
    fact: "希望を伝える相手が、まだ決まっていません",
    point: "ご家族に限らず、信頼できる方や専門職を含めて考える",
    area: "地域包括支援センター／司法書士等",
    priority: 3,
  },

  // ② お金
  Q3a: { category: "A", fact: "使えるお金の場所と、おおよその額を把握しています" },
  Q3b: {
    category: "B",
    fact: "使えるお金の場所は、おおよそ把握されています",
    point: "必要なときにすぐ動かせる形になっているかを確認する",
    area: "保険・FPの領域",
    priority: 18,
  },
  Q3c: {
    category: "B",
    fact: "使えるお金の場所と額は、まだ確認できていません",
    point: "入院や介護が続いたとき、すぐ使えるお金がどれくらいあるか",
    area: "保険・FPの領域",
    priority: 16,
  },
  Q4a: { category: "A", fact: "保険の内容を、1年以内に確認しています" },
  Q4b: { category: "A", fact: "保険の内容を、3年以内に確認しています" },
  Q4c: {
    category: "B",
    fact: "保険の内容を最後に確認してから、3年以上経っています",
    point: "今の暮らし方、公的制度、預貯金と合わせて、加入内容を確認する",
    area: "保険・FPの領域",
    priority: 17,
  },
  Q4d: {
    category: "B",
    fact: "保険の内容を最後に確認してから、5年以上経っています",
    point: "今の暮らし方、公的制度、預貯金と合わせて、加入内容を確認する",
    area: "保険・FPの領域",
    priority: 17,
  },
  Q4e: {
    category: "B",
    fact: "保険の内容を最後に確認した時期を、覚えていません",
    point: "今の暮らし方、公的制度、預貯金と合わせて、加入内容を確認する",
    area: "保険・FPの領域",
    priority: 17,
  },
  T2a: { category: "A", fact: "預貯金や保険の情報を、ご家族や信頼できる方が確認できる状態です" },
  T2b: {
    category: "B",
    fact: "預貯金や保険の情報は、一部なら確認できる状態です",
    point: "残りをどこまで共有するか",
    priority: 19,
  },
  T2c: {
    category: "B",
    fact: "必要なとき、預貯金や保険の情報を確認できる状態ではありません",
    point: "どこに何があるかを、誰がどう知る状態にするか",
    priority: 11,
  },
  T2d: {
    category: "B",
    fact: "情報を確認できる方が、まだ決まっていません",
    point: "ご家族以外に任せる方法も含めて考える",
    area: "司法書士等（任意後見・死後事務委任）",
    priority: 4,
  },

  // ③ 住まい
  Q5a: {
    category: "B",
    fact: "今のお住まいに、体が弱ったときに困りそうな場所があります",
    point: "住み続けるために手を入れるか、別の方法を考えるか",
    area: "地域包括支援センター（住宅改修）／建築・不動産の領域",
    priority: 13,
  },
  Q5b: { category: "A", fact: "お住まいについて、困りそうな場所は確認済みです" },
  Q5c: {
    category: "B",
    fact: "お住まいの困りそうな場所は、まだ確認していません",
    point: "段差・階段・浴室などを、実際に見て確認する",
    area: "地域包括支援センター（住宅改修）",
    priority: 15,
  },
  Q6a: { category: "A", fact: "家のこの先について、話し合ったことがあります" },
  Q6b: {
    category: "B",
    fact: "家のこの先について、まだ話し合っていません",
    point: "住み続ける／手を入れる／移る、のどれを軸に考えるか",
    area: "建築・不動産の領域",
    priority: 10,
  },
  Q6c: {
    category: "B",
    fact: "家のこの先を話す相手が、まだ決まっていません",
    point: "相談できる専門職を含めて考える",
    area: "地域包括支援センター／建築・不動産の領域",
    priority: 4,
  },
  T3a: { category: "A", fact: "ご家族や信頼できる方の考えを、聞いたことがあります" },
  T3b: {
    category: "B",
    fact: "ご家族や信頼できる方の考えは、まだ聞いていません",
    point: "希望が食い違う可能性を、先に確認する",
    priority: 11,
  },
  T3c: { category: "skip" },

  // ④ 支える人
  Q7a: { category: "A", fact: "介護が必要になったとき、中心になる方が決まっています" },
  Q7b: {
    category: "B",
    fact: "介護が必要になったとき、中心になる方は決まっていません",
    point: "誰が、どこまで、いつまで担えるか",
    area: "地域包括支援センター",
    priority: 7,
  },
  Q7c: {
    category: "B",
    fact: "介護が必要になったとき、身近に頼れる方がいない状況です",
    point: "公的サービスと、身元保証や任意後見などの仕組みを、先に組み合わせておく",
    area: "地域包括支援センター／司法書士等",
    priority: 2,
  },
  Q7d: {
    category: "B",
    fact: "介護が必要になったときのことは、まだ考える機会がありませんでした",
    point: "誰が、どこまで、いつまで担えるか",
    area: "地域包括支援センター",
    priority: 7,
  },
  Q8a: {
    category: "B",
    fact: "支える可能性のある方は、お仕事をお持ちです",
    point: "働きながらでも続けられる形にするには、何が必要か",
    area: "公的介護保険のサービス／勤務先の介護休業制度／地域包括支援センター",
    priority: 8,
  },
  Q8b: { category: "A", fact: "支える可能性のある方の就労状況を確認できています" },
  Q8c: { category: "skip" },
  Q8d: {
    category: "B",
    fact: "支える可能性のある方の状況は、確認できていません",
    point: "誰がどこまで担えるかを、一度確認する",
    area: "地域包括支援センター",
    priority: 16,
  },
  T4a: { category: "A", fact: "支える役割について、その方と話しています" },

  // ⑤ 希望を知る人・動く人
  Q9a: { category: "A", fact: "意思を伝えにくくなったときに、中心になる方が決まっています" },
  Q9b: {
    category: "B",
    fact: "意思を伝えにくくなったときに、中心になる方は決まっていません",
    point: "誰に希望を知っておいてもらうか。正式に動いてもらうには手続きが必要になります",
    area: "司法書士等（任意後見・委任）／地域包括支援センター",
    priority: 5,
  },
  Q9c: {
    category: "B",
    fact: "意思を伝えにくくなったときに、身近に頼れる方がいない状況です",
    point: "判断が難しくなったときと、亡くなったあと、それぞれ誰に頼むかを決めておく",
    area: "司法書士等（任意後見・死後事務委任）／地域包括支援センター",
    priority: 1,
  },
  Q9d: {
    category: "B",
    fact: "意思を伝えにくくなったときのことは、まだ考える機会がありませんでした",
    point: "誰に希望を知っておいてもらうか。正式に動いてもらうには手続きが必要になります",
    area: "司法書士等／地域包括支援センター",
    priority: 5,
  },
  Q10a: { category: "A", fact: "通帳や証券などの場所を知っている方がいます" },
  Q10b: {
    category: "B",
    fact: "通帳や証券などの場所を知っている方がいません",
    point: "どこに何があるかを、誰にどう伝えるか",
    priority: 12,
  },
  Q10c: {
    category: "B",
    fact: "場所を知らせる相手が、まだ決まっていません",
    point: "ご家族以外に任せる方法も含めて考える",
    area: "司法書士等",
    priority: 4,
  },
  T5a: { category: "A", fact: "通帳・保険証券・重要な書類の場所を、書面やデータにまとめています" },
  T5b: {
    category: "B",
    fact: "場所は口頭で伝えていますが、書面やデータにはまとめていません",
    point: "必要なときに確認できるよう、書き残す方法を考える",
    priority: 14,
  },
  T5c: {
    category: "B",
    fact: "通帳・保険証券・重要な書類の場所は、書面やデータにまとめていません",
    point: "必要なときに確認できるよう、まず一覧にする",
    priority: 12,
  },
};

// ---- 第4章 特別ロジックの統合文（複数コードの組み合わせでのみ使用） ----

/** 第4-④節A：希望や暮らしについて話す相手（T1d × Q6c） */
export const INTEGRATION_T1D_Q6C: PreFactEntry = {
  category: "B",
  fact: "これからの希望や住まいについて、話す相手がまだ決まっていません",
  point: "ご家族に限らず、信頼できる方や公的な相談窓口の中から、誰に何を話すか",
  area: "地域包括支援センター／暮らし・住まいの領域",
  priority: 3,
};

/** 第4-③節：身近に頼れる方がいない（Q7c × Q9c） */
export const INTEGRATION_Q7C_Q9C: PreFactEntry = {
  category: "B",
  fact: "介護が必要になったときや、意思を伝えにくくなったときに、身近に中心となる方がいない状況です",
  point: "公的な相談窓口や専門職と、生活の支援、希望の共有、手続きの役割をどのように分けるか",
  area: "地域包括支援センター／成年後見・法律の領域",
  priority: 1,
};

/** 第4-④節B：お金や書類を確認できる相手（T2d × Q10c、T5=cではない場合） */
export const INTEGRATION_T2D_Q10C: PreFactEntry = {
  category: "B",
  fact: "預貯金、保険、重要な書類について、確認できる方がまだ決まっていません",
  point: "情報をどのようにまとめ、誰が必要なときに確認できる状態にするか",
  area: "司法書士等／手続き・情報整理の領域",
  priority: 4,
};

/** 第4-④節C：Q10b × T5c */
export const INTEGRATION_Q10B_T5C: PreFactEntry = {
  category: "B",
  fact: "通帳や保険証券などの場所を知っている方がおらず、書面やデータにもまとめていません",
  point: "まず、どこに何があるかを一覧にし、誰にどう伝えるかを考える",
  area: "手続き・情報整理の領域",
  priority: 4,
};

/** 第4-④節C：Q10c × T5c（T2=dではない場合） */
export const INTEGRATION_Q10C_T5C: PreFactEntry = {
  category: "B",
  fact: "通帳や保険証券などの場所を知らせる相手が決まっておらず、書面やデータにもまとめていません",
  point: "まず情報を一覧にし、ご家族に限らず、誰が確認できる状態にするかを考える",
  area: "司法書士等／手続き・情報整理の領域",
  priority: 4,
};

/** 第4-④節D：3条件専用統合（T2d × Q10c × T5c） */
export const INTEGRATION_T2D_Q10C_T5C: PreFactEntry = {
  category: "B",
  fact: "預貯金、保険、重要な書類について、確認できる方がまだ決まっておらず、書面やデータにもまとめていません",
  point: "まず、どこに何があるかを一覧にし、その後、誰が必要なときに確認できる状態にするかを考える",
  area: "手続き・情報整理の領域",
  priority: 4,
};

/** 第4-②節A：Q7=a かつ Q8=a かつ T4=b（優先0・最上位） */
export const SPECIAL_ROLE_SHARING_A: PreFactEntry = {
  category: "B",
  fact: "支える予定の方はお仕事をお持ちですが、まだ役割について話していません。",
  point: "ご本人の希望と、支える方ができる範囲、外部サービスを使う範囲を確認する",
  area: "地域包括支援センター",
  priority: 0,
};

/** 第4-②節B：Q7=a かつ Q8=a かつ T4=d（優先3） */
export const SPECIAL_ROLE_SHARING_B: PreFactEntry = {
  category: "B",
  fact: "支える可能性のある方はお仕事をお持ちですが、支える役割が共有されているか、確認できていません。",
  point: "ご本人の希望と、支える方ができる範囲、外部サービスを使う範囲を確認する",
  area: "地域包括支援センター",
  priority: 3,
};

/**
 * T4=b・T4=dだが Q8≠a（支える方が仕事をしていない・まだ決まっていない・分からない）の場合。
 * docs/navi-result-mapping.md にはこの組み合わせの確定文言が存在しなかったため、
 * 2026-07-24にユーザー承認のうえ、就労の有無に触れない中立文として新規作成した。
 * 優先度はT4dの通常時（第8章12番・第4-③節）に合わせて9とする。
 */
export const SPECIAL_ROLE_SHARING_FALLBACK_T4B: PreFactEntry = {
  category: "B",
  fact: "支える役割について、まだ話していません",
  point: "誰が、どこまで、いつまで担えるか",
  area: "地域包括支援センター",
  priority: 9,
};

export const SPECIAL_ROLE_SHARING_FALLBACK_T4D: PreFactEntry = {
  category: "B",
  fact: "支える役割について、話しているかどうか、分からない状態です",
  point: "誰が、どこまで、いつまで担えるか",
  area: "地域包括支援センター",
  priority: 9,
};
