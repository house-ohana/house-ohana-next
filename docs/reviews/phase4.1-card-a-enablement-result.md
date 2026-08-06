# Phase4.1 Card A 有効化結果

## 1. 有効化対象

- **id**: `discharge_support_start_gap`
- **title**: 「退院後の支援は、退院日と同じ日に始まるとは限りません」
- **有効化日**: 2026-08-06
- **直前レビュー文書**: `docs/reviews/phase4.1-card-a-enablement-review.md`
- **直前コミット**: `2960909`（test: prepare Phase4.1 Card A enablement）

## 2. registry状態

`lib/diagnosis/post/knowledgeCards/registry.ts`を次のとおり変更した（Card Aの`enabled`のみ）。

| id | ready | enabled（変更前） | enabled（変更後） |
|---|---|---|---|
| discharge_support_start_gap（Card A） | true | false | **true** |
| transition_monthly_cash_gap（Card B） | true | false | false（維持） |
| home_ownership_intent_gap（Card C） | true | false | false（維持） |

registryの順番（A→B→C）、`id`、`content`参照、`matcher`／`reasonId`／`rank`／`urgency`／`selector`／`sources`／`verifiedAt`／`reviewBy`はいずれも変更していない。

## 3. 本番表示条件

`docs/reviews/phase4.1-card-a-enablement-review.md`（第2〜4章）で確定した内容と同一。

**matcher条件**（`lib/diagnosis/post/knowledgeCards/matchers.ts`）:

```ts
const eligible = answers.c1 === "hospitalized" && (v.supportUnclear || v.supportPartlyUnclear || v.residenceUnclear);
```

**reasonId優先順位**:

1. `residenceUnclear && (supportUnclear || supportPartlyUnclear)` → `discharge_support_and_residence_gap`
2. `supportUnclear` → `discharge_support_not_arranged`
3. `supportPartlyUnclear` → `discharge_support_partly_arranged`
4. それ以外（`residenceUnclear`のみ） → `discharge_residence_undecided`

**urgency条件**: `v.isImmediateDeadline ? "high" : "medium"`（`isNearDeadline`は無関係）

**rank**: 常に`10`（固定値）

これらのコード自体は今回変更していない。

## 4. 本番回帰結果

`lib/diagnosis/post/__tests__/knowledgeCardsBuilder.test.ts`
（「Card A本番有効化後: 本番registry（省略）での確認」describe）、
`lib/diagnosis/post/__tests__/knowledgeCardsIntegration.test.ts`
（「Card A本番有効化後: 表示ケース・非表示ケース」describe）で、
registryを一切注入しない（＝本番`KNOWLEDGE_CARD_REGISTRY`を使う）呼び出しにより確認した。

| ケース | 結果 |
|---|---|
| Card A成立時 | `knowledgeCards.length === 1`、`id === "discharge_support_start_gap"` |
| Card A不成立時（入院中でない／入院中だが3変数すべてfalse） | `knowledgeCards === []` |
| Card Bのみ成立（Card A不成立） | `knowledgeCards === []` |
| Card Cのみ成立（Card A不成立） | `knowledgeCards === []` |
| Card B・C両方成立（Card A不成立） | `knowledgeCards === []` |
| 最終contactsとの積集合 | 元の`linkedContactIds`順を維持しつつ、`contacts`に実在するIDだけへ絞り込まれることを確認 |
| Card B・Cの非表示 | 上記いずれのケースでも`knowledgeCards`に`transition_monthly_cash_gap`／`home_ownership_intent_gap`が混入しないことを確認 |

## 5. 実ブラウザ確認

### 5.1 実施した確認方法

**Chrome DevTools Responsive Modeによる、ユーザーの手動確認。**

このリポジトリ・実行環境にはPlaywright・E2Eテスト環境・その他のブラウザ自動操作ツールが
導入されていないため（新規のブラウザ依存パッケージも追加していない）、Claude Code側では
実ブラウザの自動操作・スクリーンショット取得を行っていない。代わりに、次の手順で
ユーザーが手動確認を行った。

1. `npm run dev`でローカル開発サーバー（`http://localhost:3000`）を起動した（registryは
   変更せず、現状の`enabled: true`のCard Aをそのまま使用）。
