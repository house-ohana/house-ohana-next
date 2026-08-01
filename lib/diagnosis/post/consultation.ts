import type { PostVariables } from "./variables";
import type { PostConsultationSection } from "./types";

/**
 * 「⑨OHANAへの相談導線」（第16節・第17節）。
 * House OHANAの役割は状況整理・希望の分離・優先順位づけ・相談先の案内までであり、
 * 契約や手続の代行・営業を意味する表現は使わない。
 */

export function computeConsultationFlags(v: PostVariables): PostConsultationSection {
  const urgent =
    (v.isImmediateDeadline || v.isNearDeadline || v.activeSupportGap) &&
    (v.supportUnclear || v.supportPartlyUnclear || v.residenceUnclear || v.supporterRisk);

  const homeAndContract = v.homeActionExpected && (v.contractConcern || v.contractStatusUnknown || v.moneyUnclear || v.homeFinancePlanning);

  return { urgent, homeAndContract };
}

export const CONSULTATION_COPY = {
  urgent: {
    lead: "一度に複数のことを決める必要があり、どこから整理すればよいか分からない場合",
    body: "House OHANAでは、ご本人の希望、家族ができること、期限、費用、実家について、今決めることと後でよいことを一緒に整理します。医療・介護・法律・税務・不動産の判断は行わず、誰に何を確認すべきかを整理します。",
    button: "状況整理について問い合わせる",
  },
  homeAndContract: {
    lead: "実家やお金について、契約を進める前に整理したい場合",
    body: "House OHANAでは、予定していることと未確認のことを整理し、どの専門分野へ何を確認する必要があるかを一緒に整理します。実家を売る・貸す、特定の制度を使うといった結論を、OHANAが決めることはありません。",
    button: "実家とお金の整理について問い合わせる",
  },
  normal: {
    body: "今すぐ個別相談が必要な状況とは限りません。まずは、結果に表示された「最初にすること」から進めてください。話が複雑になったときや、確認先が分からなくなったときに、House OHANAへご相談ください。",
  },
} as const;
