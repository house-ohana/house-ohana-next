import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // 3分整理ナビ（回答コードをクエリに含むページ）は、外部サイトへのリンク遷移時に
        // クエリ付きのリファラを送らないようにする（m-post v3.1修正版指示書 第11節）。
        source: "/diagnosis/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default nextConfig;
