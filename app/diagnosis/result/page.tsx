import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import DiagnosisResultSections from "@/components/DiagnosisResultSections";
import DiagnosisInvalid from "@/components/DiagnosisInvalid";
import DiagnosisResultSectionsPre from "@/components/DiagnosisResultSectionsPre";
import DiagnosisInvalidPre from "@/components/DiagnosisInvalidPre";
import ScrollToTopOnMount from "@/components/ScrollToTopOnMount";
import { buildPostResultPath, decodePostParams, type PostSearchParams } from "@/lib/diagnosis/post/schema";
import { buildPostResult } from "@/lib/diagnosis/post/logic";
import { buildPreResultPath, decodePreParams } from "@/lib/diagnosis/pre/schema";
import { buildPreResult } from "@/lib/diagnosis/pre/logic";
import { resolveDiagnosisMode } from "@/lib/diagnosis/mode";

// このページの内容はURLの回答コードによって変わるが、タイトル・説明文・OGP情報は
// 回答にかかわらず常に一般的な内容に固定する(診断結果をメタデータへ含めない)。
// noindexは検索結果に載せないための設定であり、プライバシー保護のためのものではない
// (URLを知っている第三者は引き続きページを閲覧できる)。
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
  searchParams: Promise<PostSearchParams>;
};

export default async function DiagnosisResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const mode = resolveDiagnosisMode(params.m);

  if (mode === "invalid") {
    return (
      <div>
        <ScrollToTopOnMount />
        <PageHero eyebrow="Diagnosis" title="3分整理ナビの結果" compact />
        <DiagnosisInvalid reason="invalid_mode" />
      </div>
    );
  }

  if (mode === "pre") {
    const decoded = decodePreParams(params);

    if (!decoded.ok) {
      return (
        <div>
          <ScrollToTopOnMount />
          <PageHero eyebrow="Diagnosis" title="3分整理ナビの結果" compact />
          <DiagnosisInvalidPre reason={decoded.reason} />
        </div>
      );
    }

    const preResult = buildPreResult(decoded.who, decoded.answers);
    // 受け取ったクエリをそのまま使わず、検証済みの回答から正規のパスを組み立て直す
    // (余計なパラメータを含めない、URLを必要以上に長くしないため)
    const resultPath = buildPreResultPath(decoded.who, decoded.answers, decoded.version);

    return (
      <div>
        <ScrollToTopOnMount />
        <PageHero eyebrow="Diagnosis" title="3分整理ナビの結果" compact />
        <section className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
          <DiagnosisResultSectionsPre result={preResult} resultPath={resultPath} />
        </section>
      </div>
    );
  }

  const decoded = decodePostParams(params);

  if (!decoded.ok) {
    return (
      <div>
        <ScrollToTopOnMount />
        <PageHero eyebrow="Diagnosis" title="3分整理ナビの結果" compact />
        <DiagnosisInvalid reason={decoded.reason} />
      </div>
    );
  }

  const result = buildPostResult(decoded.answers);
  // 受け取ったクエリをそのまま使わず、検証済みの回答から正規のパスを組み立て直す
  const resultPath = buildPostResultPath(decoded.answers);

  return (
    <div>
      <ScrollToTopOnMount />
      <PageHero eyebrow="Diagnosis" title="3分整理ナビの結果" compact />
      <section className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8 sm:py-8">
        <DiagnosisResultSections result={result} resultPath={resultPath} />
      </section>
    </div>
  );
}
