import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import DiagnosisWizard from "@/components/DiagnosisWizard";
import DiagnosisWizardPre from "@/components/DiagnosisWizardPre";
import DiagnosisModeSelect from "@/components/DiagnosisModeSelect";
import type { DiagnosisSearchParams } from "@/lib/diagnosis/schema";

export const metadata: Metadata = {
  title: "3分整理ナビ",
  description:
    "これからの暮らしについて、今の状況を確認できます。今すぐ対応が必要な方も、これからに備えたい方も。医療・介護・法律・不動産の診断や判定ではありません。",
};

type Props = {
  searchParams: Promise<DiagnosisSearchParams>;
};

export default async function DiagnosisPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawMode = Array.isArray(params.m) ? params.m[0] : params.m;

  return (
    <div>
      <PageHero
        eyebrow="Diagnosis"
        title="3分整理ナビ"
        description="いくつかの質問にお答えいただくと、今の状況を整理してご案内します。医療・介護・法律・税務・不動産の診断や判定ではありません。"
      />
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        {rawMode === undefined ? (
          <DiagnosisModeSelect />
        ) : rawMode === "pre" ? (
          <DiagnosisWizardPre />
        ) : (
          <DiagnosisWizard />
        )}
      </section>
    </div>
  );
}
