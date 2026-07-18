import type { Metadata } from "next";
import Link from "next/link";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import SectionHeading from "@/components/SectionHeading";
import FeatureCard from "@/components/FeatureCard";
import PrincipleCard from "@/components/PrincipleCard";
import StepList from "@/components/StepList";
import { siteConfig } from "@/lib/site-config";
import {
  HouseIcon,
  RoadIcon,
  ChairIcon,
  TreeIcon,
  ConversationIcon,
  DocumentIcon,
  ChoiceIcon,
  RegionIcon,
  HandsIcon,
  FamilyIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "親の退院・施設入居後の住まいと実家の意思決定支援｜House OHANA",
  description:
    "親の退院や施設入居に伴う、次の住まいと残る実家について、ご本人とご家族が納得して決めるための情報整理を支援します。人生の後半も、好きな場所で、自分らしく。その願いを、家族だけの負担にしない。",
};

const overlappingDecisions = [
  { icon: <HouseIcon />, text: "退院後に自宅へ戻れるか" },
  { icon: <ChairIcon />, text: "本人はどこで暮らしたいか" },
  { icon: <RoadIcon />, text: "施設や住み替えをどう考えるか" },
  { icon: <HandsIcon />, text: "家族はどこまで支援できるか" },
  { icon: <DocumentIcon />, text: "費用をどう考えるか" },
  { icon: <TreeIcon />, text: "残る実家をどうするか" },
  { icon: <ConversationIcon />, text: "兄弟姉妹でどう話し合うか" },
  { icon: <ChoiceIcon />, text: "誰に何を相談するか" },
];

const worries = [
  "親は自宅へ戻りたいと言っているが、家族だけで支えられるか分からない",
  "退院日が近いが、次の住まいが決まっていない",
  "老人ホームを検討しているが、何を基準に選べばよいか分からない",
  "親本人と子どもの希望が違う",
  "兄弟姉妹で意見がまとまらない",
  "施設入居後の実家をどうするか決まっていない",
  "施設費用と実家の維持費が心配",
  "親に住まいや財産の話を切り出しにくい",
  "認知機能が低下する前に何を確認すべきか分からない",
  "相談先が多く、誰に何を聞けばよいか分からない",
];

const lifeOptions = [
  "自宅へ戻る",
  "一時的に自宅へ戻る",
  "子どもの近くへ住み替える",
  "高齢者住宅や施設へ入る",
  "状況に応じて方法を組み合わせる",
];

const roleAndCostTopics = [
  "誰が何を担当するか",
  "家族が支援できる時間",
  "医療、介護、住居にかかる費用",
  "実家の維持費",
  "今後想定される負担",
];

const remainingHomeOptions = [
  "当面残す",
  "管理する",
  "家族が使う",
  "貸す可能性を検討する",
  "売る可能性を検討する",
];

const doingSteps = [
  { title: "現在の状況を整理する" },
  { title: "本人と家族の希望を確認する" },
  { title: "考えられる選択肢を並べる" },
  { title: "今決めることと、後から決めることを分ける" },
  { title: "家族会議で話す内容を整理する" },
  { title: "専門職へ確認する質問を整理する" },
  { title: "次に行うことを明確にする" },
];

const notDeciding = [
  "自宅へ戻るべきか",
  "施設へ入るべきか",
  "どの施設を選ぶべきか",
  "実家を売るべきか",
  "どの不動産会社へ依頼すべきか",
  "どの保険商品へ加入すべきか",
  "医療や介護サービスの内容",
  "法律、税務、登記上の判断",
];

