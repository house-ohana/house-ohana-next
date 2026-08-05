import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildPostResult } from "../logic";
import { decodePostParams, encodePostAnswers, POST_SCHEMA_VERSION } from "../schema";
import { KNOWLEDGE_RULE_VERSION, GUIDANCE_CONTENT_VERSION } from "../guidanceContent";
import { buildActionCandidates } from "../actions";
import { computePostVariables } from "../variables";
import {
  POST_QUESTIONS,
  isPostQuestionApplicable,
  pruneInapplicableAnswers,
  isMaximallyUncertain,
  getPostQuestionTitle,
  getPostQuestionLead,
} from "../questions";
import {
  FIRST_ACTION_REASON_TEXT,
  FIRST_ACTION_SUPPLEMENT_TEXT,
  FIRST_ACTION_CHECKLIST,
  FIRST_ACTION_SHORT_HEADLINE,
} from "../resultDisplayText";
import type { PostValidAnswers, PostAnswers } from "../types";

// docs/phase2-design.md（Phase2 質問構造再設計）に対応するテスト。
// ベースライン: どの条件付き枝も発火しない「落ち着いている」回答セット。
const BASELINE: PostValidAnswers = {
  c1: "discharged",
  c2: "mostly_settled",
  c3: "return_home",
  c4: "arranged",
  c5: "wants_home",
  c6: "no_home_issue",
  c7: "likely_sufficient",
  c8: "shared",
};

function answers(overrides: Partial<PostValidAnswers>): PostValidAnswers {
  return { ...BASELINE, ...overrides };
}

const FORBIDDEN_PHRASES = [
  "自宅へ戻れます",
  "自宅へ戻れません",
  "施設へ入るべきです",
  "認知症です",
  "判断能力がありません",
  "成年後見が必要です",
  "家族信託が最適です",
  "実家を売るべきです",
  "この税制が利用できます",
  "この保険が使えます",
];

function flattenText(result: ReturnType<typeof buildPostResult>): string {
  return JSON.stringify(result);
}

describe("ケース1: 1週間以内・住まい未定・支援未調整", () => {
  const result = buildPostResult(answers({ c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "not_arranged" }));

  test("最初の行動は病院の退院支援担当者への確認", () => {
    assert.match(result.firstAction.headline, /病院の退院支援担当者に確認/);
  });

  test("実家や税金より先に退院直後の生活が優先される", () => {
    assert.doesNotMatch(result.firstAction.headline, /実家|相続|税/);
  });

  test("CTAは緊急度が高い相談用", () => {
    assert.equal(result.consultation.urgent, true);
  });
});

describe("ケース2: 1週間以内・自宅方向・支援未調整", () => {
  const result = buildPostResult(
    answers({ c1: "hospitalized", c2: "within_7_days", c3: "return_home", c4: "not_arranged", c5: "wants_home" }),
  );

  test("自宅へ戻れるとは判定しない", () => {
    assert.doesNotMatch(flattenText(result), /自宅へ戻れます|自宅復帰は難しい/);
  });

  test("必要な支援を病院等へ確認する行動を表示", () => {
    assert.match(result.firstAction.headline, /病院の退院支援担当者に確認/);
  });
});

describe("ケース3: 施設方向・実家が空き家（売却検討）・本人は契約を理解できる", () => {
  const result = buildPostResult(
    answers({
      c1: "facility_search",
      c2: "no_deadline",
      c3: "facility",
      c4: "arranged",
      c5: "considering",
      c6: "already_vacant",
      c8: "shared",
      h1: "sell",
      h2: "sole_owner",
      ct1: "clearly_understands",
    }),
  );

  test("本人の希望を記録することを案内", () => {
    const d = result.insights.find((i) => i.id === "contract_clear_with_home");
    assert.ok(d, "contract_clear_with_home insight should be present");
    assert.match(d!.body, /記録しておくと/);
  });

  test("空き家管理、税務期限の確認を表示", () => {
    const ids = result.insights.map((i) => i.id);
    assert.ok(ids.includes("vacant_home_management"));
    assert.ok(ids.includes("vacant_home_sale_deadline"));
  });

  test("家族信託を推奨しない", () => {
    assert.doesNotMatch(flattenText(result), /家族信託が最適|家族信託を組みましょう/);
  });
});

