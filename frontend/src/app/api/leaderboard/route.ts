import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '../_proxy';

// Fallback data if backend is unreachable or has no data yet
const MOCK_LEADERBOARD = [
  { rank:1,  userId:'u1', username:'@voidwalker',   agentName:'Crimson Arbiter',  doctrine:'iron', deepestFloor:28, totalKills:412, totalRuns:14, doctrineLevel:{ iron:18, arc:4, edge:7 } },
  { rank:2,  userId:'u2', username:'@arcmancer',    agentName:'Stormcaller Alpha', doctrine:'arc',  deepestFloor:24, totalKills:388, totalRuns:11, doctrineLevel:{ iron:3, arc:22, edge:5 } },
  { rank:3,  userId:'u3', username:'@edgebender',   agentName:'Wraith Protocol',  doctrine:'edge', deepestFloor:21, totalKills:356, totalRuns:18, doctrineLevel:{ iron:5, arc:6, edge:19 } },
  { rank:4,  userId:'u4', username:'@ironclad99',   agentName:'Fortress Eternal', doctrine:'iron', deepestFloor:19, totalKills:290, totalRuns:9,  doctrineLevel:{ iron:15, arc:2, edge:3 } },
  { rank:5,  userId:'u5', username:'@static_surge', agentName:'Arc Conduit Mk.II',doctrine:'arc',  deepestFloor:17, totalKills:260, totalRuns:12, doctrineLevel:{ iron:2, arc:17, edge:4 } },
  { rank:6,  userId:'u6', username:'@phantomrun',   agentName:'Tempest Shadow',   doctrine:'edge', deepestFloor:15, totalKills:241, totalRuns:20, doctrineLevel:{ iron:4, arc:5, edge:14 } },
  { rank:7,  userId:'u7', username:'@theharrowed',  agentName:'Unbound Legion',   doctrine:'iron', deepestFloor:14, totalKills:218, totalRuns:7,  doctrineLevel:{ iron:12, arc:8, edge:6 } },
  { rank:8,  userId:'u8', username:'@surge_king',   agentName:'Overcharge Omega', doctrine:'arc',  deepestFloor:13, totalKills:195, totalRuns:8,  doctrineLevel:{ iron:1, arc:14, edge:2 } },
  { rank:9,  userId:'u9', username:'@blademaster',  agentName:'Assassin Prime',   doctrine:'edge', deepestFloor:12, totalKills:180, totalRuns:15, doctrineLevel:{ iron:3, arc:3, edge:12 } },
  { rank:10, userId:'u10',username:'@warden_falls', agentName:'Last Rampart',     doctrine:'iron', deepestFloor:11, totalKills:162, totalRuns:6,  doctrineLevel:{ iron:10, arc:1, edge:2 } },
];

export async function GET(req: NextRequest) {
  try {
    const res = await proxyToBackend(req, '/api/leaderboard');
    const data = await res.json();
    // If backend returned a valid array with entries, use it
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }
    return NextResponse.json(MOCK_LEADERBOARD);
  } catch {
    return NextResponse.json(MOCK_LEADERBOARD);
  }
}
