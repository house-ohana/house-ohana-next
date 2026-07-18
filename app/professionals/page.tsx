import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import PrimaryButton from "@/components/PrimaryButton";

export const metadata: Metadata = {
  title: "専門職・研究者・行政の方へ",
  description:
    "House OHANAは、本人と家族の住まいの意思決定について、医療・介護・福祉・研究・行政の立場からの情報交換を受け付けています。営業目的の紹介や送客は行いません。",
};

function List({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-base leading-loose text-ohana-ink">
          <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-ohana-green" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const audience = [
  "病院の退院支援担当者",
  "医療ソーシャルワーカー",
  "ケアマネジャー",
  "地域包括支援センター職員",
  "訪問看護師",
  "施設相談員",
  "社会福祉士",
  "大学研究者",
  "行政職員",
  "地域活動関係者",
];

const inScope = [
  "本人と家族の希望整理",
  "家族会議の準備",
  "退院後の住まいと残る実家の論点整理",
  "家族向け資料の作成",
  "専門職へ確認する質問の整理",
  "地域向け講座や情報資料",
  "調査・研究に関する意見交換",
];

const outOfScope = [
  "医療判断",
  "ケアプラン作成",
  "法律・税務判断",
  "特定施設への誘導",
  "不動産・保険の営業",
  "専門職からの患者・利用者情報の無断取得",
];

const principles = [
  "専門職や公的機関へ、紹介料や謝礼を支払いません",
  "「相談者をご紹介ください」という営業は行いません",
  "本人の同意なく情報を共有しません",
  "患者や利用者が特定できる情報を、同意なく問い合わせフォームへ入力させません",
  "架空の医療連携、大学連携、行政連携は表示しません",
  "特定の商品や取引を前提に情報整理を行いません",
];

export default function ProfessionalsPage() {
  return (
    <div>
      <PageHero
        eyebrow="For Professionals"
        title="専門職・研究者・行政の方へ"
        description="本人と家族の住まいの意思決定について、情報交換を受け付けています。"
      />

      <div className="mx-auto flex max-w-3xl flex-col gap-16 px-5 py-14 sm:px-8">
        <section className="flex flex-col gap-4">
          <SectionHeading title="想定している対象の方" />
          <div className="grid gap-2 sm:grid-cols-2">
            {audience.map((item) => (
              <p key={item} className="rounded-lg bg-ohana-beige px-4 py-3 text-sm text-ohana-ink sm:text-base">
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="House OHANAの対応範囲" />
          <List items={inScope} />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="House OHANAが対応しない範囲" />
          <List items={outOfScope} />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="運営原則" />
          <List items={principles} />
        </section>

        <section className="flex flex-col gap-6 rounded-2xl bg-ohana-green-light p-8">
          <p className="text-lg font-bold leading-loose text-ohana-ink">
            資料の作成方法や、地域での連携の可能性について、情報交換から始めませんか。
          </p>
          <div>
            <PrimaryButton href="/contact">情報交換・資料作成について相談する</PrimaryButton>
          </div>
        </section>
      </div>
    </div>
  );
}
