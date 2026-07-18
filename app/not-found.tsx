import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col items-start justify-center gap-6 px-5 py-20 sm:px-8">
      <p className="text-sm font-semibold tracking-wide text-ohana-brown">404</p>
      <h1 className="text-2xl font-bold leading-snug text-ohana-ink sm:text-3xl">
        お探しのページが見つかりませんでした。
      </h1>
      <p className="text-base leading-loose text-ohana-gray sm:text-lg">
        URLが変更されたか、ページが存在しない可能性があります。トップページから、あらためて必要なページをお探しください。
      </p>
      <div className="flex flex-wrap gap-4">
        <PrimaryButton href="/">House OHANAのトップへ戻る</PrimaryButton>
        <SecondaryButton href="/contact">お問い合わせへ進む</SecondaryButton>
      </div>
    </div>
  );
}
