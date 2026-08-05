# House OHANA「3分整理ナビ」m=post
# Phase3 成果物仕様書 v1.0

ステータス：
Phase3 Step1〜Step3実装済み。

- confirmedFacts
- unknownItems
- buildPostArtifacts
- Result画面接続

まで完了。

本書はPhase3成果物層の正式仕様書として保管する。

---

## 0. この文書の位置づけ

**上位文書**：`docs/00-architecture-post.md`（アーキテクチャ仕様書 v1.2）。本文書は同文書第3-5項「成果物層」を、Phase3 Step1〜Step3の実装内容にもとづいて具体化した下位文書である。両者が矛盾する場合はアーキテクチャ仕様書を優先する。

**対象範囲**：Phase3成果物層（Artifacts Layer）。具体的には`lib/diagnosis/post/artifacts/`配下の実装と、`PostResult.artifacts`を介したResult画面（`components/DiagnosisResultSections.tsx`）への接続。

**対象外**：m=pre・m=after、質問層（`questions.ts`）・判定層（`actions.ts`等）・URL検証層（`schema.ts`）の仕様、知識カード層（Phase4）、家族会議メモ・相談前準備リスト・専門家向けサマリー・印刷機能（いずれも第10章で扱う将来拡張）。

**Phase3の責務**：既存の診断結果（`PostResult`の既存フィールド）を変更せず、回答事実と変数層の確定フラグから、Result画面に追加提示する「今回整理できたこと」「まだ確認できていないこと」を組み立てること。

---

## 1. Phase3の目的

### 成果物層とは何か

成果物層は、質問層（`questions.ts`）・変数層（`variables.ts`）・判定層（`actions.ts`／`decisions.ts`／`insights.ts`／`contacts.ts`／`selfHelp.ts`／`consultation.ts`）が確定させた情報を読み取り、Result画面向けに新しい形へ組み立て直す層である。`lib/diagnosis/post/artifacts/`配下に実装される。

### 判定を行わない理由

成果物層が新しい医療・介護・法律・税務判定や、本人の能力判定を行わないのは、アーキテクチャ仕様書第2-1項「全出力層に共通する士業境界」に従うためである。House OHANAは診断・決定を行わず、事実の整理と提示にとどめる。この原則を成果物層でも徹底するため、Phase3の実装は「回答事実」「変数層の確定フラグ」「固定変換表」の3種類のみを読み、複合的な条件式を新たに組み立てることをしない。

### Result画面へ情報を追加する役割

成果物層は、既存の`firstAction`（最初の行動）・`nextActions`（次の行動）・`decideNow`／`decideLater`（判断事項）・`insights`（気を付けたいこと）・`contacts`（相談先）とは異なる切り口で、回答を「事実」として振り返れる形にする。行動を指示する既存層に対し、成果物層は状態を提示する層という役割分担を持つ。

### Phase3 Step1〜Step3で実装した範囲

- Step1〜2：`buildConfirmedFacts`（今回整理できたこと）・`buildUnknownItems`（まだ確認できていないこと）の生成ロジック
- Step3：`buildPostArtifacts`によるオーケストレーション、`PostResult.artifacts`への統合、`DiagnosisResultSections.tsx`への表示接続

---

## 2. データフロー

```
answers（PostValidAnswers）
  ↓
variables（computePostVariables の戻り値）
  ↓
buildConfirmedFacts(answers, variables)
  ↓
buildUnknownItems(variables)
  ↓
buildPostArtifacts(answers, variables)
  ↓
PostResult.artifacts
  ↓
DiagnosisResultSections（画面表示）
```

`buildPostArtifacts`は、`buildConfirmedFacts`と`buildUnknownItems`を呼び出して結果を束ねるだけのオーケストレータであり、**新しい判定を持たない**。`buildPostResult`（`lib/diagnosis/post/logic.ts`）内で、既存の`buildFirstAndNextActions`・`buildDecisions`等の呼び出しとは独立した1行として実行され、既存フィールドの計算順序・内容に影響しない。

```ts
// lib/diagnosis/post/logic.ts（抜粋）
const artifacts = buildPostArtifacts(answers, v);

return {
  // ...既存フィールド（無変更）...
  artifacts,
};
```

---

## 3. 型定義

すべて`lib/diagnosis/post/artifacts/types.ts`に定義する。

