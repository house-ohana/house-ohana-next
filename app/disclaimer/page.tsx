import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "免責事項",
  description:
    "House OHANAのウェブサイトおよび状況整理機能に関する免責事項です。医療・介護・法律・税務上の判断は、各専門職・専門家へご確認ください。",
};

const items = [
  "このサイトは、親の暮らしに関する状況を整理するための、一般的な情報提供を目的としています。",
  "医療上の判断が必要な場合は、医師や医療機関にご確認ください。",
  "介護サービスやケアプランについては、ケアマネジャー等の専門職にご確認ください。",
  "法律、税務、登記に関する判断は、弁護士、税理士、司法書士など各資格者にご確認ください。",
  "適切な選択肢は、それぞれのご家庭の状況によって異なります。",
  "「今すぐ状況を整理」機能の結果は、個別の診断や判断ではなく、確認事項を整理した参考情報です。",
  "House OHANAは、特定の施設、不動産取引、保険契約をお勧めしたり、求めたりするものではありません。",
  "本人とご家族の意思を尊重することを、サイト運営の基本的な姿勢としています。",
  "掲載している情報は、更新時期によって、制度や地域の情報が変更されている場合があります。",
];

export default function DisclaimerPage() {
  return (
    <div>
      <PageHero eyebrow="Disclaimer" title="免責事項" />

      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-14 sm:px-8">
        <p className="text-base leading-loose text-ohana-gray sm:text-lg">
          House
          OHANAのウェブサイトをご利用いただくにあたり、あらかじめ次の内容をご確認ください。個別の状況に応じたご判断については、それぞれの専門職・専門家にご相談いただきますようお願いいたします。
        </p>

        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item} className="rounded-xl bg-ohana-beige p-5 text-base leading-loose text-ohana-ink">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
