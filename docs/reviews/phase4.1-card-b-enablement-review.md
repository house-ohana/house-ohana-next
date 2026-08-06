# Phase4.1 Card B 有効化前レビュー

対象コミット: `99cd4c9`（feat: enable Phase4.1 Card A）

このレビューは、Card B（`transition_monthly_cash_gap`）を本番で`enabled: true`にする前の
承認資料および回帰テストである。今回のレビュー・テスト作成では、本番
`lib/diagnosis/post/knowledgeCards/registry.ts`は一切変更していない。本番registryは
引き続き次の状態である。

- Card A（`discharge_support_start_gap`）: `enabled: true`
- Card B（`transition_monthly_cash_gap`）: `enabled: false`
- Card C（`home_ownership_intent_gap`）: `enabled: false`

Card Bの検証は、テスト内でのみ生成した「Card Bだけ`enabled: true`のテスト用registry」、
および「Card A・B両方`enabled: true`のテスト用registry」を`buildKnowledgeCardsForPostResult`／
`selectKnowledgeCards`へ注入する方式で行った。

## 1. 対象カード

`lib/diagnosis/post/knowledgeCards/content.ts`の`TRANSITION_MONTHLY_CASH_GAP`、
`lib/diagnosis/post/knowledgeCards/matchers.ts`の`matchTransitionMonthlyCashGap`から、
実際のコードの値をそのまま転記する（記憶・要約からの再現ではない）。

- **id**: `transition_monthly_cash_gap`
- **title**: 「家族が費用を負担する可能性がある場合でも、総額だけでは、負担する時期までは分かりません」
- **cliff**: 「家族が費用を負担する可能性がある場合でも、総額だけでは、支払いが重なる月や家族の立替えが始まる時期までは分かりません。今後3か月を月ごとに分けて確認します。」
- **checkItems**:
  1. 毎月入るお金
  2. 毎月続く支出
  3. その月だけ発生する支出
  4. 家族が支払う予定の費用と開始月
- **linkedContactIds**: `["fp"]`
- **sources**（`docs/reviews/phase4.1-knowledge-card-source-review.md`で採用・登録済み、3件）:
  1. `{ title: "サービスにかかる利用料", organization: "厚生労働省（介護サービス情報公表システム）", url: "https://www.kaigokensaku.mhlw.go.jp/commentary/fee.html", accessedAt: "2026-08-06" }`
  2. `{ title: "介護サービスにかかる概算の料金を知りたい", organization: "厚生労働省（介護サービス情報公表システム）", url: "https://www.kaigokensaku.mhlw.go.jp/help/page6.html", accessedAt: "2026-08-06" }`
  3. `{ title: "ライフプランシミュレーター", organization: "金融庁", url: "https://www.fsa.go.jp/policy/nisa2/lifeplan-simulator/", accessedAt: "2026-08-06" }`
- **verifiedAt**: `"2026-08-06"`
- **reviewBy**: `"2027-02-06"`
- **reasonId**: `moneyNeedsEarlyCheck`／`moneyUnclear`の値に応じて3種類（第3章参照）
- **rank**: `moneyNeedsEarlyCheck ? 15 : 30`
- **urgency**: `moneyNeedsEarlyCheck ? "high" : "medium"`

## 2. 表示条件

`matchTransitionMonthlyCashGap`の実装をそのまま正とする。

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

- **必須条件**: `v.familyContribution === true`（`variables.ts`: `c7 === "family_pays" || c7 === "mixed"`）。
  これだけが表示の唯一のゲートである。
- **moneyNeedsEarlyCheck**（`variables.ts`: `(moneyUnclear || familyContribution) && (isImmediateDeadline || isNearDeadline || activeSupportGap)`）は、
  表示するかどうかではなく、**reasonId・rank・urgencyの優先順位を上げる**変数である。
- **moneyUnclear**（`variables.ts`: `c7 === "unknown_amount" || c7 === "unknown"`）は、
  `familyContribution`が真であることを前提に、reasonIdを補足する変数である。
