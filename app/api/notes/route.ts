import { NextResponse } from 'next/server';

// 빌드마다 환경변수가 주입될 수 있도록 동적으로 로드합니다.
const GAS_URL = (process.env.GAS_URL || process.env.NEXT_PUBLIC_GAS_URL || "").trim();

export async function GET() {
  if (!GAS_URL) return NextResponse.json([], { status: 200 });

  try {
    const response = await fetch(GAS_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`GAS GET Status: ${response.status}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[GET Error]", error.message);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!GAS_URL) {
    console.error("[POST Error] GAS_URL is missing in environment");
    return NextResponse.json({ error: 'GAS_URL not found' }, { status: 500 });
  }

  try {
    const body = await request.json();
    console.log("[Proxy POST] Sending Action:", body.action);

    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify(body),
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[POST Error Detailed]:", error.message);
    return NextResponse.json({ error: "GAS Sync Failed", detail: error.message }, { status: 200 });
  }
}
// Force update trigger: 2026-04-02-1450
