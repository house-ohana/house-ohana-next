# Phase4.1 Card B 有効化結果

## 1. 有効化対象

- **id**: `transition_monthly_cash_gap`
- **title**（コピーレビュー承認後の確定文言、詳細は5.3章参照）: 「家族による費用負担がいつ必要になるかも確認しておきましょう」
- **有効化日**: 2026-08-06
- **直前レビュー文書**: `docs/reviews/phase4.1-card-b-enablement-review.md`
- **直前コミット**: `9402dcf`（test: prepare Phase4.1 Card B enablement）

## 2. registry状態

`lib/diagnosis/post/knowledgeCards/registry.ts`を次のとおり変更した（Card Bの`enabled`のみ）。

| id | ready | enabled（変更前） | enabled（変更後） |
|---|---|---|---|
| discharge_support_start_gap（Card A） | true | true | true（維持） |
| transition_monthly_cash_gap（Card B） | true | false | **true** |
| home_ownership_intent_gap（Card C） | true | false | false（維持） |

registryの順番（A→B→C）、`id`、`content`参照、`matcher`／`reasonId`／`rank`／`urgency`／`selector`／`sources`／`verifiedAt`／`reviewBy`はいずれも変更していない。

## 3. 本番表示条件

`docs/reviews/phase4.1-card-b-enablement-review.md`（第2〜3章）で確定した内容と同一。

**matcher条件**（`lib/diagnosis/post/knowledgeCards/matchers.ts`）:

```ts
export function matchTransitionMonthlyCashGap(v: PostVariables): KnowledgeCardMatch {
  const cardId: KnowledgeCardId = "transition_monthly_cash_gap";
  if (!v.familyContribution) {
    return { matched: false, cardId };
  }
  return {
    matched: true,
    cardId,
    reasonId: resolveMoneyReasonId(v),
    rank: v.moneyNeedsEarlyCheck ? 15 : 30,
    urgency: v.moneyNeedsEarlyCheck ? "high" : "medium",
  };
}
```

**必須条件**: `v.familyContribution === true`（`c7 === "family_pays" || c7 === "mixed"`）。これだけが表示の唯一のゲートである。`moneyUnclear`単独では発火しない。

**reasonId優先順位**:

1. `moneyNeedsEarlyCheck` → `money_family_contribution_urgent`（rank15・urgency=high）
2. `moneyUnclear`（`moneyNeedsEarlyCheck`ではない） → `money_family_contribution_and_unclear`（rank30・urgency=medium）
3. それ以外 → `money_family_contribution`（rank30・urgency=medium）

これらのコード自体は今回変更していない。

### 3.1 A+B・A+B+C競合順序（本番registryでの実際の挙動）

- Card Bのみ発火・enabled: Bのみ1件返る。
- Card A・B両方発火（本番registryはA・Bともにenabled）: `[Card A, Card B]`の順（rank10 < rank15または30のため常にAが先）。
- Card A・B・C全部の条件が発火する回答でも、Cは`enabled: false`のため混入せず、結果は常に`[Card A, Card B]`のまま（最大2件制限に達する前にCが除外される）。
- これは、テスト用registryでA・B・C全部を`enabled: true`にした場合の競合順序（urgent B→`[A, B]`、nonurgent B→`[A, C]`、`docs/reviews/phase4.1-card-b-enablement-review.md`第6章のAB-05／AB-06）とは別の話である。本番では常にCが`enabled: false`なので、nonurgent Bのケースでも本番では`[A, B]`になる（テスト用registry限定のAB-06「A+C」パターンは、本番では発生しない）。

## 4. 本番回帰結果

`lib/diagnosis/post/__tests__/knowledgeCardsBuilder.test.ts`
（「Card A本番有効化後: 本番registry（省略）での確認」describe、AB_URGENTを使う本番回帰テスト）、
`lib/diagnosis/post/__tests__/knowledgeCardsIntegration.test.ts`
（「Card B本番有効化後: 本番registry（省略）での確認」describe、新規追加）、
`lib/diagnosis/post/__tests__/knowledgeCardsSelector.test.ts`
（「selectKnowledgeCards: 本番registryとenabled」describe）、
`lib/diagnosis/post/__tests__/knowledgeCardsContent.test.ts`
（registry状態・ready/enabled分離のテスト）で、
registryを一切注入しない（＝本番`KNOWLEDGE_CARD_REGISTRY`を使う）呼び出しにより確認した。