2. 診断結果URLを、**手入力ではなく**実際の`lib/diagnosis/post/schema.ts`の
   `buildPostResultPath`（本番のURL生成関数そのもの）へ実際の回答オブジェクトを渡して生成し、
   `decodePostParams`で復号し元回答と完全一致することを確認した。
3. 生成した正規URLをユーザーがChrome DevTools Responsive Modeで開き、375×812・390×844の
   2つのviewportで、Consoleから`window.innerWidth`／`document.documentElement.clientWidth`／
   `document.documentElement.scrollWidth`等を用いた横方向overflow判定と、目視での表示確認を
   行った。

### 5.2 使用したviewport

- 375 × 812
- 390 × 844

いずれもChrome DevTools Responsive Modeで確認済み（390px側はDevTools上のプレビュー表示倍率が
50%だったが、CSS viewportの計測値自体は390×844であり、判定に影響しない）。

### 5.3 実ブラウザで使用した回答ケース

- **Card A表示ケース**（`buildPostResultPath`で生成、`decodePostParams`で復号し元回答と
  完全一致することを確認済み）:
  `c1=hospitalized, c2=within_7_days, c3=undecided, c4=not_arranged, c5=not_discussed, c6=no_home_issue, c7=likely_sufficient, c8=shared, s1=not_applied`
- **Card A非表示ケース**（同じく`buildPostResultPath`で生成、`decodePostParams`で復号成功を
  確認済み）:
  `c1=discharged, c2=mostly_settled, c3=return_home, c4=arranged, c5=wants_home, c6=no_home_issue, c7=likely_sufficient, c8=shared`

### 5.4 横方向overflowの計測結果

| viewport | viewportWidth | viewportHeight | clientWidth | scrollWidth | horizontalOverflow |
|---|---|---|---|---|---|
| 375×812（表示ケース・非表示ケースとも） | 375 | 812 | 375 | 375 | false |
| 390×844（表示ケース・非表示ケースとも） | 390 | 844 | 390 | 390 | false |

### 5.5 目視確認できたこと（Card A表示ケース）

- 「あなたの状況」がCard Aより前に表示される
- 「まず、ここから（今日）」がCard Aより前に表示される
- Card Aは初期表示の最優先情報（あなたの状況／まず、ここから）より後に配置されている
- 「今、見落とさないために」の見出しが1回だけ表示される
- Card Aのtitle（「退院後の支援は、退院日と同じ日に始まるとは限りません」）が自然に折り返される
- cliff本文がカード内に欠けずに収まる
- checkItemsが4件すべて表示される
- 相談先は「病院の退院支援担当者」だけが表示される（最終contactsとの積集合結果のみ）
- 出典2件（A1・A2）が表示される
- Card B・Card Cは表示されない
- Card Aは「1週間以内に確認しましょう」の後に配置されている
- Card Aは「今後のために知っておきたいこと」の前に配置されている
- 目視上、横方向の崩れ・はみ出しは無い

### 5.6 目視確認できたこと（Card A非表示ケース、c1=discharged）

- 「今、見落とさないために」が表示されない
- Card Aのtitleが表示されない
- Card A用の空白セクションが残らない
- 「あなたの状況」が正常に表示される
- 「まず、ここから（今日）」が正常に表示される
- 「今後のために知っておきたいこと」へ正常に続く
- 375×812・390×844のいずれもhorizontalOverflow=false

## 6. 最終判定

### 有効化承認可否

**Card Aの本番有効化: 承認可。**
コード変更（`registry.ts`のCard A `enabled: true`）・全自動テスト（443件）・TypeScript・
ESLint・build・URLベースのDOM構造確認に加え、第5章のとおりChrome DevTools Responsive Mode
（375×812・390×844）による実ブラウザでの目視確認・横方向overflow計測を完了し、
いずれも問題が見つからなかった。

### 残課題

Card Aについて、有効化を妨げる既知の課題は無い。

### Card B・Cは引き続き無効

`transition_monthly_cash_gap`・`home_ownership_intent_gap`は、`enabled: false`のまま維持した。
今回のコード変更はCard Aの`enabled`値1件だけである。

### 次回レビュー日

`2027-02-06`（`docs/reviews/phase4.1-knowledge-card-source-review.md`で定めたreviewBy、
全カード共通の6か月ごとの定期レビュー方針に従う）。
