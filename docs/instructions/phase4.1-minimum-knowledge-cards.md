# House OHANA「3分整理ナビ」m=post Phase4.1 最小崖カード実装指示書

## 0. この指示書の位置づけ

- 本書はPhase4.1実装時に使用する**一時的な作業指示書**である。
- 恒久仕様は`docs/03-phase4-knowledge-cards.md` v1.1である。
- 両者が矛盾する場合は**恒久仕様を優先**する。矛盾が見つかった場合は、推測で進めず、実装を止めて確認する。
- 対象は**m=postのみ**。m=pre・m=afterへの影響は与えない。
- Phase4.1では、3候補（Card A／B／C）から**最大2件**を表示する。
- 制度説明カードや相談窓口紹介カードは作らない（対象は「見落としやすい崖」を示すカードのみ）。
- 実行時AI生成は行わない。
- 固定・レビュー済み本文だけを使用する。
- **現在は指示書作成段階であり、まだ実装しない。**

**上位文書**：
- `docs/00-architecture-post.md`（アーキテクチャ仕様書 v1.2）
- `docs/01-phase2-question-architecture.md`（Phase2質問構造仕様書 v1.0）
- `docs/02-phase3-artifacts.md`（Phase3成果物仕様書 v1.0）
- `docs/03-phase4-knowledge-cards.md`（Phase4知識カード基盤仕様書 v1.1）

---

## 1. Phase4.1の実装目的

Phase4.1の目的は、「回答から、利用者が見落としやすい崖を最大2件示し、既存の行動・相談先へ接続できるかを検証する」ことである。

**knowledgeCardsは次を行う**：

- 見落としやすい崖を示す
- 今回なぜ関係するのかを示す
- 確認項目を整理する
- 既存の相談先へ接続する

**knowledgeCardsは次を行わない**：

- 診断
- 制度適用判定
- 医療・介護・法律・税務・不動産判断
- `actions`の生成
- `contacts`の生成
- 既存結果の上書き
- 不安を煽る断定

---

## 2. 実装対象と対象外

**Phase4.1対象**：

- `discharge_support_start_gap`
- `transition_monthly_cash_gap`
- `home_ownership_intent_gap`

**最大表示件数**：

- 2件
- 0件を許容する
- 0件の場合は見出しも表示しない

**Phase4.1対象外**：

- 地域包括支援センターそのものの説明カード
- ケアマネジャーそのものの説明カード
- 病院窓口そのものの説明カード
- 高額療養費
- 高額介護サービス費
- 保険適用判定
- 税務判断
- 契約の有効性判断
- 本人の判断能力の評価
- 売却・賃貸・解体の適否判断
- 新しい質問の追加
- URL回答スキーマの変更
- `POST_SCHEMA_VERSION`の変更

---

## 3. 利用者向け表示構造

カード1枚の表示要素は次に固定する。

- `title`
- `cliff`
- `whyNow`
- `checkItems`
- 関連する既存相談先への接続
- 出典・確認情報

利用者向けの見出し候補：**「今、見落とさないために」**

### 表示位置の調査結果

`components/DiagnosisResultSections.tsx`の既存の正式なセクション名と実際の描画順（上から下）は次のとおりである。

1. `あなたの状況`（`<h2>`、150行目付近）
2. `まず、ここから（今日）`（`<h2>`、154行目付近）… **firstAction**を含む
3. `1週間以内に確認しましょう`（`<h2>`、182行目付近）… **nextActions**（`今週のうちに見ておきたいこと`）を含む
4. `今後のために知っておきたいこと`（`<details><summary>`、227行目付近）… 折りたたみ。内部にコード上のコメントで明示された4つのグループ（後回し／気を付けたいこと／誰に、何を確認するか／自分でできること・専門家に確認すること）を持つ。指示書内の「既存の『4つの視点』」はこの折りたたみ内の4グループを指す。
5. `今回整理できたこと`（`<h2>`、307行目付近）… Phase3 confirmedFacts
6. `まだ確認できていないこと`（`<h2>`、314行目付近）… Phase3 unknownItems
7. `相談の前に準備すると良いこと`（`<h2>`、321行目付近）
8. OHANA相談窓口CTA（`<h2>`、338〜368行目付近）

