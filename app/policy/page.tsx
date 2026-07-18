import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "House OHANAの運営方針",
  description:
    "House OHANAの運営方針と事業主体について説明します。運営者が個人事業として行う保険・不動産業務とは別事業であることを明記しています。",
};

const policies = [
  "House OHANAは、意思決定支援、情報整理、調査・研究、地域連携を行います。",
  "運営者が個人事業として行う保険・不動産業務とは、別の事業として運営しています。",
  "House OHANAへのご相談が、自動的に保険・不動産の営業へ移行することはありません。",
  "House OHANAで取得した情報を、本人の同意なく個人事業へ共有することはありません。",
  "個人事業のご利用は、House OHANAの支援を受ける条件ではありません。",
  "ご家族は、他の不動産会社、保険代理店、士業、施設などを自由にお選びいただけます。",
  "外部サービスへ情報を共有する場合は、共有先、目的、内容を説明し、別途同意を取得します。",
  "House OHANAが、特定の事業者との契約を強制することはありません。",
];

export default function PolicyPage() {
  return (
    <div>
      <PageHero eyebrow="Policy" title="House OHANAの運営方針" />

      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-14 sm:px-8">
        <p className="text-base leading-loose text-ohana-gray sm:text-lg">
          House
          OHANAは、特定の商品や契約を前提とせず、複数の選択肢を整理することを大切にしています。運営にあたって、次の方針を掲げています。
        </p>

        <ul className="flex flex-col gap-4">
          {policies.map((item) => (
            <li key={item} className="rounded-xl bg-ohana-beige p-5 text-base leading-loose text-ohana-ink">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