### `ArtifactFactItem`

```ts
type ArtifactFactItem = {
  id: string;
  text: string;
  priority: number;
  dedupeGroup: string;
};
```

confirmedFacts・unknownItemsの両方が共通で使う1項目の型。`priority`は成果物内の表示順専用の値であり、診断ロジックの優先順位（`moneyNeedsEarlyCheck`等）とは無関係。

### `PostArtifacts`

```ts
type PostArtifacts = {
  confirmedFacts: ArtifactFactItem[];
  unknownItems: ArtifactFactItem[];
};
```

`buildPostArtifacts`の戻り値の型。2つの成果物配列をまとめるだけの入れ物であり、それ自体は判定を持たない。

### `PostResult.artifacts`

既存の`PostResult`型（`lib/diagnosis/post/types.ts`）の末尾に、必須フィールドとして追加する。

```ts
export type PostResult = {
  // ...既存11フィールド（無変更）...
  artifacts: PostArtifacts;
};
```

任意（optional）フィールドにはしない。`PostResult`はURLへエンコードされず、リクエストごとに`buildPostResult(answers)`が新規に計算する派生オブジェクトであるため、この追加はURL互換性・`POST_SCHEMA_VERSION`に影響しない。

---

## 4. confirmedFacts仕様

「今回整理できたこと」を生成する`buildConfirmedFacts`（`lib/diagnosis/post/artifacts/buildConfirmedFacts.ts`）の仕様。

### 4-1 候補一覧

| ID | 回答ソース | dedupeGroup |
|---|---|---|
| `fact_c2_deadline` | C2（期限） | `c2_deadline` |
| `fact_c3_residence` | C3（住まいの方向） | `c3_residence` |
| `fact_c4_support` | C4（支援の調整状況） | `c4_support` |
| `fact_c5_wishes` | C5（本人の希望） | `c5_wishes` |
| `fact_c6_home_status` | C6（実家の状況） | `c6_home_status` |
| `fact_c7_money` | C7（費用の見通し） | `c7_money` |
| `fact_h1_home_intent` | H1（実家の意向） | `h1_home_intent` |
| `fact_ct1_contract` | CT1（本人の契約理解） | `ct1_contract` |

対象ソースはC2〜C7・H1・CT1の8つ。C1・C8・S1・H2はconfirmedFactsの候補に含めない。

### 4-2 表示条件

| ID | 表示条件 |
|---|---|
| `fact_c2_deadline` | `!variables.deadlineAnswerUnknown` |
| `fact_c3_residence` | 常時（C3に"unknown"相当の選択肢が無いため） |
| `fact_c4_support` | `!variables.supportAnswerUnknown` |
| `fact_c5_wishes` | `!variables.wishesAnswerUnknown` |
| `fact_c6_home_status` | `!variables.homeStatusAnswerUnknown` |
| `fact_c7_money` | `!variables.moneyAnswerUnknown` |
| `fact_h1_home_intent` | `variables.homeIntentAnswered`（かつ`answers.h1`が存在） |
| `fact_ct1_contract` | `variables.contractUnderstandingAnswered && !variables.contractAnswerUnknown`（かつ`answers.ct1`が存在） |

いずれも`variables.ts`の単一フラグの真偽、または単一の回答値の存在確認のみで判定し、複数回答を組み合わせた条件式を成果物層で新たに組み立てない。

### 4-3 固定文変換

`lib/diagnosis/post/artifacts/factPhrases.ts`が、回答値ごとの固定文と`artifactPriority`を持つ変換表を提供する。生成AI・自由文章生成・テンプレート結合は使わず、値から表を引くだけの参照で構成する。

- **C2**：C1の値（`hospitalized`／`facility_search`／`discharged`）に応じて3系統の表（`C2_HOSPITALIZED_FACT`／`C2_FACILITY_SEARCH_FACT`／`C2_DISCHARGED_FACT`）を`c2Fact(answers)`関数で切り替える。「退院」「住み替え・入居」の文脈を混同しない。
- **C3**：C1が`facility_search`かどうかで2系統の表（`C3_DISCHARGE_STYLE_FACT`／`C3_RELOCATION_STYLE_FACT`）を`c3Fact(answers)`関数で切り替える。「退院後」と「今後の住まいは」の表現を混同しない。
- **C4〜C7**：`C4_FACT`／`C5_FACT`／`C6_FACT`／`C7_FACT`として、回答値ごとの直接テーブル（`literal unknown`を除く）を持つ。
- **H1**：`H1_FACT`として、`undecided`を含む全5値の直接テーブルを持つ（H1に"unknown"相当の選択肢は無いため）。
- **CT1**：`CT1_FACT`として、`literal unknown`を除く4値の直接テーブルを持つ。本人の理解度・判断能力を断定せず、「ご家族から見て〜との回答です」という報告形式の文言に統一する。