**結論**：新セクション「今、見落とさないために」は、**3（1週間以内に確認しましょう）の閉じタグの直後、4（今後のために知っておきたいこと）の開始直前**へ挿入する。この位置は、firstAction・nextActionsより下、既存の「4つの視点」（4の折りたたみ内グループ）より上、という条件をすべて満たす。スマホの初期表示範囲（1・2）には入らず、firstActionの視認性（1・2のマークアップ）にも触れない。

UIは回答値やVariablesを直接参照しない。`PostResult.knowledgeCards`だけを描画する。

`urgency`による色分けは行わない。

---

## 4. 型定義

以下は型**案**であり、実装前にレビューする。

```ts
type KnowledgeCardId =
  | "discharge_support_start_gap"
  | "transition_monthly_cash_gap"
  | "home_ownership_intent_gap";

// 各カードのreasonIdを文字列Unionで定義する（第6章の一覧と対応させる）
type KnowledgeReasonId =
  | "discharge_support_not_arranged"
  | "discharge_support_partly_arranged"
  | "discharge_residence_undecided"
  | "discharge_support_and_residence_gap"
  | "money_family_contribution"
  | "money_family_contribution_and_unclear"
  | "money_family_contribution_urgent"
  | "home_ownership_unclear"
  | "home_intent_unconfirmed"
  | "home_contract_concern"
  | "home_ownership_and_intent_unclear";

type KnowledgeUrgency = "high" | "medium";

type KnowledgeSource = {
  title: string;
  organization: string;
  url: string;
  accessedAt: string;
};

// content：固定・レビュー済み本文のみを持つ。enabledは含めない（下記KnowledgeCardRegistryEntry参照）。
type KnowledgeCardContent = {
  id: KnowledgeCardId;
  title: string;
  cliff: string;
  checkItems: string[];
  linkedContactIds: string[];
  sources: KnowledgeSource[];
  verifiedAt: string;
  reviewBy: string;
};

// content本体とは別に管理する運用メタデータ。enabledはここに置き、contentへ混在させない。
// enabledは回答によって変化せず、matcherが決めるものでもなく、UIが独自に判定するものでもない。
// レビュー未完了のカードを誤って表示しないためのゲートとして、selectorが参照する（第8章・第11章）。
type KnowledgeCardRegistryEntry = {
  content: KnowledgeCardContent;
  enabled: boolean;
};

type KnowledgeCardMatch = {
  matched: boolean;
  cardId: KnowledgeCardId;
  reasonId: KnowledgeReasonId;
  rank: number;
  urgency: KnowledgeUrgency;
};

type PostKnowledgeCard = {
  id: KnowledgeCardId;
  title: string;
  cliff: string;
  whyNow: string;
  checkItems: string[];
  linkedContactIds: string[];
  sources: KnowledgeSource[];
  verifiedAt: string;
  reviewBy: string;
  rank: number;
  urgency: KnowledgeUrgency;
};
```

**PostResultへの追加案**：

```ts
export type PostResult = {
  // ...既存フィールド（無変更）...
  knowledgeCards: PostKnowledgeCard[];
};
```

空の場合は空配列とする。

### 実装前確認事項（URL互換性）

`lib/diagnosis/post/schema.ts`を調査した結果、URLへエンコードされるのは`PostValidAnswers`（`encodePostAnswers`／`decodePostParams`が扱う対象）のみであり、`PostResult`自体はURLへ保存されない。`PostResult`は`app/diagnosis/result/page.tsx`が`buildPostResult(decoded.answers)`を呼び出すたびに、リクエスト単位で再計算される派生オブジェクトである（Phase3の`artifacts`フィールド追加時と同じ構造）。したがって、`PostResult.knowledgeCards`の追加は`POST_SCHEMA_VERSION`・URL互換性に影響しない。この確認は実装開始前に再度、実際のコード（変更されていないこと）で裏取りすること。

---

## 5. 固定content（レビュー前の固定文案）

**本章の本文はすべて「レビュー前の固定文案」である。** 出典確認と専門家レビューが完了するまで、対応する`KnowledgeCardRegistryEntry.enabled`を`true`にしない（第11章）。

### Card A

```
id: discharge_support_start_gap
title: 退院後の支援は、退院日と同じ日に始まるとは限りません
cliff: >
  退院後に必要な移動、見守り、医療・介護・生活支援が、
  退院当日からすべて始まるとは限りません。
  最初の数日に支援の空白がないかを、退院前に確認します。
checkItems:
  - 退院当日の移動手段
  - 退院当日から最初の数日を誰が支えるか
  - 医療・介護・生活支援が始まる日
  - まだ決まっていない事項の担当者と確認期限
```

