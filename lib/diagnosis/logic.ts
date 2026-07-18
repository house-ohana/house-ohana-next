import type { DiagnosisAnswers, DiagnosisSummary } from "./types";

/**
 * 「3分整理ナビ」機能の結果ロジック。
 *
 * これは医療・介護・法律・税務・不動産の判断を行うものではありません。
 * 回答に応じて「確認するとよいこと」を並べ替えるだけの、簡易なルールベースです。
 * 断定的な結論（「施設が適切」「自宅復帰は無理」等）は出力しない方針です。
 * ロジックを調整したい場合は、このファイルの条件分岐のみを編集してください。
 */

function has(answers: DiagnosisAnswers, questionId: string, value: string): boolean {
  return answers[questionId]?.includes(value) ?? false;
}

function pushUnique(list: string[], text: string) {
  if (!list.includes(text)) list.push(text);
}

export function buildDiagnosisSummary(answers: DiagnosisAnswers): DiagnosisSummary {
  const now: string[] = [
    "現在分かっている情報（本人の状態、退院や住み替えの希望時期など）を、家族間で共有できるメモにまとめる",
  ];
  const family: string[] = [
    "本人がどこで、どのように暮らしたいと考えているかを、家族で確認する機会をつくる",
  ];
  const professional: string[] = [
    "現在関わっている、またはこれから関わる可能性のある専門職に、今後の相談方法を確認する",
  ];
  const later: string[] = [
    "実家の活用方法など、今すぐ結論を出さなくてもよいことを書き出しておく",
  ];

  // Q1 現在の居場所
  if (has(answers, "location", "hospital")) {
    pushUnique(now, "退院支援担当者・医療ソーシャルワーカーに、退院後の生活について相談できる窓口を確認する");
  }
  if (has(answers, "location", "facility")) {
    pushUnique(family, "現在の施設での暮らしが本人の希望に合っているか、家族で振り返る機会をつくる");
  }
  if (has(answers, "location", "home")) {
    pushUnique(family, "自宅での生活を続ける場合に、家族がどこまで支援できるかを話し合う");
  }

  // Q2 期限
  if (has(answers, "deadline", "within_week")) {
    pushUnique(now, "退院・住み替えの期日を、病院・施設・家族の間で共有できているか確認する");
  }
  if (has(answers, "deadline", "within_month") || has(answers, "deadline", "within_3months")) {
    pushUnique(now, "期限までに決めることと、その後に決めればよいことを分けて整理する");
  }

  // Q3 本人の希望
  if (
    has(answers, "wish_confirmed", "not_yet") ||
    has(answers, "wish_confirmed", "difficult") ||
    has(answers, "wish_confirmed", "differs")
  ) {
    pushUnique(family, "本人の希望をどのように確認するか、無理のない方法を家族で話し合う");
  }
  if (has(answers, "wish_confirmed", "differs")) {
    pushUnique(family, "本人と家族で希望が異なる場合、どちらかに決めつけず、話し合う機会を設ける");
  }

  // Q4 家族の方針
  if (has(answers, "family_agreement", "partial_diff") || has(answers, "family_agreement", "major_diff")) {
    pushUnique(family, "家族全員で話す機会を、いつ・誰が呼びかけて作るかを決める");
  }
  if (has(answers, "family_agreement", "not_discussed")) {
    pushUnique(family, "まずは家族の間で、現状と気になっていることを共有する時間をつくる");
  }

  // Q5 現在の悩み(複数選択)
  if (has(answers, "concerns", "after_discharge")) {
    pushUnique(now, "退院後の生活について、病院の相談窓口や地域包括支援センターに相談する");
  }
  if (has(answers, "concerns", "home_life")) {
    pushUnique(professional, "自宅での生活に必要な支援（訪問看護・介護サービスなど）について、ケアマネジャー等に確認する");
  }
  if (has(answers, "concerns", "facility")) {
    pushUnique(professional, "施設や住み替えを検討する場合、立地・費用・医療対応などの比較ポイントを施設相談員に確認する");
  }
  if (has(answers, "concerns", "cost")) {
    pushUnique(now, "施設・医療・介護にかかる費用の見込みを確認する");
    pushUnique(professional, "費用の内訳について、ケアマネジャーや施設相談員に確認する");
  }
  if (has(answers, "concerns", "home_management")) {
    pushUnique(later, "実家の管理方法（維持費や空き家管理など）は、時間をかけて検討することもできる");
  }
  if (has(answers, "concerns", "home_future")) {
    pushUnique(
      later,
      "実家を残す・貸す・売るという判断は、今すぐ決めなくてもよい場合があります。まず本人や家族の意向を整理しましょう",
    );
    pushUnique(professional, "実家の活用方法について、不動産や法律の専門家に相談するタイミングを確認する");
  }
  if (has(answers, "concerns", "family_roles")) {
    pushUnique(family, "家族の間で、誰が何を担当するかを話し合う");
  }
  if (has(answers, "concerns", "who_to_ask")) {
    pushUnique(professional, "相談先に迷う場合は、地域包括支援センターに問い合わせる");
  }

  // Q6 実家が空く可能性
  if (has(answers, "vacant_home", "already_vacant") || has(answers, "vacant_home", "soon_vacant")) {
    pushUnique(later, "空く実家の当面の管理方法（換気・郵便物の確認など）を決めておく");
  }
  if (has(answers, "vacant_home", "may_return")) {
    pushUnique(family, "本人が自宅に戻る可能性を、どの程度残しておきたいか家族で話し合う");
  }
  if (has(answers, "vacant_home", "family_may_use")) {
    pushUnique(family, "実家を家族が使う可能性がある場合、誰が・いつ使うかを話し合う");
  }

  // Q7 関わっている専門職(複数選択)
  if (has(answers, "professionals_involved", "none")) {
    pushUnique(now, "地域包括支援センターや病院の相談窓口に連絡し、相談できる専門職を確認する");
  }
  if (has(answers, "professionals_involved", "care_manager")) {
    pushUnique(professional, "ケアマネジャーに、今後の生活プランについて相談する");
  }
  if (has(answers, "professionals_involved", "hospital_staff")) {
    pushUnique(professional, "病院の相談員に、退院後の選択肢について相談する");
  }
  if (has(answers, "professionals_involved", "real_estate")) {
    pushUnique(later, "実家について不動産会社へ相談するかどうかは、家族の意向がまとまってからでも遅くありません");
  }

  // Q8 一番知りたいこと
  if (has(answers, "want_to_know", "home_order")) {
    pushUnique(
      later,
      "実家についての検討は、本人の意向の確認、家族の合意、専門職への相談、の順に進めると整理しやすくなります",
    );
  }
  if (has(answers, "want_to_know", "cost_items")) {
    pushUnique(now, "費用については、医療費・介護費・施設費・実家の維持費に分けて確認する");
  }
  if (has(answers, "want_to_know", "where_to_ask")) {
    pushUnique(professional, "相談先に迷う場合、地域包括支援センターがはじめの窓口になることがあります");
  }

  return { now, family, professional, later };
}