C6・H1の文言は、成果物上「実家」を「ご本人の家」へ統一して表現する。

### 4-4 artifactPriority

`artifactPriority`は、質問ID（どの質問か）ではなく、**回答が示す状態の重要度**にもとづいて回答値ごとに個別設定する数値である。未調整・未決定・費用負担の懸念など、次の行動に関係する事実ほど小さい値（高優先）を、支援が整っている・本人希望が明確といった安定した事実ほど大きい値（低優先）を割り当てる。

confirmedFactsの生成では、8ソースの候補をすべて単一の候補プールへ入れ、`artifactPriority`昇順で並べる。質問ごとに表示枠を固定的に予約する方式は採らない。

**tie-break**：`artifactPriority`が同値の場合、`SOURCE_ORDER`（C2→C3→C4→C5→C6→C7→H1→CT1の順）で決定論的に順序を確定する。

### 4-5 最大件数

最大5件（`MAX_CONFIRMED_FACTS`）。`artifactPriority`昇順に並べたのち、`dedupeGroup`ごとに1件だけ残す重複排除を行い、先頭から5件を返す。候補が5件を超える場合は、優先度の低い候補から順に表示から外れる。

### 4-6 回答分類

| 回答の種類 | 扱い |
|---|---|
| literalな`unknown` | confirmedFactsの候補から除外する（unknownItemsの対象、第5章） |
| `undecided`（H1） | 「まだ決めていない」という確定した回答事実として、中立的な文言でconfirmedFactsに含める |
| `not_confirmed`（CT1） | 「まだ確認していない」という確定した回答事実として、中立的な文言でconfirmedFactsに含める |
| `not_arranged`／`partly_arranged`（C4） | それぞれの状態に合う固定文でconfirmedFactsに含める |
| `considering`／`not_discussed`／`hard_to_confirm`（C5） | 同上 |
| `unknown_amount`（C7） | 「足りるかどうかまだ分かっていない」という確定した回答事実として、literalな`unknown`とは区別してconfirmedFactsに含める |

`undecided`・`not_confirmed`・`not_arranged`等は、いずれもliteralな`unknown`と同一視せず、また確定済み・決定済みと誤読されない中立的な文言で扱う。

---

## 5. unknownItems仕様

「まだ確認できていないこと」を生成する`buildUnknownItems`（`lib/diagnosis/post/artifacts/buildUnknownItems.ts`）の仕様。

### 5-1 候補一覧

| ID | 回答ソース | dedupeGroup |
|---|---|---|
| `unknown_c2_deadline` | C2 | `c2_deadline` |
| `unknown_c4_support` | C4 | `c4_support` |
| `unknown_c5_wishes` | C5 | `c5_wishes` |
| `unknown_c7_money` | C7 | `c7_money` |
| `unknown_s1_care` | S1（要介護認定・ケアマネジャー） | `s1_care` |
| `unknown_c6_home_status` | C6 | `c6_home_status` |
| `unknown_h2_ownership` | H2（実家の名義） | `h2_ownership` |
| `unknown_ct1_contract` | CT1 | `ct1_contract` |

### 5-2 表示条件

| ID | 表示条件 |
|---|---|
| `unknown_c2_deadline` | `variables.deadlineAnswerUnknown` |
| `unknown_c4_support` | `variables.supportAnswerUnknown` |
| `unknown_c5_wishes` | `variables.wishesAnswerUnknown` |
| `unknown_c7_money` | `variables.moneyAnswerUnknown` |
| `unknown_s1_care` | `variables.careAnswerUnknown` |
| `unknown_c6_home_status` | `variables.homeStatusAnswerUnknown` |
| `unknown_h2_ownership` | `variables.ownershipUnclear` |
| `unknown_ct1_contract` | `variables.contractAnswerUnknown` |

