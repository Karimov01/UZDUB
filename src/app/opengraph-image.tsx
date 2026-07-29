import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: "linear-gradient(135deg, #0a0a0f, #251044)", color: "white", fontFamily: "Arial" }}><div style={{ display: "flex", alignItems: "center", gap: 22, color: "#c4b5fd", fontSize: 34 }}>O&apos;ZBEK TILIDAGI KINO VA SERIALLAR</div><div style={{ marginTop: 25, fontSize: 98, fontWeight: 800 }}>UZDUB Play</div><div style={{ marginTop: 24, fontSize: 34, color: "#d1d5db" }}>Premium tomosha tajribasi</div></div>, size);
}
