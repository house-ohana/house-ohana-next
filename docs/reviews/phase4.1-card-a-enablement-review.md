# Phase4.1 Card A 有効化前レビュー

対象コミット: `1091b57`（feat: project knowledge card contacts in post results）

このレビューは、Card A（`discharge_support_start_gap`）を本番で`enabled: true`にする前の
承認資料および回帰テストである。今回のレビュー・テスト作成では、本番
`lib/diagnosis/post/knowledgeCards/registry.ts`は一切変更していない。Card A・B・Cは
引き続きすべて`enabled: false`である。Card Aの検証は、テスト内でのみ生成した
「Card Aだけ`enabled: true`のテスト用registry」を`buildKnowledgeCardsForPostResult`へ
注入する方式で行った（本番registryの一時変更・復元には依存していない）。

## 1. 対象カード

`lib/diagnosis/post/knowledgeCards/content.ts`の`DISCHARGE_SUPPORT_START_GAP`を、
要素ごとにそのまま転記する（記憶・要約からの再現ではない）。

- **id**: `discharge_support_start_gap`
- **title**: 「退院後の支援は、退院日と同じ日に始まるとは限りません」
- **cliff**: 「退院後に必要な移動、見守り、医療・介護・生活支援が、退院当日からすべて始まるとは限りません。最初の数日に支援の空白がないかを、退院前に確認します。」
- **checkItems**:
  1. 退院当日の移動手段
  2. 退院当日から最初の数日を誰が支えるか
  3. 医療・介護・生活支援が始まる日
  4. まだ決まっていない事項の担当者と確認期限
- **linkedContactIds**: `["hospital", "regional_support", "care_manager"]`
- **sources**（`docs/reviews/phase4.1-knowledge-card-source-review.md`で採用・登録済み、2件）:
  1. `{ title: "疾病・事業及び在宅医療に係る医療体制について", organization: "厚生労働省", url: "https://www.mhlw.go.jp/web/t_doc?dataId=00tc7580&dataType=1&pageNo=7", accessedAt: "2026-08-06" }`
  2. `{ title: "令和7年度地域の在宅医療の体制整備に向けた調査・連携支援事業", organization: "厚生労働省", url: "https://www.mhlw.go.jp/stf/newpage_72086.html", accessedAt: "2026-08-06" }`
- **verifiedAt**: `"2026-08-06"`
- **reviewBy**: `"2027-02-06"`
- **rank**: `10`（`matchers.ts`内で固定値、回答によって変化しない）
- **urgency条件**: `v.isImmediateDeadline ? "high" : "medium"`（`matchers.ts`より）

## 2. 表示条件

`lib/diagnosis/post/knowledgeCards/matchers.ts`の`matchDischargeSupportStartGap`から、
実際の条件式をそのまま転記する。

```ts
const eligible = answers.c1 === "hospitalized" && (v.supportUnclear || v.supportPartlyUnclear || v.residenceUnclear);
```

すなわち、基本条件は`answers.c1 === "hospitalized"`（入院中）であり、かつ次の少なくとも1つが
成立していること。

- `v.supportUnclear`（`variables.ts`: `c4 === "not_arranged" || c4 === "unknown"`）
- `v.supportPartlyUnclear`（`variables.ts`: `c4 === "partly_arranged"`）
- `v.residenceUnclear`（`variables.ts`: `c3 === "undecided"`）

`c1 !== "hospitalized"`の場合は、他の3変数がどのような値であってもmatched=falseになる
（`eligible`が`&&`で`c1`条件と直列につながっているため）。

## 3. reasonId優先順位

`matchers.ts`の`resolveDischargeReasonId`から、実際の優先順位をそのまま転記する。

```ts
function resolveDischargeReasonId(v: PostVariables): KnowledgeReasonId {
  if (v.residenceUnclear && (v.supportUnclear || v.supportPartlyUnclear)) return "discharge_support_and_residence_gap";
  if (v.supportUnclear) return "discharge_support_not_arranged";
  if (v.supportPartlyUnclear) return "discharge_support_partly_arranged";
  return "discharge_residence_undecided";
}
```

優先順位（上から順に判定、最初に一致した1件だけを採用）:

1. `residenceUnclear && (supportUnclear || supportPartlyUnclear)` → `discharge_support_and_residence_gap`
2. `supportUnclear` → `discharge_support_not_arranged`
3. `supportPartlyUnclear` → `discharge_support_partly_arranged`
4. （上記いずれも不成立、かつ`eligible`が真＝`residenceUnclear`のみ真）→ `discharge_residence_undecided`

同時成立時に下位reasonIdへ落ちないことは、`if`文が上から順に`return`する構造そのものにより
保証される。特に「`supportUnclear`と`supportPartlyUnclear`が同時に真」の場合でも
`residenceUnclear`が偽であれば2番目の`if`（`discharge_support_not_arranged`）で確定し、
3番目（`discharge_support_partly_arranged`）へは到達しない。これは
`lib/diagnosis/post/__tests__/knowledgeCardsMatchers.test.ts`の
「11. supportUnclear + supportPartlyUnclear（residenceUnclearなし）→ discharge_support_not_arranged」
で確認済み。

