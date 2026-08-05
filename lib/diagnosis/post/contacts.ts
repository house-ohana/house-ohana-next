import type { PostValidAnswers, PostContactCard } from "./types";
import type { PostVariables } from "./variables";
import { CONTACT_CARDS } from "./guidanceContent";

/**
 * 「⑥誰に、何を確認するか」（第14節）。最大4件。
 * 病院／地域包括支援センター／ケアマネジャーは care_coordination グループとして
 * 最大1件だけ選ぶ（第14節の careCoordinationContact 関数）。
 */
const MAX_CONTACTS = 4;

type CareCoordinationContact = "hospital" | "regional_support" | "care_manager_if_assigned" | null;

function careCoordinationContact(answers: PostValidAnswers, v: PostVariables): CareCoordinationContact {
  if (answers.c1 === "hospitalized" && (v.isImmediateDeadline || v.isNearDeadline || v.activeSupportGap || v.supportPartlyUnclear)) {
    return "hospital";
  }
  if (v.needsRegionalSupport) {
    return "regional_support";
  }
  if (v.atHomeDirection && (v.supportUnclear || v.supportPartlyUnclear)) {
    return "care_manager_if_assigned";
  }
  return null;
}

function toCard(entry: (typeof CONTACT_CARDS)[keyof typeof CONTACT_CARDS]): PostContactCard {
  return {
    id: entry.id,
    name: entry.name,
    note: "note" in entry ? entry.note : undefined,
    questions: [...entry.questions],
  };
}

export function buildContacts(answers: PostValidAnswers, v: PostVariables): PostContactCard[] {
  const cards: PostContactCard[] = [];

  const coordination = careCoordinationContact(answers, v);
  if (coordination === "hospital") cards.push(toCard(CONTACT_CARDS.hospital));
  else if (coordination === "regional_support") cards.push(toCard(CONTACT_CARDS.regionalSupport));
  else if (coordination === "care_manager_if_assigned") cards.push(toCard(CONTACT_CARDS.careManager));

  // 実家・売却・税務に関わる窓口（司法書士・弁護士／不動産会社・宅建士／税理士）は
  // noHomeが真のとき表示しない
  const legalNeeded = v.homeActionExpected && (v.contractConcern || v.contractStatusUnknown);
  if (legalNeeded) cards.push(toCard(CONTACT_CARDS.legal));

  const fpNeeded = v.moneyUnclear || v.familyContribution || v.homeFinancePlanning;
  if (fpNeeded) cards.push(toCard(CONTACT_CARDS.fp));

  const realEstateNeeded = !v.noHome && (v.homeActionExpected || v.homeWillRemain);
  if (realEstateNeeded) cards.push(toCard(CONTACT_CARDS.realEstate));

  const taxByHome = !v.noHome && (v.homeFinancePlanning || answers.c6 === "will_be_vacant" || answers.c6 === "already_vacant");
  const taxByFamilyOnly = !v.noHome && !taxByHome && v.familyContribution;
  if (taxByHome) cards.push(toCard(CONTACT_CARDS.taxHome));
  else if (taxByFamilyOnly) cards.push(toCard(CONTACT_CARDS.taxFamilyOnly));

  return cards.slice(0, MAX_CONTACTS);
}