- **moneyUnclear単独では発火しない**: `familyContribution === false`の場合、`moneyUnclear`や
  `moneyNeedsEarlyCheck`がどのような値であっても`matched: false`になる（`if (!v.familyContribution)`が
  最初の分岐であり、他の変数を一切参照せずreturnするため）。この点は
  `lib/diagnosis/post/__tests__/knowledgeCardsMatchers.test.ts`の
  「3. moneyUnclear=true, familyContribution=false → 表示しない」で確認済み。

## 3. reasonId優先順位

`matchers.ts`の`resolveMoneyReasonId`から、実際の優先順位をそのまま転記する。

```ts
function resolveMoneyReasonId(v: PostVariables): KnowledgeReasonId {
  if (v.moneyNeedsEarlyCheck) return "money_family_contribution_urgent";
  if (v.moneyUnclear) return "money_family_contribution_and_unclear";
  return "money_family_contribution";
}
```

優先順位（`familyContribution === true`が前提。上から順に判定）:

1. `moneyNeedsEarlyCheck === true` → `money_family_contribution_urgent`
2. `moneyUnclear === true` → `money_family_contribution_and_unclear`
3. それ以外 → `money_family_contribution`

`familyContribution === false`の場合はそもそも`resolveMoneyReasonId`が呼ばれず、matcher全体が
`unmatched`になる（第2章参照）。

whyNow固定文（`lib/diagnosis/post/knowledgeCards/reasons.ts`より転記）:

- `money_family_contribution`: 「家族が費用を負担する可能性があると回答しているためです。」
- `money_family_contribution_and_unclear`: 「家族が費用を負担する可能性があり、費用の見通しもまだ明確でないためです。」
- `money_family_contribution_urgent`: 「家族が費用を負担する可能性があり、当面の支払い時期を早めに確認したい状況であるためです。」

## 4. rank・urgency

| 区分 | 条件 | rank | urgency |
|---|---|---|---|
| urgent Card B | `moneyNeedsEarlyCheck === true` | **15** | `high` |
| nonurgent Card B | `moneyNeedsEarlyCheck === false` | **30** | `medium` |

Card A（rank固定10）・Card C（rank固定20）と異なり、Card Bのrankは`moneyNeedsEarlyCheck`の
値によって2値のいずれかに変わる、3カード中唯一の可変rankカードである。

## 5. Card B単独ケース表

`familyContribution`と`moneyUnclear`は、いずれも単一の回答値`c7`から導出される
（`familyContribution`は`c7 ∈ {family_pays, mixed}`、`moneyUnclear`は`c7 ∈ {unknown_amount, unknown}`）。
そのため、両者を**同時に真にする回答は実回答からは生成できない**（B-01・B-05・B-06の一部）。
これらは`lib/diagnosis/post/__tests__/knowledgeCardsMatchers.test.ts`の`vars()`ファクトリ
（`PostVariables`を直接上書きする、matcher境界テスト専用の手法）で検証している。

| ケースID | familyContribution | moneyNeedsEarlyCheck | moneyUnclear | matched | reasonId | rank | urgency | 到達方法 |
|---|---|---|---|---|---|---|---|---|
| B-01 | true | true | true | true | money_family_contribution_urgent | 15 | high | matcher境界テスト（vars）※c7単一値では同時に成立しない |
| B-02 | true | true | false | true | money_family_contribution_urgent | 15 | high | 実回答（例: c7=family_pays, c2=within_7_days） |
| B-03 | true | false | true | true | money_family_contribution_and_unclear | 30 | medium | matcher境界テスト（vars）※c7単一値では同時に成立しない |
| B-04 | true | false | false | true | money_family_contribution | 30 | medium | 実回答（例: c7=family_pays、期限系フラグ無し） |
| B-05 | false | true | true | **false** | — | — | — | 実回答可（例: c7=unknown_amount, c2=within_7_days） |
| B-06 | false | false | true | **false** | — | — | — | 実回答可（例: c7=unknown_amount、期限系フラグ無し） |
| B-07 | false | false | false | **false** | — | — | — | 実回答可（baseline、c7=likely_sufficient） |

対応する既存テスト（`knowledgeCardsMatchers.test.ts`「matchTransitionMonthlyCashGap」describe、
今回新規追加なし・既存で完全カバー）:

- B-01 → テスト「8. moneyNeedsEarlyCheckとmoneyUnclearが両方true → urgent reasonを優先」（reasonIdのみ確認。rank/urgencyは`moneyNeedsEarlyCheck`のみに依存するためテスト5で保証済み）
- B-02 → テスト「5. familyContribution=true, moneyNeedsEarlyCheck=true → urgent reason, rank15, high」
- B-03 → テスト「6. familyContribution=true, moneyNeedsEarlyCheck=false, moneyUnclear=true → unclear reason, rank30, medium」
- B-04 → テスト「7. familyContribution=true, moneyNeedsEarlyCheck=false, moneyUnclear=false → base reason, rank30, medium」
- B-05 → テスト「4. moneyNeedsEarlyCheck=true, familyContribution=false → 表示しない」
- B-06 → テスト「3. moneyUnclear=true, familyContribution=false → 表示しない」
- B-07 → テスト「2. familyContribution=false → 表示しない」

## 6. Card Aとの競合ケース

本番ではCard Aが`enabled: true`である。Card Bの有効化を検討する際は、A+B同時成立を
必ず検証する。`selector.ts`の実装（`sorted.sort((a, b) => a.rank - b.rank || KNOWLEDGE_CARD_ORDER.indexOf(a.cardId) - KNOWLEDGE_CARD_ORDER.indexOf(b.cardId))`、
`slice(0, MAX_KNOWLEDGE_CARDS)`、`MAX_KNOWLEDGE_CARDS = 2`）により、rank昇順、同rankなら
固定カード順（A→B→C）、最大2件という規則で選ばれる。

### 正式なカード優先順（rank昇順）

1. Card A：rank 10（固定）
2. **urgent** Card B（`moneyNeedsEarlyCheck === true`）：rank 15
3. Card C：rank 20（固定）
4. **nonurgent** Card B（`moneyNeedsEarlyCheck === false`）：rank 30

したがって、A・B・Cがすべてmatchedかつenabledの場合、選択結果は**Card Bの緊急度によって
異なる**。urgent Card B（rank15）はCard C（rank20）より先に選ばれるが、nonurgent Card B
（rank30）はCard C（rank20）より後になり選ばれない。

| ケースID | Card A | Card B | Card C | registry | 期待結果 |
|---|---|---|---|---|---|
| AB-01 | 成立（rank10） | **urgent**成立（`moneyNeedsEarlyCheck=true`、rank15） | 不成立 | A・B enabled | `[A, B]`の順 |
| AB-02 | 成立（rank10） | **nonurgent**成立（`moneyNeedsEarlyCheck=false`、rank30） | 不成立 | A・B enabled | `[A, B]`の順 |
| AB-03 | 不成立 | **urgent**成立 | 不成立 | Bのみenabled | `[B]`（1件） |
| AB-04 | 不成立 | **nonurgent**成立 | 不成立 | Bのみenabled | `[B]`（1件） |
| AB-05 | 成立（rank10） | **urgent**成立（`moneyNeedsEarlyCheck=true`、rank15） | 成立（rank20） | A・B・C enabled | `[A, B]`（Cは最大2件制限により選ばれない） |
| AB-06（参考、nonurgent版） | 成立（rank10） | **nonurgent**成立（`moneyNeedsEarlyCheck=false`、rank30） | 成立（rank20） | A・B・C enabled | `[A, C]`（**nonurgent Card Bは選ばれない**。rank30はrank20のCard Cより後のため） |

**AB-05は明確にurgent Card Bのケースである**（`moneyNeedsEarlyCheck=true`、Card B rank=15、
Card A rank=10、Card C rank=20、選択結果`[A, B]`、Card Cは最大2件制限により選ばれない）。
AB-05はurgent Bの場合だけの結果であり、nonurgent Bの場合は次のAB-06のとおり異なる結果
（`[A, C]`）になる。

AB-06（nonurgent BとCの競合）は、既存の`knowledgeCardsBuilder.test.ts`
「buildKnowledgeCards: rank順と最大件数」describeの
「11. Card Bが通常rank30（A rank10, C rank20, B rank30）→ A・C」、および
`knowledgeCardsSelector.test.ts`「selectKnowledgeCards: 件数と並び順」describeの
「8. A rank10, C rank20, B rank30 → A, C」で、Step2〜Step3時点から既に検証済みである
（今回のCard B有効化レビューで新規追加したテストではない）。