**linkedContactIds（調査結果）**：`lib/diagnosis/post/guidanceContent.ts`の`CONTACT_CARDS`を確認した結果、対応する正確なcontact IDは次のとおり。

- 病院の退院支援担当者 → `"hospital"`
- 地域包括支援センター → `"regional_support"`
- ケアマネジャー（担当がいる場合） → `"care_manager"`

`linkedContactIds: ["hospital", "regional_support", "care_manager"]`

### Card B

```
id: transition_monthly_cash_gap
title: 費用の総額だけでは、家族が負担する時期までは分かりません
cliff: >
  家族が費用を負担する可能性がある場合でも、
  総額だけでは、支払いが重なる月や
  家族の立替えが始まる時期までは分かりません。
  今後3か月を月ごとに分けて確認します。
checkItems:
  - 毎月入るお金
  - 毎月続く支出
  - その月だけ発生する支出
  - 家族が支払う予定の費用と開始月
```

**linkedContactIds（調査結果）**：お金に関する既存相談先は`CONTACT_CARDS.fp`（`id: "fp"`、「FP・家計整理を支援する人」）のみである。

`linkedContactIds: ["fp"]`

**重要（発火条件、詳細は第7章）**：このカードの必須条件は`familyContribution`とする。`moneyUnclear`だけでは、家族が費用を支払う事実を確認できないため、単独では発火させない。`moneyUnclear`は、whyNowの補足・urgency・rankの調整にだけ使用する。

### Card C

```
id: home_ownership_intent_gap
title: 家の方針が決まっても、名義と本人の意向が揃っているとは限りません
cliff: >
  売却・賃貸・解体などの方向が決まっていても、
  名義、共有者、本人の理解・意向など、
  手続きの前提となる確認事項が残っている可能性があります。
checkItems:
  - 登記上の名義
  - 共有名義の場合の共有者
  - 本人へ説明した内容と本人の意向
  - 契約前に確認する専門家
```

**linkedContactIds**：`["legal"]`に固定する（`CONTACT_CARDS.legal`、`id: "legal"`、「司法書士・弁護士」）。

Phase4.1では、Card Cから不動産相談先（`real_estate`）へは直接接続しない。理由：

- Card Cの中心論点は名義・本人の理解や意向・契約前確認であり、売却等の実務手続そのものではない
- 不動産相談先への接続は、売却・賃貸・解体の方向へ誘導しているように見えることを防ぐ
- 本カードは売却・賃貸・解体の適否を判定しない
- 不動産相談先との接続は、実利用検証（Phase3.5に相当する検証サイクル）後に別途判断する

---

## 6. reasonIdとwhyNow

`whyNow`はcontentに含めない。`reasonId`から固定文へ変換する。

### Card A

| reasonId | 区別する状態 | whyNow文案 |
|---|---|---|
| `discharge_support_not_arranged` | 支援未調整 | 入院中で、退院後の支援がまだ決まっていないためです。 |
| `discharge_support_partly_arranged` | 支援一部未調整 | 入院中で、退院後の支援に一部未調整が残っているためです。 |
| `discharge_residence_undecided` | 住まい未定 | 入院中で、退院後に過ごす場所がまだ決まっていないためです。 |
| `discharge_support_and_residence_gap` | 支援と住まいの両方に未調整がある | 入院中で、退院後の住まいや支援に未調整が残っているためです。 |

固定文は回答に含まれる事実だけを使用し、「危険」「必ず困る」等の断定は避ける。

### Card B

| reasonId | 区別する状態 | whyNow文案 |
|---|---|---|
| `money_family_contribution` | 家族負担の可能性がある | 家族が費用を負担する可能性があると回答しているためです。 |
| `money_family_contribution_and_unclear` | 家族負担の可能性があり、費用の見通しも不明 | 家族負担の可能性があり、費用の見通しもまだ明確でないためです。 |
| `money_family_contribution_urgent` | 家族負担の可能性があり、早期確認が必要 | 家族負担の可能性があり、早めに当面の支払い時期を確認しておくと安心です。 |

3つ目の文案は、指示にある「必要がある」を、既存`actions.ts`／`insights.ts`の文体（「〜しておくと安心です」「〜しておきましょう」）へ合わせて弱めた。

### Card C

