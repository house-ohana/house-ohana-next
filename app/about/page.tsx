import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "House OHANAについて",
  description:
    "House OHANAの理念、目指す社会、House OHANAの立場について説明します。人生の後半も、好きな場所で、自分らしく。その願いを、家族だけの負担にしない。",
};

const stance = [
  "医療・介護の専門職に代わる組織ではありません",
  "老人ホーム紹介だけを行う会社ではありません",
  "実家の売却だけを勧める会社ではありません",
  "保険商品を販売するための窓口ではありません",
  "本人と家族が選択肢を比較するための整理役です",
];

export default function AboutPage() {
  const { operator } = siteConfig;
  const hasOperatorSection =
    operator.legalName ||
    operator.representativeName ||
    operator.bio ||
    operator.qualifications.length > 0 ||
    operator.businessHours ||
    operator.sns.length > 0;

  return (
    <div>
      <PageHero eyebrow="About" title="House OHANAについて" />

      <div className="mx-auto flex max-w-3xl flex-col gap-16 px-5 py-14 sm:px-8">
        <section className="flex flex-col gap-4 rounded-2xl bg-ohana-green-light p-8">
          <p className="text-2xl font-bold leading-snug text-ohana-ink sm:text-3xl">
            人生の後半も、好きな場所で、自分らしく。
          </p>
          <p className="text-xl font-bold text-ohana-green-dark">
            その願いを、家族だけの負担にしない。
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="House OHANAが目指す社会" />
          <p className="text-base leading-loose text-ohana-gray sm:text-lg">
            年齢を重ねても、介護が必要になっても、本人の希望から暮らし方を考えられる社会。家族が仕事や生活を過度に犠牲にせず、その希望を支えられる社会。House
            OHANAは、そのための情報整理と意思決定支援に取り組みます。
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="House OHANAの立場" />
          <ul className="flex flex-col gap-2">
            {stance.map((item) => (
              <li key={item} className="flex gap-2 text-base leading-loose text-ohana-ink">
                <span
                  className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-ohana-green"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {hasOperatorSection ? (
          <section className="flex flex-col gap-4">
            <SectionHeading title="運営者紹介" />
            <div className="flex flex-col gap-2 text-base leading-loose text-ohana-ink">
              {operator.legalName ? <p>法人名：{operator.legalName}</p> : null}
              {operator.representativeName ? <p>代表者：{operator.representativeName}</p> : null}
              {operator.businessHours ? <p>対応時間：{operator.businessHours}</p> : null}
              {operator.qualifications.length > 0 ? (
                <p>保有資格：{operator.qualifications.join("、")}</p>
              ) : null}
              {operator.bio ? <p className="whitespace-pre-line">{operator.bio}</p> : null}
              {operator.sns.length > 0 ? (
                <ul className="flex flex-wrap gap-4">
                  {operator.sns.map((sns) => (
                    <li key={sns.url}>
                      <a href={sns.url} className="underline underline-offset-2">
                        {sns.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
