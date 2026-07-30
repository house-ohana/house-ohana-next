import type { DiagnosisAnswers, DiagnosisResult, DiagnosisSummary } from "./types";

/**
 * 「3分整理ナビ」機能の結果ロジック。
 *
 * これは医療・介護・法律・税務・不動産の判断を行うものではありません。
 * 回答に応じて「確認するとよいこと」を並べ替えるだけの、簡易なルールベースです。
 * 断定的な結論（「施設が適切」「自宅復帰は無理」等）は出力しない方針です。
 * ロジックを調整したい場合は、このファイルの条件分岐のみを編集してください。
 *
 * 同じ回答には常に同じ結果を返す（決定論的）。生成AIは使用しない。
 */

function has(answers: DiagnosisAnswers, questionId: string, value: string): boolean {
  return answers[questionId]?.includes(value) ?? false;
}

function hasAny(answers: DiagnosisAnswers, questionId: string, values: string[]): boolean {
  return values.some((value) => has(answers, questionId, value));
}

function takeUnique(candidates: string[], max: number): string[] {
  const result: string[] = [];
  for (const candidate of candidates) {
    if (result.length >= max) break;
    if (!result.includes(candidate)) result.push(candidate);
  }
  return result;
}

const MAX_PERSPECTIVE_ITEMS = 8;

/**
 * 既存の「4つの視点」（今すぐ確認すること／家族で話し合うこと／専門職へ確認すること／
 * 後から検討できること）。結果画面の中心からは外し、下部の補足「詳しく整理すると」で使う。
 * 全体で最大8項目に収める（追加順＝重要度順として、超過分は末尾から間引く）。
 */
