import type { DiagnosisQuestion } from "./types";

/**
 * 「3分整理ナビ」機能の質問データ。
 * ここを編集するだけで、質問文・選択肢・問題数を変更できます。
 * 氏名・住所・病名・資産額など、個人が特定される情報は質問しない方針です。
 *
 * 注意: 質問IDや選択肢のvalueは、URL共有機能（lib/diagnosis/schema.ts）が
 * 診断結果URLの復号に使っています。value・idの意味を変えずに文言（label）だけを
 * 直すのは問題ありませんが、questionのidやoptionのvalueを変更・削除する場合は
 * lib/diagnosis/schema.ts のバージョニング方針を確認してください。
 */
export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    id: "location",
    title: "親御さんは現在どこで暮らしていますか。",
    options: [
      { value: "home", label: "自宅" },
      { value: "hospital", label: "病院" },
      { value: "facility", label: "施設" },
      { value: "relative", label: "子ども・親族宅" },
      { value: "other", label: "その他" },
    ],
  },
  {
    id: "deadline",
    title: "退院や住み替えの期限はありますか。",
    options: [
      { value: "within_week", label: "1週間以内" },
      { value: "within_month", label: "1か月以内" },
      { value: "within_3months", label: "3か月以内" },
      { value: "undecided", label: "まだ決まっていない" },
      { value: "not_applicable", label: "該当しない" },
    ],
  },
  {
    id: "wish_confirmed",
    title: "本人の希望は確認できていますか。",
    options: [
      { value: "clear", label: "明確に確認できている" },
      { value: "somewhat", label: "ある程度確認できている" },
      { value: "differs", label: "本人と家族の希望が違う" },
      { value: "not_yet", label: "まだ聞けていない" },
      { value: "difficult", label: "確認が難しい" },
    ],
  },
  {
    id: "family_agreement",
    title: "家族の間で方針はまとまっていますか。",
    options: [
      { value: "mostly", label: "おおむねまとまっている" },
      { value: "partial_diff", label: "一部意見が違う" },
      { value: "major_diff", label: "大きく意見が分かれている" },
      { value: "not_discussed", label: "まだ話し合っていない" },
    ],
  },
  {
    id: "concerns",
    title: "現在の主な悩みは何ですか。",
    hint: "あてはまるものをすべて選んでください（複数選択可）。",
    multiple: true,
    options: [
      { value: "after_discharge", label: "退院後の暮らし" },
      { value: "home_life", label: "自宅での生活" },
      { value: "facility", label: "施設や住み替え" },
      { value: "cost", label: "費用" },
      { value: "home_management", label: "実家の管理" },
      { value: "home_future", label: "実家を残す・貸す・売る判断" },
      { value: "family_roles", label: "家族の役割分担" },
      { value: "who_to_ask", label: "相談先" },
      { value: "other", label: "その他" },
    ],
  },
  {
    id: "vacant_home",
    title: "実家は今後空く可能性がありますか。",
    options: [
      { value: "already_vacant", label: "すでに空いている" },
      { value: "soon_vacant", label: "近く空く予定" },
      { value: "may_return", label: "本人が戻る可能性がある" },
      { value: "family_may_use", label: "家族が住む可能性がある" },
      { value: "unknown", label: "分からない" },
      { value: "not_applicable", label: "該当しない" },
    ],
  },
  {
    id: "professionals_involved",
    title: "現在関わっている専門職はいますか。",
    hint: "あてはまるものをすべて選んでください（複数選択可）。",
    multiple: true,
    options: [
      { value: "hospital_staff", label: "病院の相談員" },
      { value: "care_manager", label: "ケアマネジャー" },
      { value: "community_center", label: "地域包括支援センター" },
      { value: "facility_staff", label: "施設相談員" },
      { value: "specialist", label: "士業（弁護士・司法書士・税理士など）" },
      { value: "real_estate", label: "不動産会社" },
      { value: "none", label: "特にいない" },
      { value: "other", label: "その他" },
    ],
  },
  {
    id: "want_to_know",
    title: "今、一番知りたいことは何ですか。",
    options: [
      { value: "now", label: "今すぐ確認すべきこと" },
      { value: "family_talk", label: "家族で話すべきこと" },
      { value: "ask_professional", label: "専門職へ聞くべきこと" },
      { value: "home_order", label: "実家について考える順番" },
      { value: "cost_items", label: "費用について考える項目" },
      { value: "where_to_ask", label: "相談先" },
    ],
  },
];
