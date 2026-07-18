import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name}｜${siteConfig.tagline}`;

// next/og の ImageResponse を使い、外部画像に頼らずローカルでOGP画像を生成しています。
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
          padding: "80px 96px",
          background: "#f1e8da",
          color: "#2c2a25",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#8a6b4f" }}>
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", fontSize: 60, fontWeight: 900, lineHeight: 1.35 }}>
          人生の後半も、好きな場所で、自分らしく。
        </div>
        <div style={{ display: "flex", fontSize: 38, fontWeight: 700, color: "#33453a" }}>
          その願いを、家族だけの負担にしない。
        </div>
      </div>
    ),
    { ...size },
  );
}
