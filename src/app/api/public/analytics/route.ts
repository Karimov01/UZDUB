import { NextResponse } from "next/server";

// Ichki sahifa analitikasi Vercel Analytics bilan almashtirildi.
// Eski mijoz bundlelari endpointga murojaat qilsa ham Neon bazaga yozuv qilinmaydi.
export async function POST() {
  return NextResponse.json({ ok: false, disabled: true }, { status: 410 });
}
