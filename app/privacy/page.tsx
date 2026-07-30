import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "House OHANAにおける個人情報の取り扱いについて説明します。運営者が個人事業として行う保険・不動産業務とは別に定めています。",
};

const purposes = [
  "お問い合わせへの対応",
  "意思決定支援",
  "家族向け資料の作成",
  "サービスの改善",
  "本人が同意した範囲での調査・集計",
  "専門職等との情報交換",
];

const rules = [
  "運営者が個人事業として行う保険・不動産営業へ、自動的に利用することはありません。",
  "House OHANA以外の事業へ情報を提供する場合は、その都度、別途同意を取得します。",
  "法令上必要な場合を除き、本人の同意なく第三者へ提供することはありません。",
  "取得した情報を、あらかじめ説明した利用目的を超えて使用することはありません。",
  "「今すぐ状況を整理」機能でのご回答は、原則としてサーバーへ保存しません。",
  "お問い合わせいただいた情報を調査・研究に利用する場合は、必要に応じて別途同意を取得します。",
];

export default function PrivacyPage() {
  const { operator } = siteConfig;
  const hasContact = operator.email || operator.postalAddress || operator.legalName;

  return (
    <div>
      <PageHero eyebrow="Privacy" title="プライバシーポリシー" />

      <div className="mx-auto flex max-w-3xl flex-col gap-16 px-5 py-14 sm:px-8">
        <p className="text-base leading-loose text-ohana-gray sm:text-lg">
          本ポリシーは、House
          OHANAのウェブサイトおよび意思決定支援サービスにおける個人情報の取り扱いについて定めるものです。運営者が別途個人事業として行う保険・不動産業務における個人情報の取り扱いとは、別に定めています。
        </p>

        <section className="flex flex-col gap-4">
          <SectionHeading title="利用目的" />
          <ul className="flex flex-col gap-2">
            {purposes.map((item) => (
              <li key={item} className="flex gap-2 text-base leading-loose text-ohana-ink">
                <span
                  className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-ohana-green"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="第三者提供・目的外利用について" />
          <ul className="flex flex-col gap-3">
            {rules.map((item) => (
              <li key={item} className="rounded-xl bg-ohana-beige p-5 text-base leading-loose text-ohana-ink">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="状況整理機能（今すぐ状況を整理）について" />
          <p className="text-base leading-loose text-ohana-gray">
            このページでのご回答は、氏名や住所等を伴わない形式であり、ブラウザ上の一時的な状態として処理されます。回答内容をサーバーへ送信・保存することや、URLに含めることはありません。
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="お問い合わせフォームについて" />
          <p className="text-base leading-loose text-ohana-gray">
            お問い合わせフォームでお送りいただいた情報は、Netlify
            Forms（フォーム送信を処理する外部サービス）を通じて受け付けます。送信いただいた内容は、上記の利用目的の範囲でのみ使用します。
          </p>
        </section>

        {hasContact ? (
          <section className="flex flex-col gap-2">
            <SectionHeading title="お問い合わせ窓口" />
            <div className="text-base leading-loose text-ohana-ink">
              {operator.legalName ? <p>{operator.legalName}</p> : null}
              {operator.postalAddress ? <p>{operator.postalAddress}</p> : null}
              {operator.email ? <p>{operator.email}</p> : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
