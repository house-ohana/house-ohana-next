import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "調査・研究に関する方針",
  description:
    "House OHANAが行う調査・研究に関する方針です。調査参加は任意であり、サービス利用の条件にはしません。営業目的と研究目的を区分して運営します。",
};

const policies = [
  "調査への参加は任意です。",
  "調査への参加を、House OHANAのサービス利用の条件にはしません。",
  "調査の目的と利用範囲は、事前にご説明します。",
  "必要以上の個人情報は収集しません。",
  "結果は、個人が特定されない形で集計します。",
  "調査で得た情報を、営業リストとして利用することはありません。",
  "研究目的と商業目的は区分して取り扱います。",
  "大学等との共同研究を行う場合は、必要な倫理手続きを確認します。",
  "運営者や関係事業者の利益相反がある場合は、開示します。",
  "調査結果は、可能な範囲で社会へ還元することを目指します。",
];

export default function ResearchPage() {
  return (
    <div>
      <PageHero
        eyebrow="Research"
        title="調査・研究に関する方針"
        description="House OHANAは、大学・研究者・行政・地域団体の皆さまと、本人と家族の住まいの意思決定に関する調査・研究についての情報交換を受け付けています。"
      />

      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-14 sm:px-8">
        <p className="text-base leading-loose text-ohana-gray sm:text-lg">
          現時点で、特定の大学・研究機関との共同研究や公式な連携があるわけではありません。今後、調査・研究を行う場合は、次の方針に沿って進めます。
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
