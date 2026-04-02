import { NextResponse } from 'next/server';

const GAS_URL = process.env.GAS_URL;

export async function GET() {
  console.log("[Proxy GET] Target URL:", GAS_URL);
  
  if (!GAS_URL) {
    console.error("[Proxy GET Error] GAS_URL is empty in process.env");
    return NextResponse.json({ error: 'GAS_URL is not set' }, { status: 500 });
  }

  try {
    const response = await fetch(GAS_URL, {
      method: "GET",
      cache: "no-store",
    });
    
    if (!response.ok) {
      console.error("[Proxy GET Error] GAS returned status:", response.status);
      const text = await response.text();
      console.error("[Proxy GET Error] GAS Response body (first 500 chars):", text.slice(0, 500));
      throw new Error(`GAS Response Error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Proxy GET Error] Catch block:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!GAS_URL) {
    return NextResponse.json({ error: 'GAS_URL is not set' }, { status: 500 });
  }

  try {
    const body = await request.json();
    console.log("[Proxy POST] Action:", body.action, "ID:", body.id || "no-id");
    
    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });

    if (!response.ok) {
        console.error("[Proxy POST Error] GAS returned status:", response.status);
        throw new Error(`GAS POST Error: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Proxy POST Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