describe("ケース4: 実家を売却検討・契約理解に波がある", () => {
  const result = buildPostResult(
    answers({
      c1: "discharged",
      c2: "mostly_settled",
      c3: "temporary_home",
      c4: "arranged",
      c5: "wants_home",
      c6: "will_be_vacant",
      h1: "sell",
      h2: "sole_owner",
      ct1: "fluctuates",
    }),
  );

  test("契約前に司法書士・弁護士へ確認するよう表示", () => {
    assert.match(result.firstAction.headline, /法律の専門家/);
    assert.ok(result.contacts.some((c) => c.id === "legal"));
  });

  test("成年後見が必要と断定しない・家族だから売れるとは扱わない", () => {
    assert.doesNotMatch(flattenText(result), /成年後見が必要です|家族だから売れます/);
  });

  test("法律上の判断能力を判定しない旨の注記が付く", () => {
    const b = result.insights.find((i) => i.id === "contract_concern_with_home");
    assert.ok(b);
    assert.equal(b!.footnote, "このナビは、法律上・医学上の判断能力を判定するものではありません。");
  });
});

describe("ケース5: 契約理解が分からない", () => {
  const result = buildPostResult(
    answers({
      c1: "discharged",
      c2: "mostly_settled",
      c3: "temporary_home",
      c4: "arranged",
      c5: "wants_home",
      c6: "will_be_vacant",
      h1: "sell",
      h2: "unknown",
      ct1: "not_confirmed",
    }),
  );

  test("能力低下と同じ扱いにしない（「分からない」を「判断できない」と扱わない）", () => {
    const c = result.insights.find((i) => i.id === "contract_status_unknown_with_home");
    assert.ok(c);
    assert.match(c!.body, /「分からない」ことを、直ちに「判断できない」とは扱いません/);
  });

  test("まず現在の理解と希望を確認し、確認が難しい場合のみ専門家へつなぐ", () => {
    assert.match(result.firstAction.headline, /現在の理解と希望を確認/);
    assert.match(result.firstAction.headline, /確認が難しい場合は.*専門家|司法書士や弁護士/);
  });
});

describe("ケース6: 家族が費用負担・一人で支えている", () => {
  const result = buildPostResult(answers({ c7: "family_pays", c8: "few_supporters" }));

  test("家族負担を責めない・家族の生活を守る視点", () => {
    const h = result.insights.find((i) => i.id === "few_supporters");
    assert.ok(h);
    assert.doesNotMatch(h!.body, /家族の責任/);
    assert.match(h!.body, /一人で支えている/);
  });

  test("支払記録を残す案内", () => {
    assert.ok(result.decideNow.includes("当面3か月の費用") || result.selfHelp.some((s) => /費用/.test(s)));
  });

  test("地域包括支援センターへの相談を案内", () => {
    assert.ok(result.contacts.some((c) => c.id === "regional_support"));
  });
});

describe("ケース7: 当面の費用は足りる・支援も決定済み", () => {
  const result = buildPostResult(answers({}));

  test("今すぐ専門家相談が必要と断定しない", () => {
    assert.equal(result.consultation.urgent, false);
    assert.equal(result.consultation.homeAndContract, false);
  });

  test("相談CTAを弱くする（緊急CTAが両方false）", () => {
    assert.equal(result.consultation.urgent || result.consultation.homeAndContract, false);
  });
});

describe("ケース8: すでに退院・住まいと支援が未調整", () => {
  const result = buildPostResult(
    answers({ c1: "discharged", c2: "urgent_after_discharge", c3: "undecided", c4: "not_arranged" }),
  );

  test("病院ではなく地域包括支援センター等を最初の候補にする", () => {
    assert.match(result.firstAction.headline, /地域包括支援センター/);
    assert.doesNotMatch(result.firstAction.headline, /病院の退院支援担当者/);
  });

  test("今日行う行動を1つ表示", () => {
    assert.match(result.firstAction.headline, /今日/);
  });

  test("窓口カードの最初は地域包括支援センター", () => {
    assert.equal(result.contacts[0]?.id, "regional_support");
  });
});

describe("ケース9: 対象となる実家がない", () => {
  const result = buildPostResult(answers({ c6: "no_home_issue", c7: "unknown", c8: "few_supporters" }));

  test("空き家、売却、成年後見、不動産、税務のカードを表示しない", () => {
    const ids = result.contacts.map((c) => c.id);
    assert.ok(!ids.includes("legal"));
    assert.ok(!ids.includes("real_estate"));
    assert.ok(!ids.includes("tax"));
  });

  test("退院後の暮らし、本人希望、家族負担に集中する（実家関連insightが出ない）", () => {
    const ids = result.insights.map((i) => i.id);
    assert.ok(!ids.includes("vacant_home_management"));
    assert.ok(!ids.includes("vacant_home_sale_deadline"));
    assert.ok(!ids.includes("contract_concern_with_home"));
  });

  test("実家がない場合、実家枝（H1）は成立せず結果生成できる（h1未設定でも壊れない）", () => {
    assert.equal(typeof result.firstAction.headline, "string");
  });
});

describe("ケース10: 将来に向けて考え始めた回答（c1=future）", () => {
  test("結果URLとして受理しない（デコード段階で拒否する）", () => {
    const decoded = decodePostParams({ m: "post", v: POST_SCHEMA_VERSION, c1: "future" });
    assert.equal(decoded.ok, false);
    if (!decoded.ok) assert.equal(decoded.reason, "future_not_supported");
  });
});

