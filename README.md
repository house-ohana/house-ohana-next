# House OHANA ウェブサイト

親の退院・住み替え・施設入居と、残る実家について、ご本人とご家族が納得して決めるための意思決定支援サイトのプロトタイプです。

「人生の後半も、好きな場所で、自分らしく。」「その願いを、家族だけの負担にしない。」という理念のもと、House
OHANAが行う情報整理・家族会議支援・専門職等との情報交換について紹介しています。

House OHANAは、運営者が個人で行う保険・不動産業務とは別の事業として運営しています。詳しくは
[/policy](/policy) をご覧ください。

---

## 1. 使用技術

- [Next.js](https://nextjs.org/)（App Router）
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)（v4, CSS-first設定）
- [ESLint](https://eslint.org/)
- パッケージマネージャー：[pnpm](https://pnpm.io/)
- フォーム送信：[Netlify Forms](https://docs.netlify.com/forms/setup/)
- OGP画像：Next.jsの `next/og`（`ImageResponse`）でローカル生成。外部の画像素材には依存していません。

外部API・外部CMSには依存していません。会員登録・ログイン・決済・AIチャットなどの大型機能は、このプロトタイプの段階では実装していません。

## 2. 必要な環境

- Node.js 20系以上を推奨
- pnpm（`corepack enable` で有効化できます）

## 3. インストール方法

プロジェクトのルートフォルダで、次のコマンドを実行してください。

```bash
pnpm install
```

## 4. 開発サーバーの起動方法

```bash
pnpm dev
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) を開くと確認できます。

## 5. ビルド方法（本番用）

```bash
pnpm build
```

ビルド後に、ローカルで本番相当の動作を確認したい場合は次を実行します。

```bash
pnpm start
```

## 6. Lintの実行方法

```bash
pnpm lint
```

## 7. サイト設定の変更場所

運営者情報やサイト名など、サイト全体に関わる設定は
[lib/site-config.ts](lib/site-config.ts) にまとめています。

- 法人名、代表者名、所在地、電話番号、メールアドレス、営業時間、略歴、保有資格、SNS、ロゴなどは
  `siteConfig.operator` 以下にあります。
- **未入力の項目は、画面上に空欄や「TODO」を表示せず、該当する表示自体を自動的に省略する仕様です。**
  情報が確定したら、該当する値を文字列として入力してください（コード内にTODOコメントがあります）。
- ヘッダー・フッターのナビゲーション項目は [lib/navigation.ts](lib/navigation.ts) で管理しています。

## 8. 問い合わせ先の変更方法

問い合わせフォーム自体は [components/ContactForm.tsx](components/ContactForm.tsx) にありますが、
**フォームの送信先メールアドレスなどの通知設定は、Netlifyの管理画面（Site configuration ->
Forms -> Form notifications）で設定します。** コード側にメールアドレスを直接記載する必要はありません。

プライバシーポリシー等に表示するお問い合わせ窓口の情報（メールアドレスや所在地）は、
[lib/site-config.ts](lib/site-config.ts) の `operator` を編集してください。

## 9. 質問内容の変更場所

「3分整理ナビ」機能（`/diagnosis`）の質問・選択肢は
[lib/diagnosis/questions.ts](lib/diagnosis/questions.ts) にまとめています。
質問の追加・削除・文言変更は、このファイルの配列を編集するだけで反映されます。

**注意**: 質問IDや選択肢のvalueは、結果の共有URL（`/diagnosis/result?v=1&q1=a...`）の
復号に使われています（[lib/diagnosis/schema.ts](lib/diagnosis/schema.ts)）。文言（label）だけの
変更は問題ありませんが、質問id・選択肢valueの変更や削除、質問数の変更を行う場合は、
schema.tsのバージョニング方針（後述）を必ず確認してください。

## 10. 結果ロジックの変更場所

質問の回答から表示内容を組み立てるルールは
[lib/diagnosis/logic.ts](lib/diagnosis/logic.ts) にまとめています。
「今すぐ確認すること」「家族で話し合うこと」「専門職へ確認すること」「後から検討できること」の
4つのカテゴリごとに、条件と文言を追加・編集できます。

断定的な結論（「施設が適切」「自宅復帰は無理」等）を出力しない方針のため、
新しい文言を追加する際も、この方針に沿った表現にしてください。

## 11. 診断結果の共有URLについて

「3分整理ナビ」の結果は `/diagnosis/result?v=1&q1=a&q2=c...`
のようなURLクエリパラメータとして表現され、サーバーには一切保存されません。
氏名・連絡先・自由記述・詳しい医療情報など、個人を特定できる情報はURLに含めない設計です
（含まれるのは選択式回答を表す短い英字コードのみ）。

- エンコード・デコードのロジックは [lib/diagnosis/schema.ts](lib/diagnosis/schema.ts) にあります。
- `v` は診断仕様のバージョンです。質問構成を変える場合は
  `DIAGNOSIS_CURRENT_VERSION` を上げ、既存バージョンのコード表（`V1_FIELDS` 等）は変更せずに
  新しいバージョンの定義を追加してください。過去に発行済みのURLを将来も復号できるようにするためです。
- 不正な値・欠けた値・未対応バージョンのURLが渡された場合も、ページを壊さず、
  再診断への案内を表示します（`components/DiagnosisInvalid.tsx`）。
- 結果ページ（`/diagnosis/result`）は `robots` メタデータで `noindex` を設定しており、
  検索結果には掲載されません（[app/diagnosis/result/page.tsx](app/diagnosis/result/page.tsx)）。
  一方で `robots.txt`（[app/robots.ts](app/robots.ts)）や
  サイトマップ（[app/sitemap.ts](app/sitemap.ts)）では、このページを個別にブロックしていません。
  URLを知っている人はページを閲覧できるため、共有時の注意書きを画面上に表示しています。

## 12. Netlifyへの公開方法

1. GitHubなどにこのリポジトリをプッシュします。
2. [Netlify](https://www.netlify.com/) で「Add new site」からリポジトリを連携します。
3. ビルド設定は [netlify.toml](netlify.toml) に記載済みです（ビルドコマンド：`pnpm build`、
   `@netlify/plugin-nextjs` プラグインを使用）。Netlifyの管理画面側で追加設定をしなくても、
   このリポジトリのままデプロイできます。
4. 初回デプロイ後、Netlifyの管理画面で **Forms** 機能が自動的に有効化されていることを確認してください
   （通常は、ビルドされたHTML内の `<form data-netlify="true">` を検知して自動登録されます）。
5. 本番ドメインが決まったら、環境変数 `NEXT_PUBLIC_SITE_URL` にドメイン（例：
   `https://example.com`）を設定すると、OGP用のURLなどに反映されます（未設定でも動作します）。

## 13. Netlify Formsの確認方法

- お問い合わせフォームのフォーム名は `contact` です（[components/ContactForm.tsx](components/ContactForm.tsx)）。
- Netlifyの管理画面 -> 対象サイト -> **Forms** タブから、送信内容を確認できます。
- スパム対策として、Netlify Forms標準のハニーポット（`data-netlify-honeypot="bot-field"` と、
  画面上には見えない `bot-field` という入力欄）を設定しています。
- JavaScriptが無効な環境でも、通常のHTMLフォーム送信としてNetlifyへ送信され、
  `/contact/thanks` に遷移する構成にしています。
- デプロイ後、フォームが管理画面に表示されない場合は、一度サイトを再デプロイしてください
  （Netlifyはビルド時にHTML内のフォームを検出するため、初回反映にはビルドが必要です）。

## 14. OGP画像の場所

[app/opengraph-image.tsx](app/opengraph-image.tsx) で、Next.jsの `next/og` を使い、
サイト名と中心メッセージをもとにした画像をアクセス時に生成しています。画像ファイルを別途用意する
必要はありません。デザインを変更したい場合は、このファイル内のスタイルを編集してください。

## 15. 未設定のTODO

`git grep -n "TODO" -- lib app` で一覧できます。主な項目は次のとおりです。

- [lib/site-config.ts](lib/site-config.ts) 内の `operator`（法人名・代表者名・所在地・電話番号・
  メールアドレス・営業時間・略歴・保有資格・法人番号・SNS・ロゴ画像）
- 本番公開ドメイン（環境変数 `NEXT_PUBLIC_SITE_URL`）

これらは、画面上では未入力のまま非表示になる設計のため、公開直後に情報が空欄で表示される
心配はありません。情報が確定し次第、順次入力してください。

## 16. 公開前の確認項目

- [ ] `lib/site-config.ts` の運営者情報が、公開してよい内容だけになっているか
- [ ] `pnpm lint` がエラーなく通るか
- [ ] `pnpm build` がエラーなく通るか
- [ ] 各ページのリンク・ボタンが正しく遷移するか
- [ ] スマートフォン・タブレット・デスクトップ表示を確認したか
- [ ] お問い合わせフォームを実際に送信し、Netlifyの管理画面に届くか確認したか
- [ ] 「3分整理ナビ」機能を最初から最後まで操作し、結果ページの表示・保存案内・印刷・共有・
      やり直し・相談導線を確認したか
- [ ] 診断結果URLに不正な値・欠けた値・未対応バージョンを渡しても、ページが壊れず案内が表示されるか
- [ ] 架空の実績・口コミ・提携先・受賞歴などが含まれていないか
- [ ] House OHANAと個人事業（保険・不動産）の説明が混在していないか

---

質問・不具合などがあれば、コード内のコメント（`TODO:` で検索可能）もあわせてご確認ください。