| ケース | 結果 |
|---|---|
| Card B（nonurgent）単独成立時 | `knowledgeCards.length === 1`、`id === "transition_monthly_cash_gap"`、`rank === 30`、`urgency === "medium"` |
| Card B（urgent）単独成立時 | `knowledgeCards.length === 1`、`id === "transition_monthly_cash_gap"`、`rank === 15`、`urgency === "high"` |
| Card A・B urgent同時成立時 | `knowledgeCards` は `["discharge_support_start_gap", "transition_monthly_cash_gap"]` の順で2件 |
| Card A・B・C全部の条件成立時 | `knowledgeCards` は `["discharge_support_start_gap", "transition_monthly_cash_gap"]` のまま（Cは混入しない） |
| familyContribution不成立時 | `knowledgeCards === []` |
| 最終contactsとの積集合 | Card Bのlinked先は`content.ts`の`linkedContactIds`（`["fp"]`）と`contacts`の積集合のみに絞り込まれる |
| firstAction／nextActions | Card B有効化前後で完全一致（`buildFirstAndNextActions(a, v)`の結果と一致することを新規テストで確認） |
| contacts | Card B有効化前後で完全一致（`buildContacts(a, v)`の結果と一致することを新規テストで確認、Card Bのためにcontactsが増えないことを確認） |
| Card Cの非表示 | 上記いずれのケースでも`knowledgeCards`に`home_ownership_intent_gap`が混入しないことを確認 |

全テストスイート: 497件中497件成功（Card B有効化前は485件、今回7件を本番registry状態の更新に合わせて修正し、UI 5件・integration 7件を新規追加）。`npx tsc --noEmit`・`npm run lint`・`npm run build`はいずれもエラー0件（`npm run lint`は本テスト作業と無関係な既存warning無し、本作業中に発生した2件のunused-var警告は修正済み）。

## 5. コピー改善・text-balance追加・実ブラウザ確認

このセクションは、時系列に沿って4段階に分けて記録する（各段階の事実を混同しないため）。

### 5.1 段階1（Step7B時点）: 旧コピーでのDOM構造一次確認（curl + Node.jsタグ直付け検索）

Card B本番有効化（`registry.ts`のenabled変更）の直後、まだ本章5.3のコピー改善を行う前の時点で、
Claude Code側で以下の方法により一次確認を行った。この時点ではPlaywright等のブラウザ自動操作ツールが
この環境に無いため、**実ビューポートでの目視・横方向overflow確認はまだ行っていない**。

1. `npm run dev`でローカル開発サーバーを起動。
2. 診断結果URLを、実際の`buildPostResultPath`へ実回答オブジェクトを渡して生成し、`decodePostParams`
   で復号し元回答と完全一致することを確認（4ケースすべて`ok === true`）。
3. curlで取得したSSR HTMLに対し、「`>text<`タグ直付けパターンでのDOM出現回数確認」（RSC
   ハイドレーションpayloadとの重複を避ける手法）をNode.jsスクリプトで実行。

| ケース | 確認項目 | 期待値 | 実際 |
|---|---|---|---|
| Card B（urgent）単独 | 見出し出現回数 | 1 | 1 |
| Card B（urgent）単独 | Card B titleの出現回数 | 1 | 1 |
| Card B（urgent）単独 | Card A titleが出現しない | 0 | 0 |
| A+B（urgent） | Card A・B titleがそれぞれ1回ずつ、A→Bの順 | 1／1／true | 1／1／true |
| A+B（urgent） | Card C titleが出現しない | 0 | 0 |
| A+B（nonurgent） | Card A・B titleがそれぞれ1回ずつ | 1／1 | 1／1 |
| Card B非表示 | 見出し・Card B titleが出現しない | 0／0 | 0／0 |

いずれも期待どおりであったが、この段階のDOM確認は**旧コピー（title「家族が費用を負担する可能性がある
場合でも、総額だけでは、負担する時期までは分かりません」等）に対するもの**であり、また実ビューポートでの
目視・横方向overflow・折り返しの確認は含まれない。この段階では有効化を最終承認していない。

### 5.2 段階2: Knowledge Cards A/B/Cのコピー改善（本文言をユーザー向けに全面改訂）

