# Dashboard Improvements - Complete Implementation

## Overview

Completely redesigned the Agent Arena dashboard with:
- **Cost tracking** at session, daily, and historical levels
- **Model selector** for choosing API models (Haiku/Sonnet/Opus)
- **Real-time cost monitoring** with budget alerts
- **Cost history analytics** with filtering and breakdowns
- **Backend integration** for persistent cost tracking

---

## Features Implemented

### 1. **Cost Calculator Utility** (`utils/costCalculator.ts`)

**Features:**
- Anthropic API pricing for all models (Haiku, Sonnet, Opus)
- Cost calculation from token counts
- Task-specific estimates (battles, agent creation, decisions)
- Cost formatting (micro-dollars, milli-dollars, regular)
- Cost percentage calculation

**Usage:**
```typescript
import { calculateTokenCost, TASK_ESTIMATES, formatCost } from '@/utils/costCalculator'

const cost = calculateTokenCost({
  inputTokens: 1000,
  outputTokens: 500,
  model: 'haiku'
})

console.log(formatCost(cost.totalCost)) // "$0.0008"
```

---

### 2. **Cost Tracker** (`utils/costTracker.ts`)

**Features:**
- Session-based tracking (sessionStorage)
- Persistent history (localStorage)
- Token usage recording
- Cost statistics by time period, action, and model
- Export session data as JSON
- Clear history function

**Key Functions:**
- `initSession()` - Start tracking
- `recordUsage()` - Log an action
- `getSessionSummary()` - Current session stats
- `getCostHistory(days)` - Historical data
- `getCostStats(days)` - Breakdown by action/model
- `exportSessionData()` - Export as JSON

---

### 3. **UI Components**

#### **StatCard** (`components/Dashboard/StatCard.tsx`)
- Icon + label + value display
- Interactive with hover effects
- Tooltips and highlights
- Subtext for additional info

#### **CostWidget** (`components/Dashboard/CostWidget.tsx`)
- Expandable cost display
- Breakdown of input vs output costs
- Multiplier support (e.g., "5x $0.001")
- Model information
- Disclaimer about estimates

#### **ModelSelector** (`components/Dashboard/ModelSelector.tsx`)
- Dropdown to choose API model
- Real-time pricing display
- Descriptive labels (Fast & Cheap, Balanced, Most Capable)
- Updates dashboard estimates instantly

#### **CostHistory** (`components/Dashboard/CostHistory.tsx`)
- 7/30/90 day time range selection
- Cost breakdown by action type
- Top 10 recent actions with timestamps
- Average cost per action
- Total tokens used

#### **SessionSummary** (`components/Dashboard/SessionSummary.tsx`)
- Fixed bottom bar showing current session costs
- Real-time updates every second
- Daily run-rate projection
- Budget warning (⚠️ if >$10/day projected)
- List of all actions this session
- Cost optimization tips

#### **QuickActions** (`components/Dashboard/QuickActions.tsx`)
- Interactive action buttons
- Estimated cost for each action
- Links to battle, leaderboard, history

#### **AgentProfileCard** (`components/Dashboard/AgentProfileCard.tsx`)
- Full agent stats display
- HP bar with color coding
- Class-specific emojis and colors
- Stat cards for all attributes

---

### 4. **Backend Integration**

#### **Token Tracker** (`src/utils/tokenTracker.ts`)
- Anthropic pricing data
- Cost calculation from tokens
- Cost formatting utilities
- Estimated token counts for common tasks
- Token extraction from API responses

#### **Database Schema Updates** (`src/database/schema.sql`)

New `token_usage` table:
```sql
CREATE TABLE token_usage (
  id UUID PRIMARY KEY,
  user_id UUID,
  action VARCHAR(100),
  input_tokens INT,
  output_tokens INT,
  model VARCHAR(50),
  cost DECIMAL(10, 8),
  battle_id UUID,
  agent_id UUID,
  created_at TIMESTAMP
);
```

Indexes for fast lookups:
- By user & action
- By created date
- By battle/agent

Materialized view `user_cost_stats` for daily stats.

#### **Cost Routes** (`src/api/routes/costs.routes.ts`)

**Endpoints:**

1. **POST /api/costs/record**
   - Record token usage for an action
   - Request: `{ action, inputTokens, outputTokens, model, battleId?, agentId? }`
   - Response: `{ success, usage, cost }`

2. **GET /api/costs/summary?days=1**
   - Get cost summary for time period
   - Response: `{ actionCount, totalInputTokens, totalOutputTokens, totalCost, avgCostPerAction, modelsUsed, period }`

3. **GET /api/costs/history?days=7&action=battle&limit=50**
   - Get filtered cost history
   - Supports filtering by action
   - Paginated with limit & offset
   - Response: `{ items: [], count, limit, offset }`

4. **GET /api/costs/stats?days=30**
   - Get detailed statistics
   - Breakdowns by action, model, and daily
   - Response: `{ period, byAction, byModel, daily }`

5. **POST /api/costs/estimate** (Public)
   - Estimate cost without recording
   - Response: `{ action, inputTokens, outputTokens, model, cost }`

---

### 5. **API Client** (`frontend/src/utils/costApi.ts`)

Exported functions:
- `recordTokenUsage()` - Log usage to backend
- `getCostSummary(days)` - Fetch summary
- `getCostHistoryApi()` - Fetch history
- `getCostStatsApi(days)` - Fetch stats
- `estimateCost()` - Get estimate without recording