単独条件（他2フラグが偽）のreasonIdは、同ファイルへ今回追加した次の3テストで確認した。

- 「supportUnclearのみ（他2フラグfalse）→ discharge_support_not_arranged」
- 「supportPartlyUnclearのみ（他2フラグfalse）→ discharge_support_partly_arranged」
- 「residenceUnclearのみ（他2フラグfalse）→ discharge_residence_undecided」

## 4. urgency

`matchers.ts`の実装をそのまま正とする。

```ts
urgency: v.isImmediateDeadline ? "high" : "medium",
```

- `isImmediateDeadline`（`variables.ts`: `c2 === "within_7_days" || c2 === "urgent_after_discharge"`）が
  真のときだけ`urgency = "high"`になる。
- `isNearDeadline`（`c2 === "within_30_days" || c2 === "some_unresolved"`）はCard Aのurgency判定に
  **一切使用されていない**。「近い期限」だけでhighになることはない（下記A-08で確認）。
- 上記以外のケースはすべて`urgency = "medium"`。

## 5. 表示ケース表

いずれのケースも、実際の`PostValidAnswers`から`computePostVariables`を通して算出した変数を
使用している（変数単体fixtureではない）。テスト実装は
`lib/diagnosis/post/__tests__/knowledgeCardsMatchers.test.ts`
（発火条件・reason優先順・urgency）および
`lib/diagnosis/post/__tests__/knowledgeCardsBuilder.test.ts`
（「Card A有効化前レビュー: 単独enabled時の内容一致」describe）で検証済み。

| ケースID | 現在地(c1) | 期限(c2) | 支援準備(c4) | 退院後の住まい(c3) | 成立変数 | matched | reasonId | urgency | 想定linkedContactIds | 備考 |
|---|---|---|---|---|---|---|---|---|---|---|
| A-01 | hospitalized | within_7_days | not_arranged | return_home | supportUnclear, isImmediateDeadline | true | discharge_support_not_arranged | high | ["hospital","regional_support","care_manager"] | 即時期限＋支援未調整 |
| A-02 | hospitalized | date_unknown | partly_arranged | return_home | supportPartlyUnclear | true | discharge_support_partly_arranged | medium | ["hospital","regional_support","care_manager"] | 即時期限ではない |
| A-03 | hospitalized | date_unknown | arranged | undecided | residenceUnclear | true | discharge_residence_undecided | medium | ["hospital","regional_support","care_manager"] | 支援は明確・住まい未定 |
| A-04 | hospitalized | date_unknown | not_arranged | undecided | supportUnclear, residenceUnclear | true | discharge_support_and_residence_gap | medium | ["hospital","regional_support","care_manager"] | 支援未調整＋住まい未定 |
| A-05 | hospitalized | date_unknown | partly_arranged | undecided | supportPartlyUnclear, residenceUnclear | true | discharge_support_and_residence_gap | medium | ["hospital","regional_support","care_manager"] | 支援一部未調整＋住まい未定 |
| A-06 | hospitalized | date_unknown | arranged | return_home | （すべて偽） | false | — | — | — | 支援も住まいも明確 |
| A-07 | discharged | within_7_days | not_arranged | undecided | supportUnclear, residenceUnclear, isImmediateDeadline | false | — | — | — | 入院中でないため、他の変数が真でも不一致 |
| A-08 | hospitalized | within_30_days | not_arranged | return_home | supportUnclear, isNearDeadline | true | discharge_support_not_arranged | medium | ["hospital","regional_support","care_manager"] | 「近い期限」はhighにならないことの確認（第4章参照） |

（A-06・A-07はmatched=falseのため、reasonId・urgency・linkedContactIdsは該当なし。）

## 6. 相談先積集合ケース

Card Aの元`linkedContactIds`は`content.ts`のとおり`["hospital", "regional_support", "care_manager"]`。
テスト実装は`knowledgeCardsBuilder.test.ts`
（`projectKnowledgeCardLinkedContacts`／`buildKnowledgeCardsForPostResult`のテスト群、
Step6A・Step6Bで追加）で検証済み。

| ケースID | 最終contacts | 期待されるlinkedContactIds | 備考 |
|---|---|---|---|
| C-A1 | hospital, regional_support, care_manager（3件すべて） | ["hospital","regional_support","care_manager"] | 元の3件・元の順序を維持 |
| C-A2 | regional_supportのみ | ["regional_support"] | 一致する1件だけ残る |
| C-A3 | care_manager, hospital（contacts側は逆順） | ["hospital","care_manager"] | contacts側の順ではなく、カード側の順序を維持 |
| C-A4 | Card Aと無関係なcontact（例: legal）のみ | [] | Card A自体は残る。無関係なcontact idを追加しない |
| C-A5 | 空配列 | [] | Card A自体は残る |