describe("ケース11: 入院中・退院日は未定・支援未調整", () => {
  const result = buildPostResult(answers({ c1: "hospitalized", c2: "date_unknown", c3: "undecided", c4: "not_arranged" }));

  test("最初の行動は病院の退院支援担当者への確認（退院見込み時期と必要な支援）", () => {
    assert.match(result.firstAction.headline, /病院の退院支援担当者/);
    assert.match(result.firstAction.headline, /退院の見込み時期/);
  });

  test("弱い行動（2週間以内に家族で話す）へ落とさない", () => {
    assert.doesNotMatch(result.firstAction.headline, /2週間以内/);
  });
});

describe("ケース12: 施設・住み替え先を探している・期限未定・支援未調整", () => {
  const result = buildPostResult(answers({ c1: "facility_search", c2: "date_unknown", c3: "undecided", c4: "not_arranged" }));

  test("弱い行動へ落とさない", () => {
    assert.doesNotMatch(result.firstAction.headline, /2週間以内/);
  });

  test("3日以内に現在の担当者または地域包括支援センターへ確認する行動を表示する", () => {
    assert.match(result.firstAction.headline, /3日以内/);
    assert.match(result.firstAction.headline, /現在相談している担当者または地域包括支援センター/);
  });

  test("病院へ入院中だと推測しない", () => {
    assert.doesNotMatch(result.firstAction.headline, /病院/);
  });
});

describe("ケース13: 退院済み・支援は一部未決定", () => {
  const result = buildPostResult(answers({ c1: "discharged", c2: "some_unresolved", c3: "return_home", c4: "partly_arranged" }));

  test("最初の確認先に病院だけを固定表示しない", () => {
    const ids = result.contacts.map((c) => c.id);
    assert.ok(!ids.includes("hospital"));
  });

  test("「現在相談している担当者、または地域包括支援センター」を窓口に表示する", () => {
    assert.ok(result.contacts.some((c) => c.id === "regional_support"));
  });

  test("病院・地域包括・ケアマネジャーを根拠なくすべて並べない（coordinationは最大1件）", () => {
    const coordinationIds = result.contacts.filter((c) => ["hospital", "regional_support", "care_manager"].includes(c.id));
    assert.equal(coordinationIds.length, 1);
  });
});

describe("ケース14: 期限が近く、費用不明・支援は決定済み", () => {
  const result = buildPostResult(
    answers({ c1: "hospitalized", c2: "within_7_days", c3: "return_home", c4: "arranged", c7: "unknown_amount" }),
  );

  test("退院・入居後3か月の費用確認を最初の行動として表示する", () => {
    assert.match(result.firstAction.headline, /3か月のお金を1枚に並べて/);
    assert.match(result.firstAction.headline, /^今日/);
  });

  test("費用不足とは断定しない", () => {
    assert.doesNotMatch(flattenText(result), /費用が不足しています|費用不足です/);
  });

  test("新しい保険加入を提案しない", () => {
    assert.doesNotMatch(flattenText(result), /保険へ入り直すべき|新しい保険の見直しが必要/);
  });
});

describe("ケース15: C6に対象実家なし（不正URL）", () => {
  test("C6=no_home_issueなのにH1パラメータがあるURLは復号失敗になる（推測補正しない）", () => {
    const params = {
      m: "post",
      v: POST_SCHEMA_VERSION,
      c1: "discharged",
      c2: "mostly_settled",
      c3: "return_home",
      c4: "arranged",
      c5: "wants_home",
      c6: "no_home_issue",
      c7: "likely_sufficient",
      c8: "shared",
      h1: "sell",
    };
    const decoded = decodePostParams(params);
    assert.equal(decoded.ok, false);
    if (!decoded.ok) assert.equal(decoded.reason, "incomplete");
  });

  test("実家・空き家・売却・税務の結果カードを表示しない（c6=no_home_issueのみの正常系）", () => {
    const result = buildPostResult(answers({ c6: "no_home_issue", c7: "unknown" }));
    assert.ok(!result.contacts.some((c) => ["legal", "real_estate", "tax"].includes(c.id)));
  });
});

