// Phase3成果物（confirmedFacts／unknownItems）共通の項目型。

export type ArtifactFactItem = {
  id: string;
  text: string;
  /** 成果物内の表示順専用の値。診断ロジックの優先順位（moneyNeedsEarlyCheck等）とは無関係。 */
  priority: number;
  dedupeGroup: string;
};

// buildPostArtifacts（Step3）がPostResult.artifactsへ渡す統合型。
export type PostArtifacts = {
  confirmedFacts: ArtifactFactItem[];
  unknownItems: ArtifactFactItem[];
};