export function buildDiagnosisSummary(answers: DiagnosisAnswers): DiagnosisSummary {
  type Bucket = keyof DiagnosisSummary;
  const items: { bucket: Bucket; text: string }[] = [];
  const seen = new Set<string>();

  function add(bucket: Bucket, text: string) {
    const key = `${bucket}:${text}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ bucket, text });
  }

  add("now", "現在分かっている情報（本人の状態、退院や住み替えの希望時期など）を、家族間で共有できるメモにまとめる");
  add("family", "本人がどこで、どのように暮らしたいと考えているかを、家族で確認する機会をつくる");
  add("professional", "現在関わっている、またはこれから関わる可能性のある専門職に、今後の相談方法を確認する");
  add("later", "実家の活用方法など、今すぐ結論を出さなくてもよいことを書き出しておく");

  // Q1 現在の居場所
  if (has(answers, "location", "hospital")) {
    add("now", "退院支援担当者・医療ソーシャルワーカーに、退院後の生活について相談できる窓口を確認する");
  }
  if (has(answers, "location", "facility")) {
    add("family", "現在の施設での暮らしが本人の希望に合っているか、家族で振り返る機会をつくる");
  }
  if (has(answers, "location", "home")) {
    add("family", "自宅での生活を続ける場合に、家族がどこまで支援できるかを話し合う");
  }

  // Q2 期限
  if (has(answers, "deadline", "within_week")) {
    add("now", "退院・住み替えの期日を、病院・施設・家族の間で共有できているか確認する");
  }
  if (has(answers, "deadline", "within_month") || has(answers, "deadline", "within_3months")) {
    add("now", "期限までに決めることと、その後に決めればよいことを分けて整理する");
  }

  // Q3 本人の希望
  if (hasAny(answers, "wish_confirmed", ["not_yet", "difficult", "differs"])) {
    add("family", "本人の希望をどのように確認するか、無理のない方法を家族で話し合う");
  }
  if (has(answers, "wish_confirmed", "differs")) {
    add("family", "本人と家族で希望が異なる場合、どちらかに決めつけず、話し合う機会を設ける");
  }

  // Q4 家族の方針
  if (hasAny(answers, "family_agreement", ["partial_diff", "major_diff"])) {
    add("family", "家族全員で話す機会を、いつ・誰が呼びかけて作るかを決める");
  }
  if (has(answers, "family_agreement", "not_discussed")) {
    add("family", "まずは家族の間で、現状と気になっていることを共有する時間をつくる");
  }

  // Q5 現在の悩み(複数選択)
  if (has(answers, "concerns", "after_discharge")) {
    add("now", "退院後の生活について、病院の相談窓口や地域包括支援センターに相談する");
  }
  if (has(answers, "concerns", "home_life")) {
    add("professional", "自宅での生活に必要な支援（訪問看護・介護サービスなど）について、ケアマネジャー等に確認する");
  }
  if (has(answers, "concerns", "facility")) {
    add("professional", "施設や住み替えを検討する場合、立地・費用・医療対応などの比較ポイントを施設相談員に確認する");
  }
  if (has(answers, "concerns", "cost")) {
    add("now", "施設・医療・介護にかかる費用の見込みを確認する");
    add("professional", "費用の内訳について、ケアマネジャーや施設相談員に確認する");
  }
  if (has(answers, "concerns", "home_management")) {
    add("later", "実家の管理方法（維持費や空き家管理など）は、時間をかけて検討することもできる");
  }
  if (has(answers, "concerns", "home_future")) {
    add(
      "later",
      "実家を残す・貸す・売るという判断は、今すぐ決めなくてもよい場合があります。まず本人や家族の意向を整理しましょう",
    );
    add("professional", "実家の活用方法について、不動産や法律の専門家に相談するタイミングを確認する");
  }
  if (has(answers, "concerns", "family_roles")) {
    add("family", "家族の間で、誰が何を担当するかを話し合う");
  }
  if (has(answers, "concerns", "who_to_ask")) {
    add("professional", "相談先に迷う場合は、地域包括支援センターに問い合わせる");
  }

  // Q6 実家が空く可能性
  if (hasAny(answers, "vacant_home", ["already_vacant", "soon_vacant"])) {
    add("later", "空く実家の当面の管理方法（換気・郵便物の確認など）を決めておく");
  }
  if (has(answers, "vacant_home", "may_return")) {
    add("family", "本人が自宅に戻る可能性を、どの程度残しておきたいか家族で話し合う");
  }
  if (has(answers, "vacant_home", "family_may_use")) {
    add("family", "実家を家族が使う可能性がある場合、誰が・いつ使うかを話し合う");
  }

  // Q7 関わっている専門職(複数選択)
  if (has(answers, "professionals_involved", "none")) {
    add("now", "地域包括支援センターや病院の相談窓口に連絡し、相談できる専門職を確認する");
  }
  if (has(answers, "professionals_involved", "care_manager")) {
    add("professional", "ケアマネジャーに、今後の生活プランについて相談する");
  }
  if (has(answers, "professionals_involved", "hospital_staff")) {
    add("professional", "病院の相談員に、退院後の選択肢について相談する");
  }
  if (has(answers, "professionals_involved", "real_estate")) {
    add("later", "実家について不動産会社へ相談するかどうかは、家族の意向がまとまってからでも遅くありません");
  }

  // Q8 一番知りたいこと
  if (has(answers, "want_to_know", "home_order")) {
    add(
      "later",
      "実家についての検討は、本人の意向の確認、家族の合意、専門職への相談、の順に進めると整理しやすくなります",
    );
  }
  if (has(answers, "want_to_know", "cost_items")) {
    add("now", "費用については、医療費・介護費・施設費・実家の維持費に分けて確認する");
  }
  if (has(answers, "want_to_know", "where_to_ask")) {
    add("professional", "相談先に迷う場合、地域包括支援センターがはじめの窓口になることがあります");
  }

  const capped = items.slice(0, MAX_PERSPECTIVE_ITEMS);
  const summary: DiagnosisSummary = { now: [], family: [], professional: [], later: [] };
  for (const item of capped) {
    summary[item.bucket].push(item.text);
  }
  return summary;
}

// ---------------------------------------------------------------------------
// 結果画面の中心となる要素（あなたの状況／まず最初にすること／今回整理すること／
// そのまま使える質問）。
// ---------------------------------------------------------------------------

/**
 * 「まず最初にすること」の優先順位判定に使う論点タグ。
 * 上から並んでいる順が、そのまま優先順位（1が最優先）。
 */
type IssueTag =
  | "deadline" // (1) 退院・退所・住み替えなど期限がある問題
  | "medical_support" // (2) 医療・介護上の支援内容が未確認の問題
  | "wish_unclear" // (3) 本人の希望が確認できていない問題
  | "family_range" // (4) 家族が担える支援範囲が未定の問題
  | "no_professional" // (5) 相談先・担当者が未定の問題
  | "home_practical" // (6) 住まい・実家・費用・資産の問題
  | "home_future"; // (7) 将来の相続・売却・家財整理等の問題

const ISSUE_PRIORITY: IssueTag[] = [
  "deadline",
  "medical_support",
  "wish_unclear",
  "family_range",
  "no_professional",
  "home_practical",
  "home_future",
];

function hasDeadline(answers: DiagnosisAnswers): boolean {
  return hasAny(answers, "deadline", ["within_week", "within_month", "within_3months"]);
}

function detectIssues(answers: DiagnosisAnswers): Set<IssueTag> {
  const issues = new Set<IssueTag>();

  if (hasDeadline(answers)) issues.add("deadline");

  if (hasAny(answers, "concerns", ["after_discharge", "home_life"])) {
    issues.add("medical_support");
  }

  if (hasAny(answers, "wish_confirmed", ["not_yet", "difficult", "differs"])) {
    issues.add("wish_unclear");
  }

  if (
    hasAny(answers, "family_agreement", ["partial_diff", "major_diff", "not_discussed"]) ||
    has(answers, "concerns", "family_roles")
  ) {
    issues.add("family_range");
  }

  if (
    has(answers, "professionals_involved", "none") ||
    (answers.professionals_involved?.length ?? 0) === 0 ||
    has(answers, "concerns", "who_to_ask") ||
    has(answers, "want_to_know", "where_to_ask")
  ) {
    issues.add("no_professional");
  }

  if (
    has(answers, "concerns", "cost") ||
    has(answers, "concerns", "facility") ||
    has(answers, "concerns", "home_management") ||
    hasAny(answers, "vacant_home", ["already_vacant", "soon_vacant"])
  ) {
    issues.add("home_practical");
  }

  if (
    has(answers, "concerns", "home_future") ||
    has(answers, "want_to_know", "home_order") ||
    has(answers, "professionals_involved", "real_estate") ||
    hasAny(answers, "vacant_home", ["may_return", "family_may_use"])
  ) {
    issues.add("home_future");
  }

  return issues;
}

function topIssue(issues: Set<IssueTag>): IssueTag | null {
  for (const tag of ISSUE_PRIORITY) {
    if (issues.has(tag)) return tag;
  }
  return null;
}

// 「自宅に戻る場合」か「自宅での生活を続ける場合」かは、現在地によって表現を変える
// （すでに自宅にいる場合に「戻る場合」と書くと事実と食い違うため）。
function homeLivingPhrase(answers: DiagnosisAnswers): string {
  return has(answers, "location", "home") ? "自宅での生活を続ける場合" : "自宅に戻る場合";
}

// 誰に相談するのが適切かは、すでにつながっている専門職を優先する
// （つながりを無視して地域包括支援センター等を重複案内しないため）。
// 入院中の場合はdeadlineContactと同じ表記に揃える（同じ病院の窓口を、文言違いの
// 別の相手であるかのように2件案内してしまわないため）。
function medicalContact(answers: DiagnosisAnswers): string {
  if (has(answers, "professionals_involved", "care_manager")) return "担当のケアマネジャー";
  if (has(answers, "location", "hospital")) return "病院の退院支援担当者または医療ソーシャルワーカー";
  if (has(answers, "professionals_involved", "hospital_staff")) return "病院の相談員";
  return "地域包括支援センター";
}

// 退院・退所の期限を確認する相手（deadlineタグ用）。医療・介護タグ側のmedicalContactとは
// 判断基準が少し異なる（施設ケースを明示的に扱う）ため、別関数として保持する。
function deadlineContact(answers: DiagnosisAnswers): string {
  if (has(answers, "location", "hospital")) return "病院の退院支援担当者または医療ソーシャルワーカー";
  if (has(answers, "location", "facility")) return "施設の相談員";
  if (has(answers, "professionals_involved", "care_manager")) return "担当のケアマネジャー";
  return "地域包括支援センター";
}

// 費用の見込みを確認する相手（home_practical＝costタグ用）。
function costContact(answers: DiagnosisAnswers): string {
  if (has(answers, "professionals_involved", "care_manager")) return "担当のケアマネジャー";
  if (has(answers, "professionals_involved", "facility_staff")) return "施設相談員";
  return "地域包括支援センター";
}

type FirstAction = { headline: string; note?: string; contact: string | null };

function buildFirstAction(answers: DiagnosisAnswers, issue: IssueTag | null): FirstAction {
  switch (issue) {
    case "deadline": {
      const contact = deadlineContact(answers);
      return {
        headline: `次の平日までに、${contact}へ、退院先（今後の住まい）をいつまでに決める必要があるかを確認してください。`,
        contact,
      };
    }
    case "medical_support": {
      const contact = medicalContact(answers);
      return {
        headline: `次に会う機会に、${contact}へ、自宅での生活を続ける場合に必要な医療・介護の支援内容を確認してください。`,
        contact,
      };
    }
    case "wish_unclear": {
      if (has(answers, "wish_confirmed", "differs")) {
        return {
          headline:
            "次に家族が集まる機会に、ご本人とご家族それぞれの希望を、あらためて確認してください。",
          contact: null,
        };
      }
      if (has(answers, "wish_confirmed", "difficult")) {
        const contact = medicalContact(answers);
        return {
          headline: `次に会う機会に、${contact}へ、ご本人の希望を確認する方法について相談してください。`,
          contact,
        };
      }
      return {
        headline: "次にご本人と話せる機会に、これからどこで、どのように過ごしたいかを聞いてみてください。",
        contact: null,
      };
    }
    case "family_range": {
      return {
        headline:
          "次に家族が集まる機会に、誰が何を担当できるか（担当できないことも含めて）を話し合ってください。",
        contact: null,
      };
    }
    case "no_professional": {
      return {
        headline:
          "次の平日までに、地域包括支援センターへ連絡し、今の状況を相談できる窓口や担当者を確認してください。",
        contact: "地域包括支援センター",
      };
    }
    case "home_practical": {
      if (has(answers, "concerns", "cost")) {
        const contact = costContact(answers);
        return {
          headline: `今月中に、${contact}へ、今後かかる費用の見込みを確認してください。`,
          contact,
        };
      }
      return {
        headline: "次に家族が集まる機会に、実家の当面の管理方法について、誰が何をするかを話し合ってください。",
        contact: null,
      };
    }
    case "home_future":
    default: {
      return {
        headline: "家族の予定が合うときに、実家をこの先どうしたいか、家族の考えを共有してください。",
        contact: null,
      };
    }
  }
}

// -- 次の一歩（結果画面の一番下） -------------------------------------------

// 各論点タグに対応する、外部の相談先。家族内で扱う論点（wish_unclear／family_range）と、
// House OHANA側の条件で扱う論点（home_future）には、ここでは相手を割り当てない。
function externalContactForIssue(answers: DiagnosisAnswers, tag: IssueTag): string | null {
  switch (tag) {
    case "deadline":
      return deadlineContact(answers);
    case "medical_support":
      return medicalContact(answers);
    case "no_professional":
      return "地域包括支援センター";
    case "home_practical":
      return has(answers, "concerns", "cost") ? costContact(answers) : null;
    default:
      return null;
  }
}

function buildNextStep(
  answers: DiagnosisAnswers,
  issues: Set<IssueTag>,
  firstActionContact: string | null,
): { contacts: string[]; showOhana: boolean } {
  const contacts: string[] = [];
  for (const tag of ISSUE_PRIORITY) {
    if (contacts.length >= 2) break;
    if (!issues.has(tag)) continue;
    const contact = externalContactForIssue(answers, tag);
    if (!contact || contact === firstActionContact || contacts.includes(contact)) continue;
    contacts.push(contact);
  }

  const showOhana =
    has(answers, "concerns", "home_future") || has(answers, "concerns", "cost") || issues.size >= 3;

  return { contacts, showOhana };
}

// -- あなたの状況（1〜2文） -------------------------------------------------

function situationPrimaryClause(answers: DiagnosisAnswers): string {
  const deadline = hasDeadline(answers);
  if (has(answers, "location", "hospital")) {
    if (has(answers, "deadline", "within_week")) return "入院中で、退院までの期限が近づいています";
    if (deadline) return "入院中で、退院までに期限があります";
    return "入院中で、退院後の生活はまだ決まっていません";
  }
  if (has(answers, "location", "facility")) {
    if (deadline) return "施設で暮らしており、退所や住み替えの期限が近づいています";
    return "施設で暮らしています";
  }
  if (has(answers, "location", "home")) {
    return "自宅で生活しています";
  }
  if (has(answers, "location", "relative")) {
    return "親族の家で過ごしています";
  }
  return "現在の生活の場について、整理を始めたところです";
}

// 実家・費用以外の、より優先度の高い論点。実家関連は situationHomeConcern 側で
// まとめて扱うため、ここでは対象にしない（同じ話題を2文で繰り返さないため）。
function situationSecondaryClause(answers: DiagnosisAnswers, issues: Set<IssueTag>): string | null {
  const medical = issues.has("medical_support");
  const familyRange = issues.has("family_range");

  if (medical && familyRange) {
    return `${homeLivingPhrase(answers)}の支援内容と、家族が担える範囲がまだ確認できていません`;
  }
  if (medical) {
    return "自宅での生活に必要な支援内容が、まだ確認できていません";
  }
  if (issues.has("wish_unclear")) {
    if (has(answers, "wish_confirmed", "differs")) return "本人と家族の希望が違う状態です";
    return "本人の希望が、まだ確認できていません";
  }
  if (familyRange) {
    return "家族がどこまで支援できるかが、まだ確認できていません";
  }
  if (issues.has("no_professional")) {
    return "今のところ、相談できる専門職とのつながりがありません";
  }
  if (has(answers, "concerns", "cost")) {
    return "費用の見込みが、まだ確認できていません";
  }
  return null;
}

// 実家・空き家関連の心配（今は決めなくてよいことにつながる論点）を1つの表現にまとめる。
function situationHomeConcern(answers: DiagnosisAnswers, issues: Set<IssueTag>): string | null {
  const future = issues.has("home_future");
  const managementOnly =
    has(answers, "concerns", "home_management") || hasAny(answers, "vacant_home", ["already_vacant", "soon_vacant"]);

  if (future && managementOnly) {
    return "実家をこの先どうするか、当面の管理方法もあわせて気になっている状態です";
  }
  if (future) {
    return "実家をこの先どうするかが気になっている状態です";
  }
  if (managementOnly) {
    return "実家の当面の管理方法が、気になっている状態です";
  }
  return null;
}

function buildSituation(answers: DiagnosisAnswers, issues: Set<IssueTag>): string {
  const primary = situationPrimaryClause(answers);
  const secondary = situationSecondaryClause(answers, issues);
  const homeConcern = situationHomeConcern(answers, issues);

  // ほかに大きな論点がなく、実家関連の心配が中心のケースは1文にまとめる
  if (!secondary && homeConcern) {
    return `${primary}が、${homeConcern}。`;
  }

  const firstSentence = secondary ? `${primary}が、${secondary}。` : `${primary}。`;

  // ほかに論点がある場合、実家関連は「後で考えられる」ことを添える2文目にする
  if (secondary && homeConcern) {
    return `${firstSentence}実家の処分は、今の暮らし方が見えてから考えられます。`;
  }

  return firstSentence;
}

// -- 今回整理すること（3区分） ----------------------------------------------

function buildFamilyDecisions(answers: DiagnosisAnswers, issues: Set<IssueTag>): string[] {
  const candidates: string[] = [];

  if (has(answers, "wish_confirmed", "differs")) {
    candidates.push("本人と家族、それぞれの希望をどう擦り合わせるか");
  } else if (hasAny(answers, "family_agreement", ["major_diff", "partial_diff"])) {
    candidates.push("家族の間で、意見の違いをどう擦り合わせるか");
  }

  if (
    !has(answers, "family_agreement", "mostly") ||
    has(answers, "concerns", "family_roles") ||
    issues.has("no_professional")
  ) {
    candidates.push("家族の連絡役を誰にするか");
  }

  if (issues.has("family_range") || issues.has("medical_support")) {
    candidates.push("家族ができる支援とできない支援の範囲");
  }

  if (
    issues.has("medical_support") ||
    issues.has("deadline") ||
    has(answers, "concerns", "cost") ||
    has(answers, "concerns", "facility") ||
    has(answers, "wish_confirmed", "difficult")
  ) {
    candidates.push("誰が病院や専門職へ確認するか");
  }

  return takeUnique(candidates, 3);
}

function buildProfessionalDecisions(answers: DiagnosisAnswers, issues: Set<IssueTag>): string[] {
  const candidates: string[] = [];

  if (issues.has("deadline")) {
    candidates.push("退院先（今後の住まい）をいつまでに決める必要があるか");
  }
  if (issues.has("medical_support")) {
    candidates.push(`${homeLivingPhrase(answers)}に必要な医療・介護の支援内容`);
  }
  if (has(answers, "concerns", "facility")) {
    candidates.push("施設等を比較する必要があるか");
  }
  if (has(answers, "concerns", "cost")) {
    candidates.push("費用の見込みと使える制度");
  }
  if (has(answers, "wish_confirmed", "difficult")) {
    candidates.push("本人の希望を確認する方法");
  }

  return takeUnique(candidates, 3);
}

function buildLaterDecisions(answers: DiagnosisAnswers): string[] {
  const candidates: string[] = [];

  if (has(answers, "concerns", "home_future")) {
    candidates.push("実家を売るか貸すかは、今の暮らし方が見えてから考えられます");
  }
  if (has(answers, "concerns", "home_management")) {
    candidates.push("実家の家財整理や維持管理の見直しは、今すぐ決める必要はありません");
  }
  if (hasAny(answers, "vacant_home", ["already_vacant", "soon_vacant"])) {
    candidates.push("空き家となった実家の当面の管理方法は、今すぐ決める必要はありません");
  }
  if (has(answers, "professionals_involved", "real_estate")) {
    candidates.push("実家について不動産会社へ相談するかどうかは、家族の意向がまとまってからでも遅くありません");
  }

  return takeUnique(candidates, 3);
}

// -- そのまま使える質問（既存「ご家族の方へ」の家族会議の質問例を流用） -------

// app/family/page.tsx の「家族会議の質問例」と同一の文言を使用する（新規に文言を作らない）。
const FAMILY_MEETING_QUESTIONS = {
  whereToLive: "本人はどこで暮らしたいと考えているか",
  whoTalksToHonnin: "誰が本人と話すか",
  worstWorry: "家族は何を一番心配しているか",
  judgeCriteria: "意見が違う場合、何を判断基準にするか",
  whoChecksCost: "誰が費用を確認するか",
  whoGathersInfo: "誰が情報を集めるか",
  notYetNeeded: "今すぐ決めなくてもよいことは何か",
  deadlineToDecide: "いつまでに何を決める必要があるか",
} as const;

function buildReadyQuestions(answers: DiagnosisAnswers, issues: Set<IssueTag>): string[] {
  const candidates: string[] = [];

  if (issues.has("deadline")) candidates.push(FAMILY_MEETING_QUESTIONS.deadlineToDecide);
  if (issues.has("medical_support")) candidates.push(FAMILY_MEETING_QUESTIONS.whoTalksToHonnin);
  if (issues.has("wish_unclear")) candidates.push(FAMILY_MEETING_QUESTIONS.whereToLive);
  if (has(answers, "wish_confirmed", "differs") || hasAny(answers, "family_agreement", ["major_diff", "partial_diff"])) {
    candidates.push(FAMILY_MEETING_QUESTIONS.judgeCriteria);
  }
  if (issues.has("family_range")) candidates.push(FAMILY_MEETING_QUESTIONS.worstWorry);
  if (has(answers, "concerns", "cost")) candidates.push(FAMILY_MEETING_QUESTIONS.whoChecksCost);
  if (issues.has("no_professional")) candidates.push(FAMILY_MEETING_QUESTIONS.whoGathersInfo);
  if (issues.has("home_future")) candidates.push(FAMILY_MEETING_QUESTIONS.notYetNeeded);

  return takeUnique(candidates, 3);
}

export function buildDiagnosisResult(answers: DiagnosisAnswers): DiagnosisResult {
  const issues = detectIssues(answers);
  const issue = topIssue(issues);
  const firstAction = buildFirstAction(answers, issue);

  return {
    situation: buildSituation(answers, issues),
    firstAction: { headline: firstAction.headline, note: firstAction.note },
    familyDecisions: buildFamilyDecisions(answers, issues),
    professionalDecisions: buildProfessionalDecisions(answers, issues),
    laterDecisions: buildLaterDecisions(answers),
    readyQuestions: buildReadyQuestions(answers, issues),
    perspectives: buildDiagnosisSummary(answers),
    nextStep: buildNextStep(answers, issues, firstAction.contact),
  };
}