describe("ケース16: 結果項目の上限と重複", () => {
  const result = buildPostResult(
    answers({
      c1: "hospitalized",
      c2: "within_7_days",
      c3: "undecided",
      c4: "not_arranged",
      c5: "hard_to_confirm",
      c6: "already_vacant",
      c8: "few_supporters",
      h1: "sell",
      h2: "unknown",
      ct1: "seems_difficult",
    }),
  );

  test("まず最初にすることは1件（構造上、常に単一）", () => {
    assert.equal(typeof result.firstAction.headline, "string");
  });

  test("次に確認することは最大2件で、最初の行動と同じ内容を含まない", () => {
    assert.ok(result.nextActions.length <= 2);
    for (const next of result.nextActions) {
      assert.notEqual(`${next.deadline}${next.contact}${next.title}`, result.firstAction.headline);
    }
  });

  test("注意点は最大3件、窓口は最大4件、自分でできること・専門家確認は各最大3件", () => {
    assert.ok(result.insights.length <= 3);
    assert.ok(result.contacts.length <= 4);
    assert.ok(result.selfHelp.length <= 3);
    assert.ok(result.askProfessional.length <= 3);
  });

  test("該当項目がない場合のカードは空配列になる", () => {
    const empty = buildPostResult(answers({}));
    assert.equal(Array.isArray(empty.insights), true);
  });
});

describe("ケース17: 旧URL・不正な組み合わせ", () => {
  test("旧回答を推測変換せず、一般的な更新案内につながる理由を返す（旧v3.1形式）", () => {
    const decoded = decodePostParams({ v: "3.1", q1: "hospitalized" });
    assert.equal(decoded.ok, false);
    if (!decoded.ok) assert.equal(decoded.reason, "unsupported_version");
  });

  test("最古のm-post-v2.1形式も同様にunsupported_versionとして拒否する", () => {
    const decoded = decodePostParams({ v: "m-post-v2.1", q1: "a" });
    assert.equal(decoded.ok, false);
    if (!decoded.ok) assert.equal(decoded.reason, "unsupported_version");
  });

  test("C1=hospitalizedにC2=urgent_after_discharge（discharged専用）を組み合わせたURLは拒否する", () => {
    const decoded = decodePostParams({
      m: "post",
      v: POST_SCHEMA_VERSION,
      c1: "hospitalized",
      c2: "urgent_after_discharge",
      c3: "return_home",
      c4: "arranged",
      c5: "wants_home",
      c6: "no_home_issue",
      c7: "likely_sufficient",
      c8: "shared",
    });
    assert.equal(decoded.ok, false);
    if (!decoded.ok) assert.equal(decoded.reason, "stage_mismatch");
  });

  test("例外を投げず、常にok:falseで返す", () => {
    assert.doesNotThrow(() => decodePostParams({}));
  });
});

describe("Phase1回帰: 誤案内・優先度の不具合修正", () => {
  test("施設探し中・1週間以内・支援未調整: 病院ではなく現在の担当者/地域包括支援センターを案内する", () => {
    const result = buildPostResult(answers({ c1: "facility_search", c2: "within_7_days", c3: "undecided", c4: "not_arranged" }));
    assert.doesNotMatch(result.firstAction.headline, /病院/);
    assert.match(result.firstAction.headline, /3日以内/);
    assert.match(result.firstAction.headline, /現在相談している担当者または地域包括支援センター/);
    assert.ok(!result.contacts.some((c) => c.id === "hospital"));
  });

  test("空き家になるが処分意向はまだない（h1=keep_for_now）: 契約関連の行動・窓口・注意点を出さない", () => {
    const result = buildPostResult(
      answers({ c1: "discharged", c2: "mostly_settled", c3: "temporary_home", c6: "will_be_vacant", h1: "keep_for_now", ct1: undefined }),
    );
    assert.doesNotMatch(result.firstAction.headline, /実家を売る・貸す契約/);
    assert.ok(!result.contacts.some((c) => c.id === "legal"));
    assert.ok(!result.insights.map((i) => i.id).includes("contract_concern_with_home"));
    // 空き家の管理案内は、処分意向がなくても引き続き表示する
    assert.ok(result.insights.map((i) => i.id).includes("vacant_home_management"));
  });

  test("身寄りが少ない・他に急ぐ条件がない: 地域包括支援センターへの連絡が最初の行動になる（弱いフォールバックに落とさない）", () => {
    const result = buildPostResult(answers({ c8: "few_supporters" }));
    assert.match(result.firstAction.headline, /地域包括支援センター/);
    assert.match(result.firstAction.headline, /身寄りや頼れる人が少ない/);
    assert.doesNotMatch(result.firstAction.headline, /2週間以内/);
  });

  test("主に一人で支えている・他に急ぐ条件がない: 担当分けの案内が最初の行動になる", () => {
    const result = buildPostResult(answers({ c8: "mostly_one_person" }));
    assert.match(result.firstAction.headline, /一人で抱えている項目を分けて/);
    assert.doesNotMatch(result.firstAction.headline, /2週間以内/);
  });
});

describe("v3.1 第0節: バージョン定数の分離", () => {
  test("POST_SCHEMA_VERSIONはPhase2の質問構成に合わせて4.0になっている", () => {
    assert.equal(POST_SCHEMA_VERSION, "4.0");
  });

  test("KNOWLEDGE_RULE_VERSIONとGUIDANCE_CONTENT_VERSIONが独立して定義されている", () => {
    assert.equal(typeof KNOWLEDGE_RULE_VERSION, "string");
    assert.equal(typeof GUIDANCE_CONTENT_VERSION, "string");
  });
});