いずれも`variables.ts`の単一フラグが真であることのみを条件とする。

### 5-3 状態文

unknownItemsの固定文は、「退院・入居の予定時期を確認しましょう」のような行動指示文ではなく、「退院・入居の予定時期は、まだ確認できていません。」という状態描写文で統一する。

行動を指示する役割は、既存の`firstAction`・`nextActions`がすでに担っている。unknownItemsが同じ行動指示の形を取ると役割が重複するため、unknownItemsは「何が事実としてまだ分かっていないか」を提示するだけの状態文に限定し、行動の指示は既存層に委ねる。

### 5-4 priority・最大件数・dedupeGroup

各候補は固定の`priority`（10刻みで10〜80）を持つ。回答値には依存しない、候補単位の値である。`priority`昇順に並べたのち、`dedupeGroup`ごとに1件だけ残し、先頭から最大6件（`MAX_UNKNOWN_ITEMS`）を返す。

### 5-5 confirmedFactsとの相互排他

同じ回答ソースについて、confirmedFactsとunknownItemsの表示条件は互いに否定の関係にある（例：C4は`supportAnswerUnknown`が偽ならconfirmedFacts候補、真ならunknownItems候補）。そのため、同一の`dedupeGroup`がconfirmedFactsとunknownItemsの両方に同時に出現することはない。

---

## 6. Result画面への接続

### buildPostResult

`lib/diagnosis/post/logic.ts`の`buildPostResult`内で、既存の`build*`関数群の呼び出しとは独立して`buildPostArtifacts(answers, v)`を呼び出し、戻り値の`artifacts`フィールドへ格納する。既存フィールドの計算・呼び出し順序には変更を加えない。

### DiagnosisResultSections

`components/DiagnosisResultSections.tsx`が、`result.artifacts.confirmedFacts`・`result.artifacts.unknownItems`の文言をそのまま描画する。表示コンポーネントは回答値・変数を直接参照せず、`PostResult`が持つ値を描画するだけである。

**表示位置・表示順**：

```
あなたの状況 ＋ まず、ここから（今日）
  ↓
1週間以内に確認しましょう
  ↓
今後のために知っておきたいこと（折りたたみ）
  ↓
今回整理できたこと          ← Phase3
  ↓
まだ確認できていないこと      ← Phase3
  ↓
相談の前に準備すると良いこと
  ↓
保存・共有
  ↓
OHANA相談窓口
```

**空配列**：`confirmedFacts`・`unknownItems`がそれぞれ空配列の場合、対応する見出し（`<h2>`）ごと表示しない。

**スマホ初期表示へ影響しない理由**：Phase3の2セクションは「今後のために知っておきたいこと」より後、画面の下方に配置されている。「あなたの状況」「まず、ここから（今日）」を含む初期表示範囲のマークアップ・文字数は変更していない。

---

## 7. テスト仕様

### artifacts.test.ts

`lib/diagnosis/post/__tests__/artifacts.test.ts`に30件のテストを持つ。以下を検証する。

- literalな`unknown`と`undecided`／`not_confirmed`等の排他分類（confirmedFacts／unknownItemsのどちらに出るか）
- 費用不明・H1/CT1の注意回答が、安定回答よりartifactPriorityで優先されること
- 同一priority時のtie-breakが`SOURCE_ORDER`どおり決定論的であること
- dedupeGroupによる重複排除後、最大件数（confirmedFacts5件／unknownItems6件）を超えないこと
- 同一入力に対する決定論性（同じID・文章・順序が返る）
- 到達可能な3シナリオ（低情報状態／支援枝到達／実家売却枝到達）で、最終的に選ばれるconfirmedFacts・unknownItemsが仕様どおりであること
- `factPhrases.ts`の固定変換表の`artifactPriority`が、設計意図（注意回答＞安定回答）を満たすこと
- unknownItemsの全候補が行動指示文ではなく状態文であること

### logic.test.ts内のPhase3関連テスト

`lib/diagnosis/post/__tests__/logic.test.ts`に36件のPhase3関連テストを持つ。