export default function Home() {
  return (
    <div>
      {/* セクション1: ファーストビュー */}
      <section className="border-b border-ohana-beige-dark bg-ohana-beige">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-6 px-5 py-16 sm:px-8 sm:py-20">
          <p className="text-sm font-semibold tracking-wide text-ohana-brown">
            親の退院・住み替え・施設入居と、残る実家の意思決定支援
          </p>
          <h1 className="text-3xl font-bold leading-snug text-ohana-ink sm:text-5xl sm:leading-tight">
            人生の後半も、
            <br />
            好きな場所で、自分らしく。
          </h1>
          <p className="text-xl font-bold text-ohana-green-dark sm:text-2xl">
            その願いを、家族だけの負担にしない。
          </p>
          <p className="max-w-2xl text-base leading-loose text-ohana-ink/85 sm:text-lg">
            自宅に戻る、住み替える、施設へ入る。実家を残す、管理する、貸す、売る。House
            OHANAは、ご本人の希望とご家族の現実を一緒に整理し、納得して次の一歩を選ぶためのお手伝いをします。
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <PrimaryButton href="/diagnosis">3分で今の状況を整理する</PrimaryButton>
            <SecondaryButton href="/about">House OHANAについて知る</SecondaryButton>
          </div>
          <Link
            href="/professionals"
            className="text-sm text-ohana-ink/70 underline-offset-4 hover:underline"
          >
            専門職・研究者・行政の方へ
          </Link>
        </div>
      </section>

      {/* セクション2: 重なる判断 */}
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 sm:px-8">
        <SectionHeading title="親の暮らしを考えるとき、家族には多くの判断が重なります" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {overlappingDecisions.map((item) => (
            <div
              key={item.text}
              className="flex flex-col items-start gap-3 rounded-2xl border border-ohana-beige-dark bg-ohana-white p-5"
            >
              <div className="text-ohana-green">{item.icon}</div>
              <p className="text-sm font-semibold leading-snug text-ohana-ink sm:text-base">
                {item.text}
              </p>
            </div>
          ))}
        </div>
        <p className="max-w-2xl text-base font-semibold leading-loose text-ohana-ink">
          それぞれを別々に決めるのではなく、本人の暮らしと家族の生活を一緒に考えることが大切です。
        </p>
      </section>

      {/* セクション3: このようなことで悩んでいませんか */}
      <section className="bg-ohana-beige">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 sm:px-8">
          <SectionHeading title="このようなことで悩んでいませんか" />
          <div className="grid gap-4 sm:grid-cols-2">
            {worries.map((worry) => (
              <div
                key={worry}
                className="rounded-2xl bg-ohana-white p-5 text-base leading-loose text-ohana-ink"
              >
                {worry}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* セクション4: House OHANAが大切にすること */}
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 sm:px-8">
        <SectionHeading title="House OHANAが大切にすること" />
        <div className="grid gap-6 sm:grid-cols-3">
          <PrincipleCard
            icon={<ChairIcon />}
            title="本人の希望"
            description="本人がどこで、どのように暮らしたいかを起点に考えます。"
          />
          <PrincipleCard
            icon={<FamilyIcon />}
            title="家族の生活"
            description="家族が仕事や生活を過度に犠牲にすることを前提にしません。"
          />
          <PrincipleCard
            icon={<ChoiceIcon />}
            title="選べる状態"
            description="自宅、住み替え、施設など、特定の結論を押しつけず、比較して決められる状態をつくります。"
          />
        </div>
      </section>

      {/* セクション5: 一緒に整理する3つのテーマ */}
      <section className="bg-ohana-green-light">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 sm:px-8">
          <SectionHeading title="一緒に整理する3つのテーマ" />
          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={<HouseIcon />}
              title="親のこれからの暮らし"
              description={
                <ul className="flex flex-col gap-1.5">
                  {lifeOptions.map((item) => (
                    <li key={item}>・{item}</li>
                  ))}
                </ul>
              }
            />
            <FeatureCard
              icon={<HandsIcon />}
              title="家族の役割と費用"
              description={
                <ul className="flex flex-col gap-1.5">
                  {roleAndCostTopics.map((item) => (
                    <li key={item}>・{item}</li>
                  ))}
                </ul>
              }
            />
            <FeatureCard
              icon={<TreeIcon />}
              title="残る実家"
              description={
                <ul className="flex flex-col gap-1.5">
                  {remainingHomeOptions.map((item) => (
                    <li key={item}>・{item}</li>
                  ))}
                </ul>
              }
            />
          </div>
          <p className="text-sm leading-loose text-ohana-ink/70">
            「貸す」「売る」は可能性のひとつとしてご紹介しています。House
            OHANAが売却や賃貸をお勧めしたり、取引を仲介したりすることはありません。
          </p>
        </div>
      </section>

      {/* セクション6: House OHANAが行うこと */}
      <section className="mx-auto flex max-w-4xl flex-col gap-8 px-5 py-16 sm:px-8">
        <SectionHeading title="House OHANAが行うこと" />
        <StepList steps={doingSteps} />
      </section>

      {/* セクション7: House OHANAが決めないこと */}
      <section className="bg-ohana-beige">
        <div className="mx-auto flex max-w-4xl flex-col gap-8 px-5 py-16 sm:px-8">
          <SectionHeading title="House OHANAが決めないこと" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {notDeciding.map((item) => (
              <li
                key={item}
                className="rounded-xl bg-ohana-white px-5 py-4 text-base leading-loose text-ohana-ink"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="text-lg font-bold leading-loose text-ohana-ink">
            House
            OHANAが結論を決めるのではなく、ご本人とご家族が納得して決めるための材料を整理します。
          </p>
        </div>
      </section>

      {/* セクション8: 活動地域 */}
      <section className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-16 sm:px-8">
        <div className="flex flex-col gap-4">
          <div className="text-ohana-green">
            <RegionIcon />
          </div>
          <SectionHeading
            title={`${siteConfig.serviceArea.primary}から始める、家族の意思決定支援`}
            description={
              <p>
                House
                OHANAは、現在、{siteConfig.serviceArea.primary}を中心に活動を始めています。その他の地域についても、オンラインによる状況整理、家族会議の準備、必要な専門分野や相談先の整理についてお問い合わせいただけます。
              </p>
            }
          />
        </div>
      </section>

      {/* セクション9: 専門職・研究者・行政の方へ */}
      <section className="bg-ohana-green-light">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-16 sm:px-8">
          <SectionHeading
            title="本人と家族の住まいの意思決定について、情報交換を受け付けています。"
            description="House OHANAは、医療・介護上の判断を行う組織ではありません。退院や施設入居をきっかけに生じる、本人の希望、家族の意見、費用、実家、家族会議などの情報整理を行います。医療・介護・福祉・研究・行政の立場から、資料や支援方法についてのご意見をお寄せください。"
          />
          <div>
            <PrimaryButton href="/professionals">専門職等の方向けページを見る</PrimaryButton>
          </div>
        </div>
      </section>

      {/* セクション10: 最後のCTA */}
      <section className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-2xl font-bold leading-snug text-ohana-ink sm:text-3xl">
          まだ結論が決まっていなくても、整理は始められます。
        </h2>
        <p className="text-base leading-loose text-ohana-gray sm:text-lg">
          自宅へ戻るか、施設へ入るか。実家を残すか、別の方法を考えるか。House
          OHANAは、何かを契約する前に、本人と家族が考えるべきことを整理します。
        </p>
        <PrimaryButton href="/diagnosis">3分で今の状況を整理する</PrimaryButton>
      </section>
    </div>
  );
}