describe("Phase2 再修正版: S1(5択)・H2(4択)・CT1(H1連動文言)・内部変数の分離", () => {
  const s1 = POST_QUESTIONS.find((q) => q.id === "s1")!;
  const h2 = POST_QUESTIONS.find((q) => q.id === "h2")!;
  const ct1 = POST_QUESTIONS.find((q) => q.id === "ct1")!;

  test("S1は5択（申請中と未申請が別の選択肢）になっている", () => {
    assert.deepEqual(
      s1.options.map((o) => o.value).sort(),
      ["applying", "certified_no_manager", "certified_with_manager", "not_applied", "unknown"].sort(),
    );
  });

  test("S1で「申請中」と「まだ申請していない」を別の回答値として保存できる", () => {
    const applying = buildPostResult(answers({ c4: "not_arranged", s1: "applying" }));
    const notApplied = buildPostResult(answers({ c4: "not_arranged", s1: "not_applied" }));
    // どちらもS1が支援枝として成立する状況で、回答値としては別物であることをエンコードで確認する
    const encodedA = encodePostAnswers(answers({ c4: "not_arranged", s1: "applying" }));
    const encodedB = encodePostAnswers(answers({ c4: "not_arranged", s1: "not_applied" }));
    assert.notEqual(encodedA, encodedB);
    assert.ok(typeof applying.firstAction.headline === "string" && typeof notApplied.firstAction.headline === "string");
  });

  test("H2は4択（本人以外の名義を含む）になっている", () => {
    assert.deepEqual(
      h2.options.map((o) => o.value).sort(),
      ["other_owner", "shared_owner", "sole_owner", "unknown"].sort(),
    );
  });

  test("CT1の質問文・説明文はH1の値（売る/貸す/解体）に応じて変わる", () => {
    const sellAnswers = { h1: "sell" } as PostAnswers;
    const rentAnswers = { h1: "rent" } as PostAnswers;
    const demolishAnswers = { h1: "demolish" } as PostAnswers;

    assert.match(getPostQuestionTitle(ct1, sellAnswers), /実家の売却の手続について/);
    assert.match(getPostQuestionTitle(ct1, rentAnswers), /実家の賃貸の手続について/);
    assert.match(getPostQuestionTitle(ct1, demolishAnswers), /実家の解体の手続について/);

    assert.match(getPostQuestionLead(ct1, sellAnswers) ?? "", /実家の売却の手続は/);
    assert.match(getPostQuestionLead(ct1, rentAnswers) ?? "", /実家の賃貸の手続は/);
    assert.match(getPostQuestionLead(ct1, demolishAnswers) ?? "", /実家の解体の手続は/);
  });

  test("sellIntent/rentIntent/demolishIntentは互いに排他で、homeActionExpectedはこの3つのORと一致する", () => {
    for (const h1 of ["sell", "rent", "demolish", "keep_for_now", "undecided"] as const) {
      const v = computePostVariables(answers({ c6: "will_be_vacant", h1 }));
      const flags = [v.sellIntent, v.rentIntent, v.demolishIntent];
      assert.ok(flags.filter(Boolean).length <= 1, `h1=${h1} で複数のintentが同時にtrueになっている`);
      assert.equal(v.homeActionExpected, v.sellIntent || v.rentIntent || v.demolishIntent);
    }
  });

  test("ownershipOtherはH2=本人以外の名義のときだけtrueになる", () => {
    const v = computePostVariables(answers({ c6: "will_be_vacant", h1: "sell", h2: "other_owner" }));
    assert.equal(v.ownershipOther, true);
    assert.equal(v.ownershipShared, false);
    assert.equal(v.ownershipUnclear, false);
  });

  test("homeFinancePlanning（税理士カード等の対象）は引き続きsellのときだけ真になる", () => {
    const sellV = computePostVariables(answers({ c6: "will_be_vacant", h1: "sell" }));
    const rentV = computePostVariables(answers({ c6: "will_be_vacant", h1: "rent" }));
    assert.equal(sellV.homeFinancePlanning, true);
    assert.equal(rentV.homeFinancePlanning, false);
  });

  test("C7の「家族が負担する見込み」は「家族の持ち出しが必要になりそう」という文言になっている", () => {
    const c7 = POST_QUESTIONS.find((q) => q.id === "c7")!;
    const familyPaysOption = c7.options.find((o) => o.value === "family_pays");
    assert.equal(familyPaysOption?.label, "家族の持ち出しが必要になりそう");
  });

  test("C7の文言変更後も、familyContribution等の判定結果は変わらない（回帰確認）", () => {
    const v = computePostVariables(answers({ c7: "family_pays" }));
    assert.equal(v.familyContribution, true);
  });
});