AB-05（urgent BとCの競合）についても、`knowledgeCardsBuilder.test.ts`
「buildKnowledgeCards: rank順と最大件数」describeの
「10. Card BがmoneyNeedsEarlyCheck=true（A rank10, B rank15, C rank20）→ A・B」で
Step2時点から既に検証済みであり、今回`lib/diagnosis/post/__tests__/knowledgeCardsBuilder.test.ts`
「Card A+B競合ケース」describeへ、Card B有効化の文脈で改めて明示的なテストを追加した
（`AB-05: A・B・Cすべて発火・すべてenabled → 最大2件でA・Bが選ばれ、Cへ差し替わらない`）。

## 7. 相談先積集合ケース

Card Bの元`linkedContactIds`は、`content.ts`の実装（第1章参照）のとおり`["fp"]`（1件）である。

| ケースID | 最終contacts | 期待されるlinkedContactIds |
|---|---|---|
| C-B1 | fpがある | `["fp"]` |
| C-B2 | fpがない | Card Bは残る。`[]` |
| C-B3 | legalやreal_estateだけがある | Card Bは残る。`[]`。legalやreal_estateを追加しない |

Card Bを理由に`contacts`を追加することはない（`projectKnowledgeCardLinkedContacts`は
`content`側のIDと実際の`contacts`との積集合を取るだけの純粋関数であり、新しいcontactを
生成しない）。

## 8. UI表示確認

`components/KnowledgeCardsSection.ts`の現行実装（Card A有効化時と同一のコンポーネント、
今回UIは変更していない）を、Card Bのcontentで確認した。

- **Card Bのtitle**: `<h3>`として表示
- **cliff**: `<p>`として表示
- **checkItems**: 「確認すること」見出し＋`<ul><li>`の箇条書き（4件）
- **whyNow**: 「今、確認したい理由：」プレフィックス＋固定文
- **urgency表示**: 存在しない（rank・urgencyはUIのどこにも出力されない。Card Aと同じ仕様）
- **関連する相談先**: fpが最終contactsにある場合だけ「関連する相談先」見出し＋ファイナンシャル
  プランナー名を表示。無い場合は見出し自体を出力しない
- **参考情報**: 出典3件（B1・B2・B3）を表示。`organization｜title`をリンクテキストとして表示
- **出典3件**: B1「サービスにかかる利用料」（厚生労働省介護サービス情報公表システム）、
  B2「介護サービスにかかる概算の料金を知りたい」（同）、B3「ライフプランシミュレーター」（金融庁）
- **verifiedAt・reviewByのUI上の扱い**: データには存在するがUIには表示しない（Card Aと同じ設計）
- **linkedContactIds=[]時の扱い**: 「関連する相談先」領域自体を出力しない。カード本文・出典は
  そのまま表示する
- **外部リンク属性**: `target="_blank"` `rel="noopener noreferrer"`（既存仕様を維持）

C4（成年後見制度ページ）、およびCard A・Cの出典（「疾病・事業及び在宅医療に係る医療体制について」
「登記事項の確認方法」等）がCard B内へ混入しないことをテストで確認した
（`lib/diagnosis/post/__tests__/knowledgeCardsUi.test.ts`「Card B有効化前レビュー: Card B単独表示」）。

## 9. 文言レビュー

Card Bの現在の文章（title・cliff・checkItems、`content.ts`より）が、次の区別を保っているかを
確認した。

- **総額が分からない、とは断定しない**: title・cliffとも「総額だけでは、…時期までは分かりません」
  という限定的な表現であり、「総額そのものが分からない」とは述べていない。
- **支払い時期が分からない可能性を示す**: cliff「支払いが重なる月や家族の立替えが始まる時期
  までは分かりません」は、可能性の指摘にとどまり断定していない。
- **家族負担が確定したとは断定しない**: title・cliffとも「家族が費用を負担する**可能性がある**
  場合でも」という留保が一貫している（`docs/reviews/phase4.1-knowledge-card-source-review.md`の
  Card Bタイトルレビューで既に確認済みの境界を維持）。