段階1の後、Card A/B/Cのtitle・cliff・reasonId別whyNow・checkItems、およびセクション共通UI文言
（見出し・理由接頭辞）について、ユーザーとの複数ラウンドの対照表レビュー・承認を経て、
`lib/diagnosis/post/knowledgeCards/content.ts`・`lib/diagnosis/post/knowledgeCards/reasons.ts`・
`components/KnowledgeCardsSection.ts`（見出し・理由接頭辞の2文字列のみ）を更新した。

- 変更対象: `title`／`cliff`／`checkItems`（content.ts）、11 reasonIdの`whyNow`（reasons.ts）、
  セクション見出し「今、見落とさないために」→「見落としがちなポイント」、理由接頭辞
  「今、確認したい理由：」→「確認すべき理由：」（KnowledgeCardsSection.ts）
- 変更対象外（今回未変更）: `matcher`／`variables`／`reasonId`（IDそのもの）／`rank`／`urgency`／
  `selector`／`registry`のenabled状態／`linkedContactIds`／`contacts`／`sources`／`verifiedAt`／
  `reviewBy`／schema／URL形式
- 承認済み最終文言はこの文書の第1章（title）および該当コミット差分（`content.ts`／`reasons.ts`）を正とする。

コピー改善後、Knowledge Cards関連テスト・全テスト（497件）・`npx tsc --noEmit`・`npm run lint`・
`npm run build`はいずれもエラー0件であることを確認した。

### 5.3 段階3: text-balance追加（Card B title折返し対応）

コピー改善後のユーザーによる実ビューポート確認（390×844）で、Card B titleが3行に折り返され、
末尾の「う」1文字だけが3行目に孤立する現象が見つかった。title文言・font-size・カード横幅・padding・
cliff／whyNow／checkItemsは変更せず、`components/KnowledgeCardsSection.ts`のCard title用`h3`要素の
`className`にのみ`text-balance`（Tailwind CSS v4のコアユーティリティ、`text-wrap: balance`に対応。
`tailwindcss@4.3.3`に標準搭載されていることを確認済み、追加パッケージ・設定変更なし）を追加した。

```diff
- createElement("h3", { className: "text-lg font-bold text-ohana-ink" }, card.title),
+ createElement("h3", { className: "text-lg font-bold text-ohana-ink text-balance" }, card.title),
```

`h3`要素以外への影響は無い。追加後、Knowledge Cards UIテスト・全テスト（497件）・`npx tsc --noEmit`・
`npm run lint`・`npm run build`はいずれもエラー0件であることを確認した。

### 5.4 段階4: 新コピー・text-balance適用後のDOM構造再確認（curl + Node.jsタグ直付け検索）

段階2・3の変更後、段階1と同じ手法で、新コピーに対するDOM構造の一次確認をClaude Code側で再実施した。
4ケースすべてのURLは`buildPostResultPath`で生成し、`decodePostParams`で復号一致を再確認済み。

| ケース | 確認項目 | 期待値 | 実際 |
|---|---|---|---|
| Card B（urgent）単独 | 見出し「見落としがちなポイント」出現回数 | 1 | 1 |
| Card B（urgent）単独 | Card B title（新コピー）・cliff（新コピー）・「確認すべき理由：」・urgent whyNow（新コピー）・checkItems4件（新コピー） | 各1 | 各1 |
| Card B（urgent）単独 | source3件（B1/B2/B3）がリンクタグ内に表示、Card A/Cのsourceは混入しない | 1／1／1、0／0 | 1／1／1、0／0 |
| A+B（urgent） | Card A title→Card B titleの順、Card A新title/cliff/checkItems4件、Card B urgent whyNow、Card C非表示 | すべてOK | すべてOK |
| A+B（nonurgent） | Card A title→Card B titleの順、Card A partly_arranged whyNow（新コピー）、Card B nonurgent whyNow（新コピー）、Card C非表示 | すべてOK | すべてOK |
| Card B非表示 | 見出し・Card B title非表示、「あなたの状況」は表示 | 0／0／1 | 0／0／1 |

いずれも期待どおりであった。ただし、この段階もHTML文字列上のDOM構造確認であり、実ビューポートでの
目視・横方向overflow・折り返し・実際のレンダリング崩れの有無は含まれない。

### 5.5 実ブラウザ確認用URL（`buildPostResultPath`で生成、`decodePostParams`で復号一致確認済み）

