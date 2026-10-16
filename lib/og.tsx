import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Flat branded social card: navy field, orange rule, white type. No gradients or shadows. */
export function renderOg(kicker: string, title: string) {
  const size = title.length > 70 ? 58 : title.length > 40 ? 68 : 80;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b1f3a",
          color: "#ffffff",
          padding: 72,
          borderBottom: "16px solid #f26a1b",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, color: "#f26a1b", fontWeight: 700, textTransform: "uppercase" }}>
          {kicker}
        </div>
        <div style={{ display: "flex", fontSize: size, fontWeight: 800, lineHeight: 1.05, textTransform: "uppercase" }}>{title}</div>
        <div style={{ display: "flex", fontSize: 28, color: "#c9d0d8", letterSpacing: 3 }}>ZENTRIK SOLUTIONS (PVT) LTD  |  ZIMBABWE</div>
      </div>
    ),
    OG_SIZE,
  );
}
