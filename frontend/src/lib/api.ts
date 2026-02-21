/**
 * Agent Arena — Railway Backend API Client
 * All requests proxy through Next.js API routes (/api/*) which forward to Railway.
 */

const API_BASE = '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) {
    console.warn('[API] No token found in localStorage');
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers ?? {}),
  };
  console.log('[API] Request:', { path, method: options.method, hasAuth: !!headers.Authorization });
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  level: number;
  createdAt: string;
}

export interface LoginResponse { token: string; user: AuthUser; }

export const auth = {
  login:    (email: string, password: string)                  => request<LoginResponse>('/auth/login',    { method:'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, username: string) => request<LoginResponse>('/auth/register', { method:'POST', body: JSON.stringify({ email, password, username }) }),
  me:       ()                                                  => request<AuthUser>('/auth/me'),
};

// ── Agents ───────────────────────────────────────────────────────────────────
export interface AgentRecord {
  id: string;
  userId: string;
  name: string;
  doctrine: 'iron' | 'arc' | 'edge' | null;
  doctrineXP: { iron: number; arc: number; edge: number };
  doctrineLevel: { iron: number; arc: number; edge: number };
  equippedAbilities: { Q: string|null; E: string|null; R: string|null; F: string|null };
  totalKills: number;
  totalRuns: number;
  deepestFloor: number;
  ash: number;
  ember: number;
  arenaMarks: number;
  updatedAt: string;
}

export const agents = {
  me:     () => request<AgentRecord>('/agents/me'),
  sync:   (data: Partial<AgentRecord>) => request<AgentRecord>('/agents/me', { method:'PUT', body: JSON.stringify(data) }),
  stats:  () => request<{ totalKills: number; totalRuns: number; deepestFloor: number }>('/agents/me/stats'),
};

// ── Runs ─────────────────────────────────────────────────────────────────────
export interface RunRecord {
  id: string;
  userId: string;
  doctrine: string;
  floorsCleared: number;
  kills: number;
  timeSeconds: number;
  ashEarned: number;
  emberEarned: number;
  arenaMarksEarned: number;
  outcome: 'fallen' | 'escaped';
  createdAt: string;
}

export const runs = {
  list:   (limit = 10) => request<RunRecord[]>(`/runs?limit=${limit}`),
  recent: ()           => request<RunRecord[]>('/runs?limit=3'),
  submit: (run: Omit<RunRecord, 'id' | 'userId' | 'createdAt'>) =>
    request<RunRecord>('/runs', { method:'POST', body: JSON.stringify(run) }),
};

// ── Leaderboard ──────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  agentName: string;
  doctrine: 'iron' | 'arc' | 'edge' | null;
  deepestFloor: number;
  totalKills: number;
  totalRuns: number;
  doctrineLevel: { iron: number; arc: number; edge: number };
  winRate?: number;
  elo?: number;
}

export const leaderboard = {
  top:    (limit = 50, doctrine?: string) =>
    request<LeaderboardEntry[]>(`/leaderboard?limit=${limit}${doctrine ? `&doctrine=${doctrine}` : ''}`),
};

// ── Equipment sync ───────────────────────────────────────────────────────────
export interface EquipmentPayload {
  slots: Record<string, unknown>;
  inventory: unknown[];
  materialStacks: unknown[];
  unlockedBlueprints: string[];
}

export const equipment = {
  get:  ()                       => request<EquipmentPayload>('/equipment'),
  sync: (payload: EquipmentPayload) => request<EquipmentPayload>('/equipment', { method:'PUT', body: JSON.stringify(payload) }),
};
