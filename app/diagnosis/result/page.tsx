import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import DiagnosisResultSections from "@/components/DiagnosisResultSections";
import DiagnosisInvalid from "@/components/DiagnosisInvalid";
import { buildDiagnosisResultPath, decodeDiagnosisParams, type DiagnosisSearchParams } from "@/lib/diagnosis/schema";
import { buildDiagnosisSummary } from "@/lib/diagnosis/logic";

// このページの内容はURLの回答コードによって変わるが、タイトル・説明文・OGP情報は
// 回答にかかわらず常に一般的な内容に固定する（診断結果をメタデータへ含めない）。
// noindexは検索結果に載せないための設定であり、プライバシー保護のためのものではない
// （URLを知っている第三者は引き続きページを閲覧できる）。
export const metadata: Metadata = {
  title: "3分整理ナビの結果",
  description: "ご家族の現在の状況と、次に確認したいことを整理したページです。",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "3分整理ナビの結果｜House OHANA",
    description: "ご家族の現在の状況と、次に確認したいことを整理したページです。",
  },
};

type Props = {
  searchParams: Promise<DiagnosisSearchParams>;
};

export default async function DiagnosisResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const decoded = decodeDiagnosisParams(params);

  if (!decoded.ok) {
    return (
      <div>
        <PageHero eyebrow="Diagnosis" title="3分整理ナビの結果" />
        <DiagnosisInvalid reason={decoded.reason} />
      </div>
    );
  }

  const summary = buildDiagnosisSummary(decoded.answers);
  // 受け取ったクエリをそのまま使わず、検証済みの回答から正規のパスを組み立て直す
  // （余計なパラメータを含めない、URLを必要以上に長くしないため）
  const resultPath = buildDiagnosisResultPath(decoded.answers, decoded.version);

  return (
    <div>
      <PageHero eyebrow="Diagnosis" title="3分整理ナビの結果" />
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <DiagnosisResultSections summary={summary} resultPath={resultPath} />
      </section>
    </div>
  );
}
