import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import KnowledgeCardsSection, { matchedContacts } from "../../../../components/KnowledgeCardsSection";
import { DISCHARGE_SUPPORT_START_GAP, TRANSITION_MONTHLY_CASH_GAP, HOME_OWNERSHIP_INTENT_GAP } from "../knowledgeCards/content";
import type { PostKnowledgeCard } from "../knowledgeCards/types";
import type { PostContactCard } from "../types";

// このテストファイルは Phase4.1 Step4 のUI（KnowledgeCardsSection）だけを対象とする。
// components/KnowledgeCardsSection.tsはJSXを使わずReact.createElementで書かれているため、
// Nodeのネイティブ実行（型ストリッピングのみ、JSX変換なし）でそのままimportできる。
// renderToStaticMarkupで実際にレンダリングし、生成markupを検証する。

function render(cards: readonly PostKnowledgeCard[], contacts: readonly PostContactCard[]): string {
  return renderToStaticMarkup(createElement(KnowledgeCardsSection, { cards, contacts }));
}

const CARD_A: PostKnowledgeCard = {
  id: DISCHARGE_SUPPORT_START_GAP.id,
  title: DISCHARGE_SUPPORT_START_GAP.title,
  cliff: DISCHARGE_SUPPORT_START_GAP.cliff,
  whyNow: "入院中で、支援の調整がまだ終わっていません。",
  checkItems: DISCHARGE_SUPPORT_START_GAP.checkItems,
  linkedContactIds: DISCHARGE_SUPPORT_START_GAP.linkedContactIds,
  sources: [],
  verifiedAt: null,
  reviewBy: null,
  rank: 10,
  urgency: "high",
};

const CARD_B: PostKnowledgeCard = {
  id: TRANSITION_MONTHLY_CASH_GAP.id,
  title: TRANSITION_MONTHLY_CASH_GAP.title,
  cliff: TRANSITION_MONTHLY_CASH_GAP.cliff,
  whyNow: "家族が費用を負担する見込みです。",
  checkItems: TRANSITION_MONTHLY_CASH_GAP.checkItems,
  linkedContactIds: TRANSITION_MONTHLY_CASH_GAP.linkedContactIds,
  sources: [],
  verifiedAt: null,
  reviewBy: null,
  rank: 30,
  urgency: "medium",
};

const CARD_C: PostKnowledgeCard = {
  id: HOME_OWNERSHIP_INTENT_GAP.id,
  title: HOME_OWNERSHIP_INTENT_GAP.title,
  cliff: HOME_OWNERSHIP_INTENT_GAP.cliff,
  whyNow: "契約への不安が示されています。",
  checkItems: HOME_OWNERSHIP_INTENT_GAP.checkItems,
  linkedContactIds: HOME_OWNERSHIP_INTENT_GAP.linkedContactIds,
  sources: [{ title: "登記事項の確認方法", organization: "法務省", url: "https://example.ohana-test.invalid/legal", accessedAt: "2026-01-01" }],
  verifiedAt: null,
  reviewBy: null,
  rank: 20,
  urgency: "high",
};

const CONTACT_HOSPITAL: PostContactCard = { id: "hospital", name: "入院先の病院", questions: [] };
const CONTACT_CARE_MANAGER: PostContactCard = { id: "care_manager", name: "担当ケアマネジャー", questions: [] };
const CONTACT_LEGAL: PostContactCard = { id: "legal", name: "司法書士・弁護士", questions: [] };
const CONTACT_REAL_ESTATE: PostContactCard = { id: "real_estate", name: "不動産会社", questions: [] };

function componentSource(): string {
  return readFileSync(fileURLToPath(new URL("../../../../components/KnowledgeCardsSection.ts", import.meta.url)), "utf-8");
}

describe("KnowledgeCardsSection: 0件", () => {
  test("1. cards=[]ならKnowledgeCardsSection自体がnullを返す", () => {
    assert.equal(KnowledgeCardsSection({ cards: [], contacts: [] }), null);
  });

  test("2. cards=[]ならrenderToStaticMarkupの出力が空文字列", () => {
    assert.equal(render([], []), "");
  });

  test("3.「今、見落とさないために」が存在しない", () => {
    assert.doesNotMatch(render([], [CONTACT_HOSPITAL]), /今、見落とさないために/);
  });

  test("4. section wrapper・空の余白用要素が存在しない", () => {
    const html = render([], []);
    assert.doesNotMatch(html, /<section|<div|<article/);
  });
});