| reasonId | 区別する状態 | whyNow文案 |
|---|---|---|
| `home_ownership_unclear` | 名義不明 | 家の名義がまだ確認できていないためです。 |
| `home_intent_unconfirmed` | 本人の理解・意向が未確認 | 家を動かす前の本人の理解・意向がまだ確認できていないためです。 |
| `home_contract_concern` | 契約内容の理解に懸念がある | 契約内容について、本人の理解を確認したい点があるためです。 |
| `home_ownership_and_intent_unclear` | 名義と本人意向の両方に未確認がある | 家の名義と本人の理解・意向の両方に未確認があるためです。 |

---

## 7. matcher仕様

matcherは、

- content本文を持たない
- whyNow本文を持たない
- 生回答から複雑な新規判定を作らない
- 既存Variablesを優先する
- 単一回答値の参照が必要な場合だけ直接参照する

### Card A

**必須条件**：`answers.c1 === "hospitalized"` かつ 次のいずれか
- `v.supportUnclear`
- `v.supportPartlyUnclear`
- `v.residenceUnclear`

退院日確定を表す新規Variablesは追加しない。`v.isImmediateDeadline`は発火条件ではなく、urgencyの調整にだけ使用する。

**reasonId判定**（優先順、上から順に判定し、最初に一致した1件だけを返す。複数の`reasonId`を同時に返さない）：
1. `residenceUnclear && (supportUnclear || supportPartlyUnclear)` → `discharge_support_and_residence_gap`
2. `supportUnclear` → `discharge_support_not_arranged`
3. `supportPartlyUnclear` → `discharge_support_partly_arranged`
4. `residenceUnclear` → `discharge_residence_undecided`

**rank**：原則10
**urgency**：`v.isImmediateDeadline`なら`high`、それ以外は`medium`

### Card B

**必須条件**：`v.familyContribution === true`

`v.moneyUnclear`単独では発火させない。`familyContribution`が`false`の場合は、いずれの`reasonId`も返さず`matched=false`とする。

**reasonId判定**（`familyContribution === true`のときのみ判定する。優先順に上から判定し、最初に一致した1件だけを返す）：
1. `moneyNeedsEarlyCheck` → `money_family_contribution_urgent`
2. `moneyUnclear` → `money_family_contribution_and_unclear`
3. それ以外（`familyContribution`のみ） → `money_family_contribution`

**rank**：`v.moneyNeedsEarlyCheck`なら15、それ以外は30
**urgency**：`v.moneyNeedsEarlyCheck`なら`high`、それ以外は`medium`

### Card C

**必須条件**：`v.homeActionExpected` かつ 次のいずれか
- `v.ownershipUnclear`
- `v.contractStatusUnknown`
- `v.contractConcern`

**reasonId判定**（優先順、上から順に判定し、最初に一致した1件だけを返す。複数の`reasonId`を同時に返さない）：
1. `contractConcern` → `home_contract_concern`
2. `ownershipUnclear && contractStatusUnknown` → `home_ownership_and_intent_unclear`
3. `ownershipUnclear` → `home_ownership_unclear`
4. `contractStatusUnknown` → `home_intent_unconfirmed`

`contractConcern`と他の条件が同時に成立した場合は、契約内容の理解に関する懸念（`home_contract_concern`）を優先する。

**rank**：原則20
**urgency**：`v.contractConcern`なら`high`、それ以外は`medium`

### 3枚同時発火時の順序

rank値は次の順になるよう設計している（同順位が発生しない値とする）。

1. Card A（rank 10）
2. Card B（`moneyNeedsEarlyCheck`が真ならrank 15）
3. Card C（rank 20）
4. Card B（緊急性が上がっていない場合、rank 30）

---

## 8. selector仕様

selectorは次だけを行う。

- matcher結果を集める
- `matched=true`だけを残す
- `KnowledgeCardRegistryEntry.enabled`（content本体とは別に管理する運用メタデータ）を確認し、`enabled=false`のカードを除外する
- rank昇順に並べる
- 最大2件に制限する
- contentとwhyNowを結合する

selectorは次を行わない。

- 発火条件の追加
- 回答値の参照
- Variablesの参照
- 本文生成
- `actions`や`contacts`の変更
- 重複論点を理由に`unknownItems`を削除する処理

0件の場合は空配列を返す。

---

## 9. PostResultへの接続

`buildKnowledgeCards`（または同等の名称のオーケストレータ）を`lib/diagnosis/post/knowledgeCards/`配下に設ける。

