import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import DiagnosisWizard from "@/components/DiagnosisWizard";

export const metadata: Metadata = {
  title: "3分整理ナビ",
  description:
    "親の退院、住み替え、施設入居、残る実家について、今の状況を8つの質問で整理します。医療・介護・法律・税務・不動産の診断や判定ではありません。",
};

export default function DiagnosisPage() {
  return (
    <div>
      <PageHero
        eyebrow="Diagnosis"
        title="3分整理ナビ"
        description="いくつかの質問にお答えいただくと、今すぐ確認すること、家族で話し合うこと、専門職へ確認すること、後から検討できることを整理してご案内します。"
      />
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <DiagnosisWizard />
      </section>
    </div>
  );
}
