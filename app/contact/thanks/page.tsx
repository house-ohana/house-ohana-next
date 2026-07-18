import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import PrimaryButton from "@/components/PrimaryButton";

export const metadata: Metadata = {
  title: "お問い合わせを受け付けました",
  description: "House OHANAへのお問い合わせを受け付けました。",
  robots: { index: false },
};

// JavaScriptが利用できない環境で送信された場合に、Netlifyからリダイレクトされる完了ページ。
export default function ContactThanksPage() {
  return (
    <div>
      <PageHero
        eyebrow="Contact"
        title="お問い合わせを受け付けました"
        description="内容を確認のうえ、ご連絡します。しばらくお待ちください。"
      />
      <section className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-12 sm:px-8">
        <PrimaryButton href="/">House OHANAのトップへ戻る</PrimaryButton>
      </section>
    </div>
  );
}