- **介護費用の具体額を判定しない**: checkItemsは「毎月入るお金」「毎月続く支出」等の確認項目の
  見出しであり、具体的な金額や制度上の給付額を提示していない。
- **家族が払うべきだとは言わない**: 「べきだ」「必要がある」等の当為表現は使われていない。
- **保険や金融商品を勧めない**: checkItems・cliffのいずれにも、特定の保険・金融商品名や勧誘
  表現は含まれていない。
- **FP相談を強制しない**: `linkedContactIds: ["fp"]`は、最終`contacts`に実際にFPが含まれる
  場合だけ「関連する相談先」として提示されるものであり、強制的な誘導や新規CTAは無い
  （UIはリンクボタンではなく名称表示のみ）。

OHANAの原則「答えは出さない。決めない。整理して、崖だけ先に教える。」との適合について:
Card Bの現在の文章は、家族負担の**有無**をユーザー自身の回答（`familyContribution`）に委ね、
カード自体は「総額だけでは時期まで分からない」という一般的な事実を示すにとどまっている。
金額の適否・十分性の判定、支払い義務の有無、金融商品の推奨のいずれも行っていないため、
原則に適合していると判断した。文言の変更は今回提案していない。

## 10. スマホ表示確認項目

今回は本番Card Bを有効化しないため、実ブラウザ表示は必須ではない。静的HTML
（`lib/diagnosis/post/__tests__/knowledgeCardsUi.test.ts`および
`components/KnowledgeCardsSection.ts`のソース）で次を確認した。

- 長いタイトル（Card Bのtitleは44文字）が、通常のテキストノードとして描画される
  （`whitespace-nowrap`等、折り返しを禁止するクラスは無い。Card A有効化レビュー時に
  ソース全体を確認済みで、今回のCard B追加によるコンポーネント変更も無い）
- `<table>`要素や固定幅要素（`w-[数値px]`等）はコンポーネント内に存在しない
- checkItemsは`<ul><li>`による縦並びのリスト構造（`flex flex-col`）である
- 出典URL文字列はそのまま地の文として露出させず、`organization｜title`というリンクテキストの
  `href`属性としてのみ使用する
- Card AとBが2件表示される場合も、DOM順（Card A→Card Bの順で`render`に渡した順）が
  そのまま維持されることを確認した（`knowledgeCardsUi.test.ts`「Card B有効化前レビュー:
  A+B同時表示」「Card Aが先、Card Bが後（渡した順）」）
- Knowledge Cardsセクションは、既存の「あなたの状況」「まず、ここから（今日）」より後に
  配置される（Card A有効化時に確認済みのDOM順構造をそのまま維持。今回
  `components/DiagnosisResultSections.tsx`・`KnowledgeCardsSection.ts`は変更していない）

**実ブラウザ・実機での最終確認は、Card Bを本番`enabled: true`にするステップで実施する。**

## 11. 有効化判定

- [x] familyContribution必須（第2章、`matched=false`の唯一のゲート）
- [x] moneyUnclear単独では非表示（B-06、既存テスト「3.」で確認）
- [x] urgent reasonが最優先（第3章の優先順位、B-01・テスト「8.」で確認）
- [x] urgent時rank=15（テスト「5.」で確認）
- [x] nonurgent時rank=30（テスト「6.」「7.」で確認）
- [x] Card Aより後（AB-01・AB-02・AB-05で、rank10のCard Aが常に先に選ばれることを確認）
- [x] 最大2件制限を維持（AB-05でCard Cへ差し替わらないことを確認）
- [x] final contactsとの積集合（C-B1〜C-B3に対応するテストで確認）
- [x] 相談先0件でもカードを維持（C-B2・C-B3で確認）
- [x] 出典3件が正しい（第8章、UIテスト「出典3件が表示される」で確認）
- [x] Card A・Cの情報が混入しない（UIテスト「C4・Card A・Cの出典は混入しない」で確認）
- [x] 本番Card Bはまだenabled=false（`registry.ts`は今回未変更、全テストで確認）
- [x] 全テスト成功（485件、fail 0。今回の実行確認で確認）
- [ ] 実機ブラウザ確認は有効化時に実施（**未実施。Card B本番有効化ステップで行う**）
