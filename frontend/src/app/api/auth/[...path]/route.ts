import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'https://backend-production-6816.up.railway.app';

async function proxy(req: NextRequest, params: { path: string[] }) {
  const path = params.path.join('/');
  const url = `${BACKEND}/api/auth/${path}`;
  const body = req.method !== 'GET' ? await req.text() : undefined;
  const res = await fetch(url, {
    method: req.method,
    headers: { 'Content-Type': 'application/json', ...Object.fromEntries(req.headers) },
    body,
  }).catch(() => null);
  if (!res) return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } })  { return proxy(req, params); }
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) { return proxy(req, params); }
