import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Notice from "@/components/Notice";
import ContactForm from "@/components/ContactForm";
import type { PostSearchParams } from "@/lib/diagnosis/post/schema";
import { parseAnyDiagnosisResultPath } from "@/lib/diagnosis/resultLink";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "House OHANAへのお問い合わせページです。ご家族・ご本人、医療・介護・福祉の専門職、研究者、行政・地域団体の方など、お立場に応じてご相談内容をお送りいただけます。",
};

type Props = {
  searchParams: Promise<PostSearchParams>;
};

export default async function ContactPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawResult = Array.isArray(params.result) ? params.result[0] : params.result;
  // "result" は診断結果ページの相対パスのみを受け付ける（診断内容そのものは引き継がない）。
  // 結果ページの「この結果をもとに相談する」ボタンが明示的にこのクエリパラメータを付与する。
  const diagnosisResultPath = parseAnyDiagnosisResultPath(rawResult);

  return (
    <div>
      <PageHero
        eyebrow="Contact"
        title="お問い合わせ"
        description="お問い合わせの種類に応じて、入力いただく項目が変わります。まずは、あてはまるものをお選びください。"
      />

      <section className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-12 sm:px-8">
        <Notice title="緊急のご相談について" tone="caution">
          House
          OHANAは、緊急の医療相談や救急対応を行う窓口ではありません。生命や身体に緊急性がある場合は、医療機関や公的な緊急窓口へご連絡ください。また、House
          OHANAは、医療・介護・法律・税務上の判断、不動産の査定・仲介、保険の募集を行う窓口ではありません。
        </Notice>

        <ContactForm diagnosisResultPath={diagnosisResultPath} />

        <p className="text-sm leading-loose text-ohana-gray">
          JavaScriptが利用できない環境でも、フォームの送信は可能です。送信後は完了ページが表示されます。
        </p>
      </section>
    </div>
  );
}
