import { ImageResponse } from "next/og";

export const alt = "Zentrik Solutions: Engineering Reliable Power Solutions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 8, color: "#f26a1b", fontWeight: 700 }}>
          ZENTRIK SOLUTIONS (PVT) LTD
        </div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 900, lineHeight: 1, textTransform: "uppercase" }}>
          Engineering reliable power solutions.
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#c9d0d8" }}>
          Electrical engineering in Zimbabwe
        </div>
      </div>
    ),
    size,
  );
}
