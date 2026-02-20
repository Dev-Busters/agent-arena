import { NextRequest } from 'next/server';
import { proxyToBackend } from '../_proxy';
export async function GET(req: NextRequest) { return proxyToBackend(req, '/api/equipment'); }
export async function PUT(req: NextRequest) { return proxyToBackend(req, '/api/equipment'); }