describe("KnowledgeCardsSection: 1件", () => {
  const html = render([CARD_A], [CONTACT_HOSPITAL]);

  test("5. セクション見出しが1回だけ表示される", () => {
    const matches = html.match(/今、見落とさないために/g) ?? [];
    assert.equal(matches.length, 1);
  });

  test("6. titleが表示される", () => {
    assert.match(html, new RegExp(CARD_A.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  test("7. cliffが表示される", () => {
    assert.match(html, new RegExp(CARD_A.cliff.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  test("8. whyNowが表示される", () => {
    assert.match(html, /今、確認したい理由：入院中で、支援の調整がまだ終わっていません。/);
  });

  test("9. checkItemsがすべて表示される", () => {
    for (const item of CARD_A.checkItems) {
      assert.match(html, new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  });

  test("10. checkItemsがlist（ul/li）として表示される", () => {
    assert.match(html, /<h4[^>]*>確認すること<\/h4><ul[^>]*>(<li[^>]*>.*?<\/li>){4}<\/ul>/);
  });
});

describe("KnowledgeCardsSection: 2件", () => {
  test("11. 渡された順番で表示される（B→Aの順で渡すとB→Aの順で出る）", () => {
    const html = render([CARD_B, CARD_A], []);
    const indexB = html.indexOf(CARD_B.title);
    const indexA = html.indexOf(CARD_A.title);
    assert.ok(indexB !== -1 && indexA !== -1 && indexB < indexA);
  });

  test("12. UIがrankで再ソートしない（rankの大小と無関係に入力順のまま）", () => {
    // CARD_A.rank=10 < CARD_C.rank=20だが、渡す順序をC→Aにして、出力もC→Aのままであることを確認する
    const html = render([CARD_C, CARD_A], []);
    const indexC = html.indexOf(CARD_C.title);
    const indexA = html.indexOf(CARD_A.title);
    assert.ok(indexC !== -1 && indexA !== -1 && indexC < indexA);
  });

  test("13. 各idが安定したkey・識別に使われる（ソース上でcard.idをkeyに使用）", () => {
    assert.match(componentSource(), /key:\s*card\.id/);
  });

  test("14. 見出しはセクション全体で1回だけ", () => {
    const html = render([CARD_A, CARD_B], []);
    const matches = html.match(/今、見落とさないために/g) ?? [];
    assert.equal(matches.length, 1);
  });
});

describe("matchedContacts: 相談先の積集合", () => {
  test("15. linkedContactIdsとcontactsの一致する相談先だけ返す", () => {
    const result = matchedContacts(CARD_A, [CONTACT_HOSPITAL]);
    assert.deepEqual(result.map((c) => c.id), ["hospital"]);
  });

  test("16. contactsに存在しないlinkedContactIdは含めない", () => {
    // CARD_A.linkedContactIds = ["hospital","regional_support","care_manager"]。
    // contactsにはhospitalしか無い場合、hospitalだけが返る。
    const result = matchedContacts(CARD_A, [CONTACT_HOSPITAL]);
    assert.deepEqual(result.map((c) => c.id), ["hospital"]);
  });

  test("17. 一致する相談先が0件なら空配列", () => {
    const result = matchedContacts(CARD_A, [CONTACT_LEGAL]);
    assert.deepEqual(result, []);
  });

  test("18. 複数一致時に重複しない", () => {
    const result = matchedContacts(CARD_A, [CONTACT_HOSPITAL, CONTACT_HOSPITAL]);
    assert.deepEqual(result.map((c) => c.id), ["hospital"]);
  });

  test("19. Card Cのテストデータ（実content）はlinkedContactIdsがlegalのみで、real_estateを含まない", () => {
    assert.deepEqual(CARD_C.linkedContactIds, ["legal"]);
    const result = matchedContacts(CARD_C, [CONTACT_LEGAL, CONTACT_REAL_ESTATE]);
    assert.deepEqual(result.map((c) => c.id), ["legal"]);
  });

  test("20. PostResult.contactsにlegalがある場合だけlegalを返す（無い場合は空配列）", () => {
    assert.deepEqual(matchedContacts(CARD_C, [CONTACT_HOSPITAL]), []);
    assert.deepEqual(
      matchedContacts(CARD_C, [CONTACT_LEGAL]).map((c) => c.id),
      ["legal"],
    );
  });

  test("linkedContactIdsの順番を保つ（contacts側の並びに依存しない）", () => {
    // CARD_A.linkedContactIds = ["hospital","regional_support","care_manager"]
    const result = matchedContacts(CARD_A, [CONTACT_CARE_MANAGER, CONTACT_HOSPITAL]);
    assert.deepEqual(
      result.map((c) => c.id),
      ["hospital", "care_manager"],
    );
  });
});

describe("KnowledgeCardsSection: 相談先の描画", () => {
  test("一致する相談先が0件なら「関連する相談先」見出し自体を表示しない", () => {
    const html = render([CARD_A], [CONTACT_LEGAL]);
    assert.doesNotMatch(html, /関連する相談先/);
  });

  test("一致する相談先がある場合はその名称を表示する", () => {
    const html = render([CARD_A], [CONTACT_HOSPITAL]);
    assert.match(html, /関連する相談先/);
    assert.match(html, /入院先の病院/);
  });

  test("real_estateがcontactsにあってもCard Cでは表示しない", () => {
    const html = render([CARD_C], [CONTACT_LEGAL, CONTACT_REAL_ESTATE]);
    assert.match(html, /司法書士・弁護士/);
    assert.doesNotMatch(html, /不動産会社/);
  });
});

describe("KnowledgeCardsSection: sources", () => {
  test("21. sources=[]なら「参考情報」領域を表示しない", () => {
    const html = render([CARD_A], []);
    assert.doesNotMatch(html, /参考情報/);
  });

  test("22. sourcesがある場合だけorganizationとtitleを表示する", () => {
    const html = render([CARD_C], []);
    assert.match(html, /参考情報/);
    assert.match(html, /法務省/);
    assert.match(html, /登記事項の確認方法/);
  });

  test("23. URLがある場合は正しいURLを使う", () => {
    const html = render([CARD_C], []);
    assert.match(html, /href="https:\/\/example\.ohana-test\.invalid\/legal"/);
  });

  test("24. nullのverifiedAt／reviewByを表示しない", () => {
    const html = render([CARD_A, CARD_C], []);
    assert.doesNotMatch(html, />null</);
  });

  test("25. PENDINGや仮情報を表示しない", () => {
    const html = render([CARD_A, CARD_B, CARD_C], []);
    assert.doesNotMatch(html, /PENDING|未設定/);
  });
});

describe("KnowledgeCardsSection: 内部情報を表示しない", () => {
  const html = render([CARD_A, CARD_B, CARD_C], [CONTACT_HOSPITAL, CONTACT_LEGAL]);

  test("26. rankを表示しない", () => {
    assert.doesNotMatch(html, /rank/i);
  });

  test("27. high／mediumを表示しない", () => {
    assert.doesNotMatch(html, /\bhigh\b|\bmedium\b/i);
  });

  test("28. reasonIdを表示しない", () => {
    assert.doesNotMatch(html, /reasonId/i);
  });

  test("29. enabledを表示しない", () => {
    assert.doesNotMatch(html, /enabled/i);
  });
});

describe("KnowledgeCardsSection: 決定論・非破壊", () => {
  test("30. 同じpropsから同じmarkupを返す", () => {
    const cards = [CARD_A, CARD_C];
    const contacts = [CONTACT_HOSPITAL, CONTACT_LEGAL];
    assert.equal(render(cards, contacts), render(cards, contacts));
  });

  test("31. cardsを変更しない", () => {
    const cards = [CARD_A, CARD_C];
    const before = JSON.parse(JSON.stringify(cards));
    render(cards, [CONTACT_HOSPITAL, CONTACT_LEGAL]);
    assert.deepEqual(cards, before);
  });

  test("32. contactsを変更しない", () => {
    const contacts = [CONTACT_HOSPITAL, CONTACT_LEGAL];
    const before = JSON.parse(JSON.stringify(contacts));
    render([CARD_A, CARD_C], contacts);
    assert.deepEqual(contacts, before);
  });

  test("33. UI側が最大2件処理やsortを再実装していない（.sort(・.slice(が無い）", () => {
    const source = componentSource();
    assert.doesNotMatch(source, /\.sort\(/);
    assert.doesNotMatch(source, /\.slice\(/);
  });
});

describe("結果画面への挿入位置", () => {
  test("KnowledgeCardsSectionは「1週間以内に確認しましょう」の後、「今後のために知っておきたいこと」の前に配置されている", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../../../../components/DiagnosisResultSections.tsx", import.meta.url)),
      "utf-8",
    );
    const indexWeekly = source.indexOf("1週間以内に確認しましょう");
    const indexKnowledgeCards = source.indexOf("<KnowledgeCardsSection");
    const indexFolded = source.indexOf("今後のために知っておきたいこと");
    assert.ok(indexWeekly !== -1 && indexKnowledgeCards !== -1 && indexFolded !== -1);
    assert.ok(indexWeekly < indexKnowledgeCards, "KnowledgeCardsSectionは「1週間以内に確認しましょう」より後にある");
    assert.ok(indexKnowledgeCards < indexFolded, "KnowledgeCardsSectionは「今後のために知っておきたいこと」より前にある");
  });

  test("結果画面はresult.knowledgeCardsとresult.contactsをそのまま渡している（rank sort等を挟まない）", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../../../../components/DiagnosisResultSections.tsx", import.meta.url)),
      "utf-8",
    );
    assert.match(source, /<KnowledgeCardsSection cards=\{result\.knowledgeCards\} contacts=\{result\.contacts\} \/>/);
  });
});
