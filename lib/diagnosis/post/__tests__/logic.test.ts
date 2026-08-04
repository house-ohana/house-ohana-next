import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildPostResult } from "../logic";
import { decodePostParams, encodePostAnswers, POST_SCHEMA_VERSION } from "../schema";
import type { PostValidAnswers } from "../types";

// 実装最終版仕様書 第22節のテストケースに対応する。
// ベースライン: どの優先条件にも該当しない「落ち着いている」回答セット。
const BASELINE: PostValidAnswers = {
  q1: "discharged",
  q2: "mostly_settled",
  q3: "return_home",
  q4: "arranged",
  q5: "wants_home",
  q6: "no_home_issue",
  q7: "likely_sufficient",
  q8: "shared",
  q9: "clearly_understands",
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
  const result = buildPostResult(answers({ q1: "hospitalized", q2: "within_7_days", q3: "undecided", q4: "not_arranged" }));

  test("最初の行動は病院の退院支援担当者への確認", () => {
    assert.match(result.firstAction.headline, /病院の退院支援担当者に確認/);
  });

  test("実家や税金より先に退院直後の生活が優先される（最初の行動に実家/税金を含まない）", () => {
    assert.doesNotMatch(result.firstAction.headline, /実家|相続|税/);
  });

  test("CTAは緊急度が高い相談用", () => {
    assert.equal(result.consultation.urgent, true);
  });
});

describe("ケース2: 1週間以内・自宅方向・支援未調整", () => {
  const result = buildPostResult(
    answers({ q1: "hospitalized", q2: "within_7_days", q3: "return_home", q4: "not_arranged", q5: "wants_home" }),
  );

  test("自宅へ戻れるとは判定しない", () => {
    assert.doesNotMatch(flattenText(result), /自宅へ戻れます|自宅復帰は難しい/);
  });

  test("必要な支援を病院等へ確認する行動を表示", () => {
    assert.match(result.firstAction.headline, /病院の退院支援担当者に確認/);
  });
});

