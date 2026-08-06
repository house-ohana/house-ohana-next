import type { KnowledgeCardContent } from "./types";

/**
 * Phase4.1「見落としやすい崖」3カードの固定content。
 * 表示条件・reasonId・rank・urgency・enabledは持たない（docs/03 第4章）。
 * sources/verifiedAt/reviewByは、docs/reviews/phase4.1-knowledge-card-source-review.md
 * （2026-08-06レビュー）で採用された公的資料・確認日を登録したものである。
 */

export const DISCHARGE_SUPPORT_START_GAP: KnowledgeCardContent = {
  id: "discharge_support_start_gap",
  title: "退院後の支援は、退院日と同じ日に始まるとは限りません",
  cliff:
    "退院後に必要な移動、見守り、医療・介護・生活支援が、退院当日からすべて始まるとは限りません。最初の数日に支援の空白がないかを、退院前に確認します。",
  checkItems: [
    "退院当日の移動手段",
    "退院当日から最初の数日を誰が支えるか",
    "医療・介護・生活支援が始まる日",
    "まだ決まっていない事項の担当者と確認期限",
  ],
  linkedContactIds: ["hospital", "regional_support", "care_manager"],
  sources: [
    {
      title: "疾病・事業及び在宅医療に係る医療体制について",
      organization: "厚生労働省",
      url: "https://www.mhlw.go.jp/web/t_doc?dataId=00tc7580&dataType=1&pageNo=7",
      accessedAt: "2026-08-06",
    },
    {
      title: "令和7年度地域の在宅医療の体制整備に向けた調査・連携支援事業",
      organization: "厚生労働省",
      url: "https://www.mhlw.go.jp/stf/newpage_72086.html",
      accessedAt: "2026-08-06",
    },
  ],
  verifiedAt: "2026-08-06",
  reviewBy: "2027-02-06",
};

export const TRANSITION_MONTHLY_CASH_GAP: KnowledgeCardContent = {
  id: "transition_monthly_cash_gap",
  title: "家族が費用を負担する可能性がある場合でも、総額だけでは、負担する時期までは分かりません",
  cliff:
    "家族が費用を負担する可能性がある場合でも、総額だけでは、支払いが重なる月や家族の立替えが始まる時期までは分かりません。今後3か月を月ごとに分けて確認します。",
  checkItems: ["毎月入るお金", "毎月続く支出", "その月だけ発生する支出", "家族が支払う予定の費用と開始月"],
  linkedContactIds: ["fp"],
  sources: [
    {
      title: "サービスにかかる利用料",
      organization: "厚生労働省（介護サービス情報公表システム）",
      url: "https://www.kaigokensaku.mhlw.go.jp/commentary/fee.html",
      accessedAt: "2026-08-06",
    },
    {
      title: "介護サービスにかかる概算の料金を知りたい",
      organization: "厚生労働省（介護サービス情報公表システム）",
      url: "https://www.kaigokensaku.mhlw.go.jp/help/page6.html",
      accessedAt: "2026-08-06",
    },
    {
      title: "ライフプランシミュレーター",
      organization: "金融庁",
      url: "https://www.fsa.go.jp/policy/nisa2/lifeplan-simulator/",
      accessedAt: "2026-08-06",
    },
  ],
  verifiedAt: "2026-08-06",
  reviewBy: "2027-02-06",
};

export const HOME_OWNERSHIP_INTENT_GAP: KnowledgeCardContent = {
  id: "home_ownership_intent_gap",
  title: "家の方針が決まっても、名義と本人の意向が揃っているとは限りません",
  cliff:
    "売却・賃貸・解体などの方向が決まっていても、名義、共有者、本人の理解・意向など、手続きの前提となる確認事項が残っている可能性があります。",
  checkItems: ["登記上の名義", "共有名義の場合の共有者", "本人へ説明した内容と本人の意向", "契約前に確認する専門家"],
  linkedContactIds: ["legal"],
  sources: [
    {
      title: "不動産登記のABC",
      organization: "法務省",
      url: "https://www.moj.go.jp/MINJI/minji02",
      accessedAt: "2026-08-06",
    },
    {
      title: "登記の申請を御検討されている皆さまへ",
      organization: "法務局",
      url: "https://houmukyoku.moj.go.jp/homu/page_000001_00051.html",
      accessedAt: "2026-08-06",
    },
    {
      title: "COLUMN 高齢者の認知機能障害に応じた消費者トラブルと対応策の検討に関する研究（令和5年版消費者白書）",
      organization: "消費者庁",
      url: "https://www.caa.go.jp/policies/policy/consumer_research/white_paper/2023/white_paper_column_03.html",
      accessedAt: "2026-08-06",
    },
  ],
  verifiedAt: "2026-08-06",
  reviewBy: "2027-02-06",
};

export const KNOWLEDGE_CARD_CONTENTS: readonly KnowledgeCardContent[] = [
  DISCHARGE_SUPPORT_START_GAP,
  TRANSITION_MONTHLY_CASH_GAP,
  HOME_OWNERSHIP_INTENT_GAP,
];
