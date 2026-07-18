/**
 * House OHANA サイト全体の設定ファイル。
 *
 * 運営者情報など、まだ確定していない項目は空文字列 / 空配列のままにしています。
 * 空の項目は各コンポーネント側で「表示自体を省略する」仕様のため、
 * 画面上に "TODO" や空欄は表示されません。
 *
 * TODO: 実際の運営者情報が確定したら、下記の operator オブジェクトを更新してください。
 */

export type SnsLink = {
  label: string;
  url: string;
};

export const siteConfig = {
  name: "House OHANA",
  shortName: "House OHANA",
  tagline: "人生の後半も、好きな場所で、自分らしく。",
  subTagline: "その願いを、家族だけの負担にしない。",
  description:
    "親の退院や施設入居に伴う、次の住まいと残る実家について、ご本人とご家族が納得して決めるための情報整理を支援します。",

  // TODO: 本番公開時に、実際のドメインを環境変数 NEXT_PUBLIC_SITE_URL に設定してください。
  url: process.env.NEXT_PUBLIC_SITE_URL || "",

  // House OHANAが現在活動を開始している中心エリア。
  // 「地域限定サービス」に読めないよう、文言は各ページ側で補足しています。
  serviceArea: {
    primary: "湘南エリア",
  },

  // 運営者情報。TODO: 確定した情報のみを入力してください。未入力の項目は自動的に非表示になります。
  operator: {
    legalName: "", // TODO: 法人名（法人化前は屋号・団体名など）
    representativeName: "", // TODO: 代表者名
    postalAddress: "", // TODO: 所在地
    phone: "", // TODO: 電話番号
    email: "", // TODO: 問い合わせ用メールアドレス
    businessHours: "", // TODO: 対応可能な曜日・時間帯
    bio: "", // TODO: 運営者略歴
    qualifications: [] as string[], // TODO: 保有資格（例: ["宅地建物取引士", "FP技能士"] など事実のみ）
    corporateNumber: "", // TODO: 法人番号
    sns: [] as SnsLink[], // TODO: 公式SNSアカウント（{ label: "X", url: "https://..." } の形式）
    logoPath: "", // TODO: ロゴ画像のパス（例: "/logo.svg"）。未設定の間はテキストロゴを使用します。
  },

  copyrightYear: 2026,
} as const;

export type SiteConfig = typeof siteConfig;
