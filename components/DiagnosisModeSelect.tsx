import Link from "next/link";

// docs/reference/navi-result-mapping.md 第0節「入口の分岐」。
// トップページ経由を必須にせず、/diagnosis へ直接アクセスした場合もここが最初に表示される。
export default function DiagnosisModeSelect() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-base leading-loose text-ohana-gray sm:text-lg">
        今すぐ対応が必要な方だけでなく、今は大きな問題がなく、これからに備えたい方も利用できます。
      </p>
      <fieldset className="flex flex-col gap-4">
        <legend className="text-xl font-bold leading-snug text-ohana-ink sm:text-2xl">
          今の状況に近いものを選んでください
        </legend>
        <div className="flex flex-col gap-3">
          <Link
            href="/diagnosis?m=pre"
            className="flex min-h-12 items-center rounded-xl border-2 border-ohana-beige-dark bg-ohana-white px-4 py-3 text-base text-ohana-ink hover:border-ohana-green"
          >
            今すぐの大きな対応は必要なく、これからに備えたい
          </Link>
          <Link
            href="/diagnosis?m=post"
            className="flex min-h-12 items-center rounded-xl border-2 border-ohana-beige-dark bg-ohana-white px-4 py-3 text-base text-ohana-ink hover:border-ohana-green"
          >
            入院・退院・介護など、今まさに対応が必要
          </Link>
        </div>
      </fieldset>
    </div>
  );
}