- `supportAnswerUnknown`等9フラグの真偽（literalな`unknown`のみを表すこと、既存フラグとは基準が異なること）
- `buildPostResult(...).artifacts`が`buildConfirmedFacts`／`buildUnknownItems`の直接呼び出し結果と一致すること（PostResult接続）
- confirmedFacts・unknownItemsが空になりうる回答でも`buildPostResult`が正常に返ること
- artifacts追加後も、既存フィールド（`firstAction`等）の値が変わらないこと（既存回帰）
- unknownItemsの全文が状態文で終わること
- `POST_SCHEMA_VERSION`が変更されていないこと

### 現在のテスト件数

| ファイル | 件数 |
|---|---|
| `artifacts.test.ts` | 30 |
| `logic.test.ts`（Phase3関連） | 36（全119件中） |
| `logic.test.ts`（Phase3以前からの既存分） | 83 |
| `mode.test.ts` | 7 |
| **合計** | **156** |

全156件がpassし、`tsc --noEmit`・`eslint`・`build`もエラーなしで完了することを確認済み。

---

## 8. 既存診断ロジックとの境界

Phase3 Step1〜Step3では、以下を変更していない。

- `firstAction`／`nextActions`（`actions.ts`）
- `decisions`（`decisions.ts`）
- `insights`（`insights.ts`）
- `contacts`（`contacts.ts`）
- `selfHelp`（`selfHelp.ts`）
- `consultation`（`consultation.ts`）
- `schema`（`schema.ts`）
- `questions`（`questions.ts`）
- `POST_SCHEMA_VERSION`（`"4.0"`のまま）
- URL互換性（`PostResult`はURLへエンコードされない派生オブジェクトのため無影響）
- m=pre（`lib/diagnosis/pre/*`）
- m=after関連

---

## 9. 成果物設計原則

Phase3の実装から読み取れる設計原則を以下に整理する。

1. **成果物層は診断しない**：医療・介護・法律・税務上の新しい判定を持たない。
2. **判定を書かない**：`buildConfirmedFacts`／`buildUnknownItems`／`buildPostArtifacts`はいずれも新しい条件式を組み立てず、既存フラグ・固定表の参照のみで構成する。
3. **生回答から複合条件を再判定しない**：表示条件はすべて`variables.ts`の単一フラグの真偽、または単一の回答値の直接参照で決める。
4. **変数層フラグを利用する**：unknown状態・到達状態の判定は、成果物層でraw値の`undefined`チェックを行わず、`variables.ts`の派生フラグ（`homeIntentAnswered`等）を介する。
5. **固定文変換のみ行う**：`factPhrases.ts`は回答値から文言・優先度を引くだけの静的テーブルで構成する。
6. **AI文章生成を行わない**：生成AI・自由文章生成・テンプレート結合による文章生成は一切行わない。
7. **決定論**：同じ入力には常に同じ出力（ID・文章・順序）を返す。
8. **最大件数を超えない**：confirmedFactsは5件、unknownItemsは6件を上限とする。
9. **空見出しを出さない**：候補が0件の成果物は、見出しごと非表示にする。
10. **士業判断をしない**：本人の判断能力・理解力を断定する表現を避け、「ご家族から見て〜との回答です」という報告形式に統一する。
11. **既存診断ロジックへ影響しない**：`actions.ts`等の判定層・`schema.ts`・`questions.ts`・`POST_SCHEMA_VERSION`はいずれも変更しない。

---

## 10. Phase3 Step4候補（今後追加予定の拡張）

アーキテクチャ仕様書第3-5項が成果物層の責務として挙げる項目のうち、Step1〜Step3で実装した「今回整理できたこと」「まだ確認できていないこと」に続き、今後の拡張として次を想定する。

- 家族会議メモ
- 相談前準備リスト
- 専門家向け相談サマリー
- 印刷（印刷用CSS・既存印刷ボタンとの結線）
- 専門家向け表示（専門家別に見せ方を変える表示モード）

いずれも、本文書第9章の設計原則（成果物層は診断しない・固定文変換・決定論・最大件数・既存診断ロジックへ影響しない等）を踏襲して設計する。着手順序・詳細仕様は、アーキテクチャ仕様書のPhase3.5「実利用・有用性検証」を経たうえで、別途指示書として定める。

---

## 付記：改訂履歴

- v1.0（本版）：Phase3 Step1〜Step3（confirmedFacts／unknownItems／buildPostArtifacts／Result画面接続）の実装内容を、正式仕様書として初めて文書化。