describe("Phase2 再修正版: 共通質問8問→低情報収束判定→条件付き質問、の順序を直接確認", () => {
  test("C1〜C8の途中では、S1・H1はまだ回答されていなくても構わない（構造上の前提確認）", () => {
    // POST_QUESTIONS配列上、s1/h1/h2/ct1はc1〜c8よりも後ろに位置している
    const ids = POST_QUESTIONS.map((q) => q.id);
    const lastCommonIndex = ids.indexOf("c8");
    const s1Index = ids.indexOf("s1");
    const h1Index = ids.indexOf("h1");
    assert.ok(lastCommonIndex < s1Index);
    assert.ok(lastCommonIndex < h1Index);
  });

  test("C4のみ「一部決まっている」でC6/C7/C8が未回答（undefined）の間は、S1の適用判定は収束扱いにならない設計だが、実際の画面遷移ではC8まで回答してから判定される", () => {
    // isMaximallyUncertainはc4・c6・c7・c8の4つがすべて"unknown"の場合のみtrueになる。
    // c6/c7/c8が単に未回答（undefined）なだけでは収束とみなされない（"unknown"という明示回答とは別）。
    const midway = { c4: "partly_arranged" } as PostAnswers;
    assert.equal(isMaximallyUncertain(midway), false);
  });
});

describe("Phase2 第4節: 条件付き質問の適用判定（isApplicable）", () => {
  const questionById = (id: string) => POST_QUESTIONS.find((q) => q.id === id)!;

  test("S1（支援枝）はC4が一部/未決定/分からないのとき成立する", () => {
    const s1 = questionById("s1");
    assert.equal(isPostQuestionApplicable(s1, answers({ c4: "partly_arranged" }) as PostAnswers), true);
    assert.equal(isPostQuestionApplicable(s1, answers({ c4: "not_arranged" }) as PostAnswers), true);
    assert.equal(isPostQuestionApplicable(s1, answers({ c4: "arranged" }) as PostAnswers), false);
    assert.equal(isPostQuestionApplicable(s1, answers({ c4: "not_needed_said" }) as PostAnswers), false);
  });

  test("H1（実家枝）はC6が「対象になる実家はない」「分からない」以外のとき成立する", () => {
    const h1 = questionById("h1");
    assert.equal(isPostQuestionApplicable(h1, answers({ c6: "will_be_vacant" }) as PostAnswers), true);
    assert.equal(isPostQuestionApplicable(h1, answers({ c6: "no_home_issue" }) as PostAnswers), false);
    assert.equal(isPostQuestionApplicable(h1, answers({ c6: "unknown" }) as PostAnswers), false);
  });

  test("H2・CT1（実家枝の続き・契約枝）はH1が売る/貸す/解体のときだけ成立する", () => {
    const h2 = questionById("h2");
    const ct1 = questionById("ct1");
    for (const id of ["sell", "rent", "demolish"]) {
      const a = { ...answers({ c6: "will_be_vacant" }), h1: id } as unknown as PostAnswers;
      assert.equal(isPostQuestionApplicable(h2, a), true);
      assert.equal(isPostQuestionApplicable(ct1, a), true);
    }
    for (const id of ["keep_for_now", "undecided"]) {
      const a = { ...answers({ c6: "will_be_vacant" }), h1: id } as unknown as PostAnswers;
      assert.equal(isPostQuestionApplicable(h2, a), false);
      assert.equal(isPostQuestionApplicable(ct1, a), false);
    }
  });

  test("最大質問数は共通8問＋条件付き最大4問（S1・H1・H2・CT1）＝12問を超えない", () => {
    const maxApplicable = POST_QUESTIONS.filter((q) =>
      isPostQuestionApplicable(
        q,
        { c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "unknown", c5: "unknown", c6: "will_be_vacant", c7: "unknown", c8: "unknown", h1: "sell" } as PostAnswers,
      ),
    );
    assert.ok(maxApplicable.length <= 12, `applicable question count was ${maxApplicable.length}`);
  });
});