- **Card B（urgent）単独成立ケース**（Card Aは不成立）:
  `http://localhost:3000/diagnosis/result?m=post&v=4.0&c1=hospitalized&c2=within_7_days&c3=return_home&c4=arranged&c5=wants_home&c6=no_home_issue&c7=family_pays&c8=shared`
- **A+Card B（urgent）同時成立ケース**:
  `http://localhost:3000/diagnosis/result?m=post&v=4.0&c1=hospitalized&c2=within_7_days&c3=undecided&c4=not_arranged&c5=wants_home&c6=no_home_issue&c7=family_pays&c8=shared&s1=not_applied`
- **A+Card B（nonurgent）同時成立ケース**:
  `http://localhost:3000/diagnosis/result?m=post&v=4.0&c1=hospitalized&c2=date_unknown&c3=return_home&c4=partly_arranged&c5=wants_home&c6=no_home_issue&c7=family_pays&c8=shared&s1=not_applied`
- **Card B非表示ケース**（familyContribution不成立）:
  `http://localhost:3000/diagnosis/result?m=post&v=4.0&c1=discharged&c2=mostly_settled&c3=return_home&c4=arranged&c5=wants_home&c6=no_home_issue&c7=likely_sufficient&c8=shared`

### 5.6 ユーザーによる実ビューポート確認結果（新コピー・text-balance適用後、確認済み）

Chrome DevTools Responsive Modeにより、ユーザーが実画面で確認した結果。**4ケースすべて合格。**

**ケース1（Card B urgent単独）**: 375×812・390×844の両方で確認。

| viewport | clientWidth | scrollWidth | horizontalOverflow |
|---|---|---|---|
| 375×812 | 375 | 375 | false |
| 390×844 | 390 | 390 | false |

確認済み項目（両viewportとも）: 見出し「見落としがちなポイント」表示／Card B title（承認済みコピー）／
cliff（承認済みコピー）／「確認すべき理由：」／urgent whyNow（承認済みコピー）／checkItems4件／
FP相談先／source表示／レイアウト崩れなし／横スクロールなし。当初390×844でCard B title末尾の「う」1文字が
孤立していたが、5.3のtext-balance追加後、375×812・390×844ともに自然な3行折返しとなったことを実画面で
再確認済み。

**ケース2（Card A + Card B urgent）**: 390×844で確認。Card A→Card Bの順／Card A新title・新cliff／
Card A reason（`discharge_support_and_residence_gap`の承認済み文言）／Card A checkItems／Card B urgent
表示・text-balance／Card C非表示／見出し重複なし／カード間の表示崩れなし、いずれもOK。

**ケース3（Card A + Card B nonurgent）**: 390×844で確認。Card A→Card Bの順／Card A reason
（`discharge_support_partly_arranged`の承認済み文言、「必要なサポートが途切れる期間がないか」の表示を
確認）／Card B nonurgent reason（「支払いがかさなる時期や、家族による費用負担がいつ必要になるかを
早めに把握しておくことで、準備しやすくなります。」の表示を確認）／Card C非表示／見出し重複なし／
レイアウト崩れなし、いずれもOK。

**ケース4（Card B非表示）**: 390×844で確認。Card A・B・Cいずれも非表示／「見落としがちなポイント」が
空見出しとして残らない／前後の通常セクションが自然に続く、いずれもOK。

## 6. 最終判定

### 有効化承認可否

**Card Bの本番有効化（コピー改善・text-balance追加を含む）: 承認可。**
コード変更（`registry.ts`のCard B `enabled: true`、Knowledge Cards A/B/Cのコピー改善、Card title
`h3`への`text-balance`追加）・全自動テスト（497件）・TypeScript・ESLint・build・URLベースのDOM構造
確認（5.1・5.4）に加え、第5.6章のとおりユーザーによるChrome DevTools Responsive Mode
（375×812・390×844）での実ビューポート確認（新コピー・text-balance適用後）を完了し、4ケースすべて
合格した。

### 残課題

Card Bについて、有効化を妨げる既知の課題は無い。

### Card Cは引き続き無効

`home_ownership_intent_gap`は、`enabled: false`のまま維持した。今回のコード変更はCard Bの
`enabled`値、Knowledge Cards A/B/Cのコピー改善、およびCard title `h3`への`text-balance`追加である。

### 次回レビュー日

`2027-02-06`（`docs/reviews/phase4.1-knowledge-card-source-review.md`で定めたreviewBy、全カード共通の
6か月ごとの定期レビュー方針に従う）。