describe("ケース3: 施設方向・実家が空き家・本人は契約を理解できる", () => {
  const result = buildPostResult(
    answers({
      q1: "facility_search",
      q2: "no_deadline",
      q3: "facility",
      q4: "arranged",
      q5: "considering",
      q6: "already_vacant",
      q7: "consider_home_income",
      q8: "shared",
      q9: "clearly_understands",
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
      q1: "discharged",
      q2: "mostly_settled",
      q3: "temporary_home",
      q4: "arranged",
      q5: "wants_home",
      q6: "will_be_vacant",
      q7: "consider_home_income",
      q9: "fluctuates",
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

describe("ケース5: 契約理解が分からない（実家を売る・貸す意向がある場合）", () => {
  const result = buildPostResult(
    answers({
      q1: "discharged",
      q2: "mostly_settled",
      q3: "temporary_home",
      q4: "arranged",
      q5: "wants_home",
      q6: "will_be_vacant",
      q7: "consider_home_income",
      q9: "not_confirmed",
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
  const result = buildPostResult(answers({ q7: "family_pays", q8: "few_supporters" }));

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
    answers({ q1: "discharged", q2: "urgent_after_discharge", q3: "undecided", q4: "not_arranged" }),
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
  const result = buildPostResult(
    answers({ q6: "no_home_issue", q7: "unknown", q8: "few_supporters", q9: "fluctuates" }),
  );

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
});

describe("ケース10: 将来に向けて考え始めた回答（q1=future）", () => {
  test("結果URLとして受理しない（デコード段階で拒否する）", () => {
    const decoded = decodePostParams({ m: "post", v: POST_SCHEMA_VERSION, q1: "future" });
    assert.equal(decoded.ok, false);
    if (!decoded.ok) assert.equal(decoded.reason, "future_not_supported");
  });
});

describe("ケース11: 入院中・退院日は未定・支援未調整", () => {
  const result = buildPostResult(answers({ q1: "hospitalized", q2: "date_unknown", q3: "undecided", q4: "not_arranged" }));

  test("最初の行動は病院の退院支援担当者への確認（退院見込み時期と必要な支援）", () => {
    assert.match(result.firstAction.headline, /病院の退院支援担当者/);
    assert.match(result.firstAction.headline, /退院の見込み時期/);
  });

  test("弱い行動（2週間以内に家族で話す）へ落とさない", () => {
    assert.doesNotMatch(result.firstAction.headline, /2週間以内/);
  });
});

describe("ケース12: 施設・住み替え先を探している・期限未定・支援未調整", () => {
  const result = buildPostResult(
    answers({ q1: "facility_search", q2: "date_unknown", q3: "undecided", q4: "not_arranged" }),
  );

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
  const result = buildPostResult(
    answers({ q1: "discharged", q2: "some_unresolved", q3: "return_home", q4: "partly_arranged" }),
  );

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
    answers({ q1: "hospitalized", q2: "within_7_days", q3: "return_home", q4: "arranged", q7: "unknown_amount" }),
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

describe("ケース15: Q6に対象実家なし（不正URL）", () => {
  test("Q7に実家を売る・貸すという選択肢を許容しない（q6=no_home_issue×q7=consider_home_incomeは復号失敗）", () => {
    const params = {
      m: "post",
      v: POST_SCHEMA_VERSION,
      q1: "discharged",
      q2: "mostly_settled",
      q3: "return_home",
      q4: "arranged",
      q5: "wants_home",
      q6: "no_home_issue",
      q7: "consider_home_income",
      q8: "shared",
      q9: "clearly_understands",
    };
    const decoded = decodePostParams(params);
    assert.equal(decoded.ok, false);
    if (!decoded.ok) assert.equal(decoded.reason, "home_contradiction");
  });

  test("実家・空き家・売却・税務の結果カードを表示しない（q6=no_home_issueのみの正常系）", () => {
    const result = buildPostResult(answers({ q6: "no_home_issue", q7: "unknown" }));
    assert.ok(!result.contacts.some((c) => ["legal", "real_estate", "tax"].includes(c.id)));
  });
});

describe("ケース16: 結果項目の上限と重複", () => {
  // 複数条件が同時に真になる、盛りだくさんの回答セット
  const result = buildPostResult(
    answers({
      q1: "hospitalized",
      q2: "within_7_days",
      q3: "undecided",
      q4: "not_arranged",
      q5: "hard_to_confirm",
      q6: "already_vacant",
      q7: "consider_home_income",
      q8: "few_supporters",
      q9: "seems_difficult",
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

  test("該当項目がない場合のカードは空配列になる（空カードを検出可能にする）", () => {
    const empty = buildPostResult(answers({}));
    assert.equal(Array.isArray(empty.insights), true);
  });
});

describe("ケース17: 旧URL・不正なQ1/Q2組み合わせ", () => {
  test("旧回答を推測変換せず、一般的な更新案内につながる理由を返す", () => {
    // 旧実装(v=1、letter code)のURLを模したパラメータ
    const decoded = decodePostParams({ v: "1", q1: "a" });
    assert.equal(decoded.ok, false);
    if (!decoded.ok) assert.equal(decoded.reason, "unsupported_version");
  });

  test("Q1=hospitalizedにQ2=urgent_after_discharge（discharged専用）を組み合わせたURLは拒否する", () => {
    const decoded = decodePostParams({
      m: "post",
      v: POST_SCHEMA_VERSION,
      q1: "hospitalized",
      q2: "urgent_after_discharge",
      q3: "return_home",
      q4: "arranged",
      q5: "wants_home",
      q6: "no_home_issue",
      q7: "likely_sufficient",
      q8: "shared",
      q9: "clearly_understands",
    });
    assert.equal(decoded.ok, false);
    if (!decoded.ok) assert.equal(decoded.reason, "stage_mismatch");
  });

  test("例外を投げず、常にok:falseで返す", () => {
    assert.doesNotThrow(() => decodePostParams({}));
  });
});

describe("ケース18: 施設探し中・1週間以内・支援未調整（Phase1回帰: 病院誤案内の防止）", () => {
  // 1-1: !isDischarged による誤判定で、施設探し中の人にも「病院の退院支援担当者」が
  // 最優先表示されていたバグの回帰テスト。q1=hospitalizedのケース1と対になる。
  const result = buildPostResult(
    answers({ q1: "facility_search", q2: "within_7_days", q3: "undecided", q4: "not_arranged" }),
  );

  test("病院ではなく、現在相談している担当者または地域包括支援センターを最初の行動にする", () => {
    assert.doesNotMatch(result.firstAction.headline, /病院/);
    assert.match(result.firstAction.headline, /3日以内/);
    assert.match(result.firstAction.headline, /現在相談している担当者または地域包括支援センター/);
  });

  test("窓口カードにも病院を含めない", () => {
    assert.ok(!result.contacts.some((c) => c.id === "hospital"));
  });
});

describe("ケース19: 空き家になるが、売る・貸す意向はまだない（Phase1回帰: 空き家と契約意向の混同防止）", () => {
  // 1-2: q6=will_be_vacant/already_vacant だけで「実家を売る・貸す契約」の案内が
  // 出ていたバグの回帰テスト。契約理解への不安（q9）があっても、売却・賃貸の意向
  // （q7=consider_home_income）が無ければ契約関連の文言を出してはならない。
  const result = buildPostResult(
    answers({
      q1: "discharged",
      q2: "mostly_settled",
      q3: "temporary_home",
      q6: "will_be_vacant",
      q7: "likely_sufficient",
      q9: "fluctuates",
    }),
  );

  test("「実家を売る・貸す契約」に関する行動・窓口を表示しない", () => {
    assert.doesNotMatch(result.firstAction.headline, /実家を売る・貸す契約/);
    assert.ok(!result.contacts.some((c) => c.id === "legal"));
  });

  test("契約理解に関する注意点カード（contract_concern_with_home）を表示しない", () => {
    const ids = result.insights.map((i) => i.id);
    assert.ok(!ids.includes("contract_concern_with_home"));
  });

  test("空き家の管理案内は、売却意向がなくても引き続き表示する", () => {
    const ids = result.insights.map((i) => i.id);
    assert.ok(ids.includes("vacant_home_management"));
  });
});

describe("ケース20: 身寄りが少ない・他に急ぐ条件がない（Phase1回帰: 家族会議フォールバックへの格下げ防止）", () => {
  // 1-3: family_support_load が primaryPriority: 900 だったため、身寄りが少ない
  // ケースでも常に真になる汎用フォールバック（2週間以内に家族で話す）へ落ちていたバグの回帰テスト。
  const result = buildPostResult(answers({ q8: "few_supporters" }));

  test("最初の行動が地域包括支援センターへの連絡になる（2週間以内の家族会議に落とさない）", () => {
    assert.match(result.firstAction.headline, /地域包括支援センター/);
    assert.match(result.firstAction.headline, /身寄りや頼れる人が少ない/);
    assert.doesNotMatch(result.firstAction.headline, /2週間以内/);
  });
});

describe("ケース21: 主に一人で支えている・他に急ぐ条件がない", () => {
  const result = buildPostResult(answers({ q8: "mostly_one_person" }));

  test("最初の行動が担当分けの案内になる（2週間以内の家族会議に落とさない）", () => {
    assert.match(result.firstAction.headline, /一人で抱えている項目を分けて/);
    assert.doesNotMatch(result.firstAction.headline, /2週間以内/);
  });
});

describe("エンコード・デコードの往復（正常系）", () => {
  test("encode -> decodeで同じ回答が復元できる", () => {
    const original = answers({ q1: "hospitalized", q2: "within_30_days" });
    const encoded = encodePostAnswers(original);
    const params = Object.fromEntries(new URLSearchParams(encoded));
    const decoded = decodePostParams(params);
    assert.equal(decoded.ok, true);
    if (decoded.ok) assert.deepEqual(decoded.answers, original);
  });
});

describe("第23節 禁止表現の横断チェック", () => {
  const scenarios: Partial<PostValidAnswers>[] = [
    {},
    { q1: "hospitalized", q2: "within_7_days", q3: "undecided", q4: "not_arranged" },
    { q6: "already_vacant", q7: "consider_home_income", q9: "seems_difficult" },
    { q7: "family_pays", q8: "few_supporters" },
    { q9: "not_confirmed", q6: "will_be_vacant" },
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
