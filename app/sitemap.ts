import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

// 掲載するのは検索結果に載せてよい静的ページのみ。
// /diagnosis/result は診断結果ごとに異なるURLが無数に発行されるため、意図的に含めない
// （noindexメタデータと合わせて、検索エンジンに載せない方針を徹底する）。
const STATIC_PATHS = [
  "/",
  "/about",
  "/diagnosis",
  "/family",
  "/professionals",
  "/policy",
  "/research",
  "/contact",
  "/privacy",
  "/disclaimer",
];

export default function sitemap(): MetadataRoute.Sitemap {
  // 本番ドメイン(NEXT_PUBLIC_SITE_URL)が未設定の間は、誤った相対URLを掲載しないよう空配列を返す
  if (!siteConfig.url) return [];

  return STATIC_PATHS.map((path) => ({
    url: new URL(path, siteConfig.url).toString(),
  }));
}
