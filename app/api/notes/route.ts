import { NextResponse } from 'next/server';

const GAS_URL = (process.env.GAS_URL || process.env.NEXT_PUBLIC_GAS_URL || "").trim();

export async function GET() {
  if (!GAS_URL) return NextResponse.json([], { status: 200 });
  try {
    const response = await fetch(GAS_URL, {
      method: "GET",
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      redirect: "follow"
    });

    if (!response.ok) throw new Error(`GAS HTTP Status: ${response.status}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[GET Proxy Error]:", error.message);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!GAS_URL) return NextResponse.json({ error: 'GAS_URL missing' }, { status: 500 });
  try {
    const body = await request.json();
    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify(body),
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
    });
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[POST Proxy Error]:", error.message);
    return NextResponse.json({ error: "Sync failed", detail: error.message }, { status: 200 });
  }
}