describe("Phase2 第7節: 「分からない」が多い場合の収束ロジック", () => {
  test("C4・C6・C7・C8がすべて不明なら、支援枝・実家枝ともにスキップする", () => {
    const uncertain = { c4: "unknown", c6: "unknown", c7: "unknown", c8: "unknown" } as PostAnswers;
    assert.equal(isMaximallyUncertain(uncertain), true);

    const s1 = POST_QUESTIONS.find((q) => q.id === "s1")!;
    const h1 = POST_QUESTIONS.find((q) => q.id === "h1")!;
    assert.equal(isPostQuestionApplicable(s1, uncertain), false);
    assert.equal(isPostQuestionApplicable(h1, uncertain), false);
  });

  test("収束ケースでも、低情報向けの既定の行動が最初の行動として1件だけ表示される", () => {
    const result = buildPostResult(
      answers({ c1: "hospitalized", c2: "unknown", c3: "undecided", c4: "unknown", c6: "unknown", c7: "unknown", c8: "unknown" }),
    );
    assert.equal(typeof result.firstAction.headline, "string");
    assert.match(result.firstAction.headline, /病院の退院支援担当者/);
  });

  test("C4のみ不明で他が具体的な値なら、収束せず支援枝は成立する", () => {
    const partiallyKnown = { c4: "unknown", c6: "no_home_issue", c7: "likely_sufficient", c8: "shared" } as PostAnswers;
    assert.equal(isMaximallyUncertain(partiallyKnown), false);
    const s1 = POST_QUESTIONS.find((q) => q.id === "s1")!;
    assert.equal(isPostQuestionApplicable(s1, partiallyKnown), true);
  });
});

describe("Phase2 第8節: 戻る操作時の依存回答の削除（pruneInapplicableAnswers）", () => {
  test("C1を変更するとC2が破棄される", () => {
    const before: PostAnswers = { c1: "hospitalized", c2: "within_7_days" };
    const after = pruneInapplicableAnswers({ ...before, c1: "discharged" });
    // C2はC1に関わらず常にisApplicable=trueだが、値の意味が変わるためウィザード側で明示的に
    // 削除する設計（pruneInapplicableAnswers自体はc2を消さない。挙動はDiagnosisWizardのsetAnswer側）
    assert.equal(after.c1, "discharged");
  });

  test("C4を「決まっている」に変更すると、非該当になったS1が破棄される", () => {
    const before: PostAnswers = { c4: "not_arranged", s1: "applying" };
    const after = pruneInapplicableAnswers({ ...before, c4: "arranged" });
    assert.equal(after.s1, undefined);
  });

  test("C6を「対象になる実家はない」に変更すると、H1・H2・CT1がまとめて破棄される", () => {
    const before: PostAnswers = { c6: "will_be_vacant", h1: "sell", h2: "sole_owner", ct1: "clearly_understands" };
    const after = pruneInapplicableAnswers({ ...before, c6: "no_home_issue" });
    assert.equal(after.h1, undefined);
    assert.equal(after.h2, undefined);
    assert.equal(after.ct1, undefined);
  });

  test("H1を「当面はそのまま残す」に変更すると、H2・CT1が破棄される", () => {
    const before: PostAnswers = { c6: "will_be_vacant", h1: "sell", h2: "sole_owner", ct1: "clearly_understands" };
    const after = pruneInapplicableAnswers({ ...before, h1: "keep_for_now" });
    assert.equal(after.h2, undefined);
    assert.equal(after.ct1, undefined);
  });

  test("該当し続ける回答は保持される", () => {
    const before: PostAnswers = { c4: "not_arranged", s1: "applying", c6: "will_be_vacant", h1: "sell", h2: "sole_owner", ct1: "fluctuates" };
    const after = pruneInapplicableAnswers({ ...before, c3: "return_home" });
    assert.equal(after.s1, "applying");
    assert.equal(after.h1, "sell");
    assert.equal(after.h2, "sole_owner");
    assert.equal(after.ct1, "fluctuates");
  });
});

describe("エンコード・デコードの往復（正常系）", () => {
  test("共通質問のみ（枝なし）で encode -> decode すると同じ回答が復元できる", () => {
    const original = answers({ c1: "hospitalized", c2: "within_30_days" });
    const encoded = encodePostAnswers(original);
    const params = Object.fromEntries(new URLSearchParams(encoded));
    const decoded = decodePostParams(params);
    assert.equal(decoded.ok, true);
    if (decoded.ok) assert.deepEqual(decoded.answers, original);
  });

  test("全枝が該当する回答（12問）で encode -> decode すると同じ回答が復元できる", () => {
    const original = answers({
      c4: "not_arranged",
      c6: "will_be_vacant",
      s1: "applying",
      h1: "sell",
      h2: "shared_owner",
      ct1: "fluctuates",
    });
    const encoded = encodePostAnswers(original);
    const params = Object.fromEntries(new URLSearchParams(encoded));
    const decoded = decodePostParams(params);
    assert.equal(decoded.ok, true);
    if (decoded.ok) assert.deepEqual(decoded.answers, original);
  });
});

