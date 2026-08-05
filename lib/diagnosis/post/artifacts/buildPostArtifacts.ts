import type { PostValidAnswers } from "../types";
import type { PostVariables } from "../variables";
import type { PostArtifacts } from "./types";
import { buildConfirmedFacts } from "./buildConfirmedFacts";
import { buildUnknownItems } from "./buildUnknownItems";

/**
 * Phase3成果物（confirmedFacts／unknownItems）のオーケストレータ。
 * buildConfirmedFacts／buildUnknownItemsを束ねるだけの純粋関数で、新しい判定・条件式は持たない。
 */
export function buildPostArtifacts(answers: PostValidAnswers, variables: PostVariables): PostArtifacts {
  return {
    confirmedFacts: buildConfirmedFacts(answers, variables),
    unknownItems: buildUnknownItems(variables),
  };
}
