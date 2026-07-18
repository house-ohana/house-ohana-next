import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

// /diagnosis/result はrobots.txtで一律ブロックしない方針。
// 検索結果に載せない制御は、そのページ自体のrobotsメタデータ(noindex)側で行う
// （URLを知っている人が直接アクセスしたり共有したりすることは想定通りの利用のため）。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    ...(siteConfig.url ? { sitemap: new URL("/sitemap.xml", siteConfig.url).toString() } : {}),
  };
}