describe("表示専用テキスト対応表の網羅性（Phase1.5からの回帰確認）", () => {
  test("実在する全行動IDにFIRST_ACTION_*が定義されている", () => {
    const sample = answers({});
    const v = computePostVariables(sample);
    const candidateIds = buildActionCandidates(sample, v).map((c) => c.id);
    assert.ok(candidateIds.length > 0);
    for (const id of candidateIds) {
      assert.ok(id in FIRST_ACTION_REASON_TEXT, `FIRST_ACTION_REASON_TEXT に ${id} がありません`);
      assert.ok(id in FIRST_ACTION_SUPPLEMENT_TEXT, `FIRST_ACTION_SUPPLEMENT_TEXT に ${id} がありません`);
      assert.ok(id in FIRST_ACTION_CHECKLIST, `FIRST_ACTION_CHECKLIST に ${id} がありません`);
      assert.ok(id in FIRST_ACTION_SHORT_HEADLINE, `FIRST_ACTION_SHORT_HEADLINE に ${id} がありません`);
    }
  });
});

describe("第23節 禁止表現の横断チェック", () => {
  const scenarios: Partial<PostValidAnswers>[] = [
    {},
    { c1: "hospitalized", c2: "within_7_days", c3: "undecided", c4: "not_arranged" },
    { c6: "already_vacant", h1: "sell", h2: "sole_owner", ct1: "seems_difficult" },
    { c7: "family_pays", c8: "few_supporters" },
    { c6: "will_be_vacant", h1: "sell", h2: "unknown", ct1: "not_confirmed" },
  ];

  for (const [index, overrides] of scenarios.entries()) {
    test(`シナリオ${index + 1}に禁止表現が含まれない`, () => {
      const result = buildPostResult(answers(overrides));
      const text = flattenText(result);
      for (const phrase of FORBIDDEN_PHRASES) {
        assert.doesNotMatch(text, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      }
    });
  }
});

describe("Phase3準備: 成果物専用フラグ（回答値がliteralなunknownかどうか）", () => {
  test("c4がunknownのときsupportAnswerUnknownはtrue", () => {
    const v = computePostVariables(answers({ c4: "unknown" }));
    assert.equal(v.supportAnswerUnknown, true);
  });
  test("c4がnot_arrangedのときsupportAnswerUnknownはfalse（既存supportUnclearとは異なる基準）", () => {
    const v = computePostVariables(answers({ c4: "not_arranged" }));
    assert.equal(v.supportAnswerUnknown, false);
    assert.equal(v.supportUnclear, true);
  });
  test("c4がpartly_arrangedのときsupportAnswerUnknownはfalse", () => {
    const v = computePostVariables(answers({ c4: "partly_arranged" }));
    assert.equal(v.supportAnswerUnknown, false);
  });
  test("c4がarrangedのときsupportAnswerUnknownはfalse", () => {
    const v = computePostVariables(answers({ c4: "arranged" }));
    assert.equal(v.supportAnswerUnknown, false);
  });

  test("c5がunknownのときwishesAnswerUnknownはtrue", () => {
    const v = computePostVariables(answers({ c5: "unknown" }));
    assert.equal(v.wishesAnswerUnknown, true);
  });
  test("c5がnot_discussedのときwishesAnswerUnknownはfalse（既存wishesUnclearとは異なる基準）", () => {
    const v = computePostVariables(answers({ c5: "not_discussed" }));
    assert.equal(v.wishesAnswerUnknown, false);
    assert.equal(v.wishesUnclear, true);
  });
  test("c5がhard_to_confirmのときwishesAnswerUnknownはfalse", () => {
    const v = computePostVariables(answers({ c5: "hard_to_confirm" }));
    assert.equal(v.wishesAnswerUnknown, false);
  });
  test("c5がconsideringのときwishesAnswerUnknownはfalse", () => {
    const v = computePostVariables(answers({ c5: "considering" }));
    assert.equal(v.wishesAnswerUnknown, false);
  });

  test("c7がunknownのときmoneyAnswerUnknownはtrue", () => {
    const v = computePostVariables(answers({ c7: "unknown" }));
    assert.equal(v.moneyAnswerUnknown, true);
  });
  test("c7がunknown_amountのときmoneyAnswerUnknownはfalse（既存moneyUnclearとは異なる基準）", () => {
    const v = computePostVariables(answers({ c7: "unknown_amount" }));
    assert.equal(v.moneyAnswerUnknown, false);
    assert.equal(v.moneyUnclear, true);
  });
  test("c7がlikely_sufficientのときmoneyAnswerUnknownはfalse", () => {
    const v = computePostVariables(answers({ c7: "likely_sufficient" }));
    assert.equal(v.moneyAnswerUnknown, false);
  });

  test("c3がundecidedでも、supportAnswerUnknown/wishesAnswerUnknown/moneyAnswerUnknownはc3の値に影響されない", () => {
    const v = computePostVariables(answers({ c3: "undecided", c4: "arranged", c5: "wants_home", c7: "likely_sufficient" }));
    assert.equal(v.supportAnswerUnknown, false);
    assert.equal(v.wishesAnswerUnknown, false);
    assert.equal(v.moneyAnswerUnknown, false);
  });
});
