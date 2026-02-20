import { NextRequest } from 'next/server';
import { proxyToBackend } from '../_proxy';
export async function GET(req: NextRequest)  { return proxyToBackend(req, '/api/runs'); }
export async function POST(req: NextRequest) { return proxyToBackend(req, '/api/runs'); }