## 7. UI表示確認項目

`components/KnowledgeCardsSection.ts`の現行実装をそのまま記録する（今回、UIは変更していない）。

- **見出し**: 「今、見落とさないために」（h2、`id="knowledge-cards-heading"`）
- **Card Aのtitle**: `<h3>`として表示
- **Card Aのcliff**: `<p>`として表示
- **checkItems**: 「確認すること」という`<h4>`見出し＋`<ul><li>`の箇条書きとして表示
- **whyNow**: 「今、確認したい理由：」というプレフィックス＋固定文を`<p>`として表示
- **urgency表示**: **存在しない**。`rank`・`urgency`（`high`/`medium`）はUIのどこにも出力されない
  （`lib/diagnosis/post/__tests__/knowledgeCardsUi.test.ts`「KnowledgeCardsSection: 内部情報を表示しない」で確認済み）
- **積集合後の相談先**: 「関連する相談先」という`<h4>`見出し＋`<ul><li>`の箇条書き。
  一致する相談先が0件の場合は、この見出し自体を含めて何も出力しない
- **参考情報／出典**: 「参考情報」という`<h4>`見出し＋`<ul><li>`の箇条書き。
  `sources.length === 0`の場合は、この見出し自体を含めて何も出力しない
- **Card Aの2出典**: `${source.organization}｜${source.title}`という文字列をリンクテキストとして表示
- **verifiedAt・reviewByの扱い**: **データには存在するがUIには表示しない**設計である
  （`PostKnowledgeCard.verifiedAt`／`reviewBy`はコンポーネント内で一切参照されていない）
- **linkedContactIdsが空のときの相談先表示**: 「関連する相談先」領域自体を出力しない
  （空の見出し・空のリストを出力しない）
- **sourcesが空でないこと**: Card Aは`sources.length === 2`のため、「参考情報」領域は必ず表示される
- **外部リンク属性の現在仕様**: `target="_blank" rel="noopener noreferrer"`
  （既存仕様を維持。今回変更していない）

今回のレビューでは、これらの現行UI仕様を変更する提案は行っていない。

## 8. 画面配置

`components/DiagnosisResultSections.tsx`のソース上の出現順を確認した結果、
Knowledge Cardsセクション（`<KnowledgeCardsSection ... />`）は次の位置にある。

1. 「1週間以内に確認しましょう」ブロックの**後**
2. 「今後のために知っておきたいこと」の折りたたみ（`<details>`）の**前**

`lib/diagnosis/post/__tests__/knowledgeCardsUi.test.ts`
「結果画面への挿入位置」describeで、静的HTML（実際にはソースコード文字列）の出現順として
検証済み。

## 9. スマホ初期表示への影響

House OHANAの最優先仕様（スマホ初期表示で優先すべき情報）:

1. あなたの状況
2. まず、ここから（今日）

`components/DiagnosisResultSections.tsx`のソース確認の結果、上記2見出しの実際の`<h2>`要素
（JSXコメントでの言及ではなく、実際にレンダリングされる見出し行）は、いずれも
Knowledge Cardsセクションの挿入位置より**前**にある。これは
`lib/diagnosis/post/__tests__/knowledgeCardsUi.test.ts`に今回追加したテスト
「あなたの状況・まず、ここから（今日）の実見出しは、KnowledgeCardsSectionより前にある」で確認した
（`lastIndexOf`で実見出し行を特定し、JSXコメント内の同一文言との偶然一致を避けている）。

今回はCSS・レイアウトを一切変更していない。**DOM順（ソースコード上の出現順）確認のみであり、
実際のブラウザ幅・実機スマホでのピクセル単位の確認は、Card Aを本番有効化する次ステップで
実施する。**

## 10. 有効化判定

今回のテスト結果に基づくチェック表。

- [x] matcher条件がケース表（第5章）どおり
- [x] reasonId優先順位が正しい（第3章、既存テスト＋今回追加3件で確認）
- [x] immediateのみhigh（`isNearDeadline`ではhighにならないことをA-08で確認）
- [x] final contactsとの積集合が正しい（第6章、C-A1〜C-A5に対応するテストで確認）
- [x] 相談先0件でもカードが残る（C-A4・C-A5相当のテストで確認）
- [x] Card B・Cは無効（本番registry・Card Aだけenabledなテスト用registryの双方で、
      Card B・Cの発火条件を満たす回答でもCard B・Cが混入しないことを確認）
- [x] 出典2件が正しい（第7章、`knowledgeCardsUi.test.ts`「Card A有効化前レビュー: 出典2件」で確認）
- [x] UI配置が正しい（第8章）
- [x] 初期表示の最優先情報より後（第9章、DOM順確認）
- [x] 本番registryはまだfalse（`registry.ts`は今回未変更、全テストで確認）
- [x] 全テスト成功（423件、fail 0。第13章参照）
- [ ] 実機スマホ確認は有効化後に実施（**未実施。Card A本番有効化ステップで行う**）
