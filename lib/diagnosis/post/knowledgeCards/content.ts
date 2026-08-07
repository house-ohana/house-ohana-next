import type { KnowledgeCardContent } from "./types";

/**
 * Phase4.1「見落としやすい崖」3カードの固定content。
 * 表示条件・reasonId・rank・urgency・enabledは持たない（docs/03 第4章）。
 * sources/verifiedAt/reviewByは、docs/reviews/phase4.1-knowledge-card-source-review.md
 * （2026-08-06レビュー）で採用された公的資料・確認日を登録したものである。
 */

export const DISCHARGE_SUPPORT_START_GAP: KnowledgeCardContent = {
  id: "discharge_support_start_gap",
  title: "退院後の生活サポートに空白がないか確認しましょう",
  cliff:
    "退院後の移動手段や見守り、医療・介護など、生活に必要なサポートが退院当日から始まる予定になっていますか？必要なサポートが途切れる期間がないか、退院前に確認しましょう。",
  checkItems: [
    "退院当日の移動手段は決まっていますか",
    "退院当日から数日間、誰が支える予定ですか",
    "医療・介護など、必要なサポートはいつから始まりますか",
    "まだ決まっていないことについて、誰が・いつまでに確認しますか",
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
  title: "家族による費用負担がいつ必要になるかも確認しておきましょう",
  cliff:
    "毎月の収入と支出だけでなく、一時的に発生する費用や、家族による費用負担がいつ必要になるかも確認しておきましょう。今後3か月間の支出を月ごとに整理すると、支払いがかさなる時期を把握しやすくなります。",
  checkItems: [
    "毎月入ってくるお金はいくらですか",
    "毎月かかる支出はいくらですか",
    "その月だけかかる特別な支出はありますか",
    "家族による費用負担は、いつから必要になりそうですか",
  ],
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
  title: "家のことを進める前に、名義と本人の意向を確認しましょう",
  cliff:
    "家をどうするか具体的に進める前に、登記上の名義と本人の意向を確認しましょう。確認できていない点がある場合は、手続きや相談を進める前に整理しておきましょう。",
  checkItems: [
    "登記上の名義は誰になっていますか",
    "共有名義の場合、共有者は誰ですか",
    "本人にはどう説明していて、本人はどう考えていますか",
    "契約を進める前に、誰に相談しますか",
  ],
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