**責務**：
- matcherを実行する
- selectorへ渡す
- `PostKnowledgeCard[]`を返す

**`buildPostResult`内の順序**（`lib/diagnosis/post/logic.ts`）：

```
1. 既存のPostResult構成要素を生成する（firstAction／nextActions／decisions／insights／artifacts／contacts／selfHelp／consultation。無変更）
2. knowledgeCardsを生成する（buildKnowledgeCards(answers, v, contacts) 等）
3. PostResult.knowledgeCardsへ接続する
```

既存の次の結果は変更しない：`firstAction`／`nextActions`／`decisions`／`insights`／`artifacts`／`contacts`／`selfHelp`／`consultation`。

---

## 10. Result UIへの接続

**利用者向けセクション名**：「今、見落とさないために」

**カード内の表示順**：

1. `title`
2. `cliff`
3. 見出し「今回関係する理由」
4. `whyNow`
5. 見出し「確認すること」
6. `checkItems`
7. 関連する既存相談先への導線
8. 出典・確認情報

**関連相談先の導線方法（調査結果）**：`linkedContactIds`と、実際に`PostResult.contacts`へ選択されているcontact IDの共通部分だけを利用する。共通する相談先が無い場合は、空の相談先見出しやリンクを表示しない。

導線方法として、①同一ページ内リンク、②「誰に、何を確認するか」セクションへの参照、の2案を比較した。「誰に、何を確認するか」（`components/DiagnosisResultSections.tsx`262行目付近の`<h3>`）は現在アンカー用の`id`属性を持たない。第3章で確定した挿入位置（新セクションは「誰に、何を確認するか」より前に描画される）を踏まえると、**同一ページ内リンク（アンカーリンク）**が最小変更である：対象の`<h3>`へ`id`属性を1つ追加し、カード側に`<a href="#...">`を1つ追加するだけで実現できる。この一案を採用する。

---

## 11. freshness・出典・レビュー

出典URLを推測で作らない。

`KnowledgeCardRegistryEntry.enabled`を`true`にする前に、次を満たす必要がある。

**Card A**：
- 公的機関または公的医療・介護情報の一次資料を確認する
- 医療ソーシャルワーカー、退院支援担当者、ケアマネジャー等のレビュー対象箇所：`cliff`・`checkItems`全体（退院支援の実務実態に即した表現かどうか）

**Card B**：
- 制度の数値や適用条件は記載しない
- FP等による家計整理表現のレビュー対象箇所：`cliff`・`checkItems`全体（一般的な家計整理の助言として妥当か）

**Card C**：
- 法律手続を断定しない
- 司法書士または弁護士によるレビュー対象箇所：`cliff`・`checkItems`のうち名義・共有者・契約に関する記述
- 不動産実務家によるレビュー対象箇所：`checkItems`のうち契約前確認事項に関する記述

**sources**：`{ title, organization, url, accessedAt }`（第4章の型定義参照）を最小型とする。

`verifiedAt`／`reviewBy`は内部管理用であり、利用者へ過度に目立たせない。`reviewBy`超過だけで自動非表示にはしない。リンク切れや内容不一致は運用確認とする。

---

## 12. テスト仕様

### contentテスト
- 3カードのIDが一意
- `title`が空でない
- `cliff`が空でない
- `checkItems`が1件以上
- `linkedContactIds`に存在しないIDがない（`CONTACT_CARDS`のID集合と照合）
- `sources`の必須項目（`title`／`organization`／`url`／`accessedAt`）が揃っている
- `verifiedAt`／`reviewBy`の形式（日付形式）が正しい

### reasonsテスト
- matcherが返しうるすべての`reasonId`に`whyNow`が存在する
- 未使用の`reasonId`が無い
- reasonsが回答値やVariablesを参照しない

### matcherテスト
各カードについて、出すべきケース最低3件・出してはいけないケース最低3件・境界ケース最低3件。

Card Bでは必ず次を含める：
- `moneyUnclear=true, familyContribution=false` → 表示しない
- `familyContribution=true` → 表示する
- `familyContribution=true, moneyNeedsEarlyCheck=true` → rankが上がる（15になる）

**reasonId優先順テスト**（第7章の優先順どおりに1件だけ返ることを確認する）：

