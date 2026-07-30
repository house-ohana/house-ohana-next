import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import Notice from "@/components/Notice";
import PrimaryButton from "@/components/PrimaryButton";

export const metadata: Metadata = {
  title: "ご家族の方へ",
  description:
    "親の退院後の暮らし、施設や住み替え、残る実家について、ご家族が考えるときに大切にしたい視点と、家族会議で話すとよい質問例をご紹介します。",
};

function List({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-base leading-loose text-ohana-ink">
          <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-ohana-green" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function FamilyPage() {
  return (
    <div>
      <PageHero
        eyebrow="For Family"
        title="ご家族の方へ"
        description="親の暮らしについて考えるとき、家族だけですべてを背負う必要はありません。ここでは、House OHANAが大切にしている視点をご紹介します。"
      />

      <div className="mx-auto flex max-w-3xl flex-col gap-16 px-5 py-14 sm:px-8">
        <section className="flex flex-col gap-4">
          <SectionHeading title="親の希望を確認する" />
          <p className="text-base leading-loose text-ohana-gray">
            住まいや暮らし方を考えるとき、まず起点になるのは本人の希望です。できる範囲で、次のようなことを確認できるとよいでしょう。
          </p>
          <List
            items={[
              "どこで暮らしたいか",
              "どのような日常を続けたいか",
              "家族に何を望んでいるか",
              "自宅へ戻る可能性を、どの程度残しておきたいか",
            ]}
          />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="家族ができることと、できないことを分ける" />
          <p className="text-base leading-loose text-ohana-gray">
            仕事や自分の生活を抱えながら、親のことをすべて引き受けることは、多くのご家族にとって現実的ではありません。できないことがあるのは当然です。まずは、家族の中で誰が何をどこまで担えるかを、率直に確認することから始めましょう。
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="退院後の暮らしを考える" />
          <p className="text-base leading-loose text-ohana-gray">
            自宅に戻れるかどうか、どのような支援があれば戻れるかは、医療・介護上の判断が関わります。House
            OHANAはこの判断を行いません。医師、病院の退院支援担当者、ケアマネジャーなど、担当の専門職へ確認する必要があります。
          </p>
          <Notice title="専門職へ確認すること">
            退院後に自宅で生活できるかどうかの可否や、必要な医療・介護サービスの内容は、医師・病院・ケアマネジャー等の専門職にご確認ください。
          </Notice>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="施設や住み替えを考える" />
          <p className="text-base leading-loose text-ohana-gray">
            施設や住み替えを検討する際に、比較の視点として意識できる項目です。House
            OHANAは特定の施設を推薦することはありません。
          </p>
          <List
            items={[
              "本人が望む暮らし",
              "立地",
              "費用",
              "医療・介護対応",
              "家族が通える距離",
              "日常生活",
              "入院時や退去時の扱い",
              "家族に求められる役割",
            ]}
          />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="残る実家を考える" />
          <p className="text-base leading-loose text-ohana-gray">
            施設入居や住み替えのあとに残る実家についても、あわせて考えておきたい項目です。
          </p>
          <List
            items={["本人が戻る可能性", "維持費", "管理", "家財", "名義", "家族間の合意", "将来の利用方法"]}
          />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="家族会議の質問例" description="家族で話し合うときに、参考にしていただける質問です。" />
          <List
            items={[
              "本人はどこで暮らしたいと考えているか",
              "家族は何を一番心配しているか",
              "誰が情報を集めるか",
              "誰が本人と話すか",
              "誰が費用を確認するか",
              "いつまでに何を決める必要があるか",
              "今すぐ決めなくてもよいことは何か",
              "意見が違う場合、何を判断基準にするか",
            ]}
          />
        </section>

        <section className="flex flex-col gap-6 rounded-2xl bg-ohana-green-light p-8">
          <p className="text-lg font-bold leading-loose text-ohana-ink">
            状況を整理するところから、一緒に始めてみませんか。
          </p>
          <div>
            <PrimaryButton href="/diagnosis">今すぐ状況を整理</PrimaryButton>
          </div>
        </section>
      </div>
    </div>
  );
}