---

### 6. **Custom Hooks** (`frontend/src/hooks/useCostTracking.ts`)

#### **useCostTracking()**
- Syncs local tracking with backend
- Auto-refresh every 5 seconds
- Falls back to session data if offline
- Returns: `{ summary, history, lastSync, refresh }`

#### **useCostStats()**
- Loads historical stats
- Filters by time period
- Returns: `{ stats, isLoading, error }`

---

## Updated Dashboard Page

### Layout

**Left Column (2/3 width):**
- Agent Profile Card
  - Name, Level, Class
  - HP bar with color coding
  - Experience
  - Full stat grid

**Right Column (1/3 width):**
- Model Selector dropdown
- Quick Actions (Battle, Leaderboard, History)
- Cost History (expandable)
- Estimated Costs widgets
- Info box with tips

**Bottom:**
- Fixed Session Summary bar
  - Current session cost
  - Estimated daily run rate
  - Models used
  - List of all actions
  - Budget alert if >$10/day
  - Cost optimization tips

### Features

✅ **Model Selection**
- Switch between Haiku, Sonnet, Opus
- Pricing updates instantly
- All estimates recalculate

✅ **Real-Time Cost Monitoring**
- Session summary updates every second
- Shows total cost, token count, action count
- Projects daily burn rate

✅ **Budget Alerts**
- Warning if projected daily cost >$10
- Suggests cheaper models
- Shows current usage rate

✅ **Cost History**
- 7/30/90 day view
- Breakdown by action type
- Recent actions with timestamps
- Average cost metrics

✅ **Better UX**
- Sticky navigation
- Hover effects on all cards
- Expandable sections
- Responsive grid layout
- Color-coded HP bar
- Class-specific emojis

---

## Integration Checklist

### Frontend ✅
- [x] Cost calculator utility
- [x] Cost tracker (session + persistent)
- [x] Model selector component
- [x] Cost history component
- [x] Session summary component
- [x] Cost API client
- [x] useCostTracking hook
- [x] Updated dashboard page
- [x] New component exports

### Backend ✅
- [x] Token tracker utility
- [x] Database schema (token_usage table)
- [x] Database indexes
- [x] Cost routes (5 endpoints)
- [x] Server integration

### Next Steps
1. Run migrations: `npm run migrate` (or equivalent)
2. Test cost recording with a battle
3. Verify backend endpoints work
4. Monitor token usage

---

## Token Usage Tracking Workflow

### Recording Usage

When a battle completes:

```typescript
import { recordTokenUsage } from '@/utils/costApi'

await recordTokenUsage(
  action: 'battle',
  inputTokens: 847,
  outputTokens: 312,
  model: 'haiku',
  battleId: 'battle-123'
)
```

### Dashboard Display

1. **Session Summary** (bottom bar)
   - Updates from local session tracking
   - Also syncs from backend every 5 seconds

2. **Cost History** (right column)
   - Shows last 7/30/90 days
   - Grouping by action type
   - Recent actions list

3. **Model Selector**
   - Choose Haiku/Sonnet/Opus
   - All costs recalculate
   - Persistent selection

---

## Pricing Reference

### Models (per 1M tokens)

| Model | Input | Output | Tier |
|-------|-------|--------|------|
| **Haiku** ⚡ | $0.80 | $4.00 | Fast & Cheap |
| **Sonnet** ⚙️ | $3.00 | $15.00 | Balanced |
| **Opus** 🧠 | $15.00 | $75.00 | Most Capable |

### Estimated Token Usage

- Battle: 750 input + 300 output
- Agent Creation: 400 input + 150 output
- Agent Decision: 1500 input + 350 output
- Battle Log Analysis: 2000 input + 500 output

---

## Performance Considerations

✅ **Optimizations:**
- Token usage recorded async (doesn't block UI)
- History paginated (limit 50-100 items)
- Summary stats cached at database level
- Session tracking in sessionStorage (fast)
- Persistent history in localStorage (survives reload)
- Backend fallback if offline

---

## Files Created/Modified

**Created:**
- `frontend/src/utils/costCalculator.ts`
- `frontend/src/utils/costTracker.ts`
- `frontend/src/utils/costApi.ts`
- `frontend/src/components/Dashboard/StatCard.tsx`
- `frontend/src/components/Dashboard/CostWidget.tsx`
- `frontend/src/components/Dashboard/ModelSelector.tsx`
- `frontend/src/components/Dashboard/CostHistory.tsx`
- `frontend/src/components/Dashboard/SessionSummary.tsx`
- `frontend/src/components/Dashboard/AgentProfileCard.tsx`
- `frontend/src/components/Dashboard/QuickActions.tsx`
- `frontend/src/components/Dashboard/index.ts`
- `frontend/src/hooks/useCostTracking.ts`
- `src/utils/tokenTracker.ts`
- `src/api/routes/costs.routes.ts`

**Modified:**
- `frontend/src/app/dashboard/page.tsx`
- `src/database/schema.sql`
- `src/server.ts`

---

## Questions?

All components are self-contained and well-documented. The backend is ready to integrate with actual API calls that return `{ usage: { input_tokens, output_tokens } }` in responses.

To start recording real usage, just call `recordTokenUsage()` after API calls that support token counting!