Card A：
- `residenceUnclear=true, supportUnclear=true` → `discharge_support_and_residence_gap`（他のreasonIdを同時に返さない）
- `residenceUnclear=true, supportPartlyUnclear=true` → `discharge_support_and_residence_gap`
- `supportUnclear=true, residenceUnclear=false` → `discharge_support_not_arranged`
- `supportPartlyUnclear=true, supportUnclear=false, residenceUnclear=false` → `discharge_support_partly_arranged`
- `residenceUnclear=true, supportUnclear=false, supportPartlyUnclear=false` → `discharge_residence_undecided`

Card B：
- `familyContribution=false` → `matched=false`、`reasonId`を返さない
- `familyContribution=true, moneyNeedsEarlyCheck=true` → `money_family_contribution_urgent`（`moneyUnclear`の真偽に関わらず優先）
- `familyContribution=true, moneyNeedsEarlyCheck=false, moneyUnclear=true` → `money_family_contribution_and_unclear`
- `familyContribution=true, moneyNeedsEarlyCheck=false, moneyUnclear=false` → `money_family_contribution`

Card C：
- `contractConcern=true, ownershipUnclear=true, contractStatusUnknown=true` → `home_contract_concern`（他条件が同時に成立していても契約懸念を優先）
- `contractConcern=false, ownershipUnclear=true, contractStatusUnknown=true` → `home_ownership_and_intent_unclear`
- `contractConcern=false, ownershipUnclear=true, contractStatusUnknown=false` → `home_ownership_unclear`
- `contractConcern=false, ownershipUnclear=false, contractStatusUnknown=true` → `home_intent_unconfirmed`

### selectorテスト
- 0件
- 1件
- 2件
- 3件同時発火時に2件へ絞られる
- rank順に並ぶ
- 最大2件を超えない
- `KnowledgeCardRegistryEntry.enabled=false`のカードが除外される
- 同じ入力で常に同じ結果（決定論性）

### UIテスト
- 0件なら見出しを出さない
- 1件なら1枚だけ表示する
- 2件ならrank順に表示する
- `linkedContactIds`が選択された`contacts`と一致しなければ、相談先への導線を出さない
- `urgency`による色分けをしない
- `firstAction`の表示が変更されない

### 回帰テスト
- 既存診断ロジックの結果が変わらない（`firstAction`／`nextActions`／`decisions`／`insights`）
- Phase3 `artifacts`（`confirmedFacts`／`unknownItems`）が変わらない
- `contacts`の選択結果が変わらない
- `POST_SCHEMA_VERSION`が変わらない
- m=pre／m=afterへ影響しない
- URL互換性を維持する（既存の`encodePostAnswers`／`decodePostParams`が無変更）

---

## 13. 実装順序

**Step 1**：型（`KnowledgeCardContent`／`KnowledgeCardRegistryEntry`を含む）・固定content・reasons（第4〜6章）

**Step 2**：matchers・selector・単体テスト（第7〜8章、第12章のcontent／reasons／matcher／selectorテスト）

**Step 3**：PostResultへの接続・回帰テスト（第9章、第12章の回帰テスト）

**Step 4**：Result UIへの接続・表示テスト（第10章、第12章のUIテスト）

**Step 5**：出典・レビュー確認後に`KnowledgeCardRegistryEntry.enabled`を`true`にする（第11章）

各Stepは別コミット候補として整理する。

---

## 14. 完了条件

- 3候補から最大2件を決定論的に選択できる
- 0件を許容する
- 不安を煽る文言がない
- 医療・介護・法律・税務・不動産判断をしていない
- 既存`actions`／`contacts`を重複生成していない
- `firstAction`の優先表示を壊していない
- 既存診断結果へ回帰がない
- TypeScriptエラーがない
- ESLintエラーがない
- 全テスト成功
- build成功
- URL互換性維持
- m=pre／m=afterへ影響なし

---

## 15. 禁止事項

- 今回コードを変更する
- 今回正式仕様書を変更する
- 今回他のdocsを変更する
- 実行時AI生成
- 生回答から新しい複雑な複合判定を作る
- `moneyUnclear`だけでCard Bを表示する
- Card C表示時に`unknownItems`を削除する
- Card A表示時に既存`insights`を削除する
- `linkedContactIds`から新しい`contact`を生成する
- 出典URLを推測で記載する
- 制度適用を断定する
- 本人の判断能力を評価する
- 契約の有効性を判定する
- git add／commit／push
- `components/Header.tsx`へ触れる
- `backup-before-ohana/`へ触れる
