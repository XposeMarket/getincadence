# Reports Permissions Plan - Audit & Recommendations

## ✅ Current State Verification

### Backend Infrastructure (Already Built)
- ✅ Subscription tier system (`solo`, `starter`, `team`, `growth`)
- ✅ Plan limits tracked in DB (`lib/subscription/plans.ts`)
- ✅ User seat management
- ✅ Stripe integration for payment tiers
- ✅ API endpoint to fetch user subscription (`/api/subscription`)

### Reports Page Structure (Already Built)
All 14 sections are implemented with `data-report-section` attributes:

1. ✅ `stats` — KPI Summary (Total Revenue, Contacts, Won, Tasks)
2. ✅ `pipeline` — Pipeline Overview
3. ✅ `dealsByOwner` — Deals by Owner
4. ✅ `idleDeals3to7` — Idle Deals (3-7 Days)
5. ✅ `idleDeals7plus` — Idle Deals (7+ Days)
6. ✅ `overdueTasks` — Overdue Tasks
7. ✅ `incompleteTasks` — Incomplete Tasks
8. ✅ `topDeals` — Top Open Deals
9. ✅ `winMetrics` — Win Rate & Metrics
10. ✅ `dealsLost` — Deals Lost (currently full version)
11. ✅ `stageTimings` — Avg Time in Stage (currently full version)
12. ✅ `funnel` — Conversion Funnel
13. ✅ `velocity` — Sales Velocity
14. ✅ `forecast` — Forecast Pipeline

---

## 🎯 Plan Alignment Analysis

### Match: 95% Solid ✅

Your GPT plan maps perfectly to the codebase structure. Here's the mapping:

| Plan Tier | Codebase Match | Status |
|-----------|----------------|--------|
| Solo visibility | Stats, Idle, Tasks, Top Deals, Win Rate | ✅ 100% |
| Starter additions | Pipeline, Deals Lost (basic), Stage Timings (basic) | ✅ 100% |
| Team full | + Charts, trends, Funnel, Velocity, Forecast | ✅ 100% |
| Growth | + AI, Custom Fields, API, Seasonal Trends | ✅ Planned |

---

## 🔍 Critical Finding: "Basic" vs "Full" Modes

**Current Issue:**
The plan mentions:
- **Starter**: "Deals Lost (basic)" — Text list, no chart
- **Starter**: "Avg Time in Stage (summary)" — List only, no chart

**But the code shows:**
- Both sections are currently built in their FULL form (with charts, trends, visualization)
- No "basic" or "summary" variants exist

**What this means:**
1. You need to create TWO versions of each dual-mode section:
   - Basic (Starter): Text-only lists
   - Full (Team+): Charts, trends, sorting

2. Or: Accept that Starter gets some chart features early

---

## 🛠️ Implementation Recommendations

### Recommendation 1: Create Lightweight Variants (RECOMMENDED)

This is what your GPT plan suggests. Create these components:

```tsx
// Option A: Conditional rendering (simplest)
{userTierHas('dealsLostFull') ? (
  <DealsLostFull data={data} />
) : (
  <DealsLostBasic data={data} />
)}

// Option B: Feature flags within component
<DealsLost 
  data={data} 
  showCharts={userTierHas('dealsLostFull')}
  showTrends={userTierHas('dealsLostFull')}
/>
```

**Pros:**
- Clear, expected behavior per tier
- Users see exact value progression when they upgrade
- No surprises (e.g., "I paid $29 and still see no charts?")

**Cons:**
- Requires ~2-3 hours of UI work per dual-mode section

### Recommendation 2: Simpler Approach (FASTER)

Accept that Starter sees some chart features. Adjust the plan to:

**Starter includes:**
- Deals Lost WITH reason breakdown chart
- Avg Time in Stage WITH bar chart
- BUT no trends, no historical comparison

**Difference from Team:**
- Starter: "This month" view only
- Team: "This month vs last month" comparisons, trends

**Pros:**
- Minimal code changes (just add a `showTrends` flag)
- Still clear value progression
- Faster to implement (~30 mins)

**Cons:**
- Less granular tier differentiation

---

## 🔐 Permission Layers (Pick One)

### Layer 1: Entire Section Locked (Simple)
```tsx
{userTierHas('dealsLost') ? (
  <DealsLostSection />
) : (
  <LockedCard title="Deals Lost" tier="Starter" />
)}
```

**Sections to lock at tier level:**
- Solo: Hides `pipeline`, `dealsLost`, `stageTimings`, `funnel`, `velocity`, `forecast`
- Starter: Hides `funnel`, `velocity`, `forecast` (if you want to differentiate)

### Layer 2: Section Visible, Features Locked (Your Plan)
```tsx
<DealsLost 
  data={data}
  lockedFeatures={{
    chart: !userTierHas('dealsLostFull'),
    trends: !userTierHas('dealsLostFull'),
    historicalCompare: !userTierHas('dealsLostFull'),
  }}
/>
```

**Better UX:** Users see they have lost deals, but detailed analysis is locked.

---

## 📊 Recommended Tier Structure (Final)

Based on your codebase, here's the most practical breakdown:

### 🟢 SOLO (Free)
**Show:**
- `stats` (4 KPI cards)
- `idleDeals3to7`, `idleDeals7plus` (always important)
- `overdueTasks`, `incompleteTasks`
- `topDeals` (basic list)
- `winMetrics` (numbers only, no visualization)

**Lock:**
- Everything else with "Upgrade to see pipeline insights"

### 🟡 STARTER ($29/mo)
**Show:**
- Everything in Solo, plus:
- `pipeline` (full view)
- `dealsByOwner` (full view)
- `dealsLost` (WITH chart, but no trends/historical)
- `stageTimings` (WITH simple bar chart, no sorting)

**Lock:**
- `funnel`, `velocity`, `forecast` with "Upgrade to Team for diagnostics"

### 🔵 TEAM ($59/mo)
**Show:**
- Everything in Starter, plus:
- `funnel` (full step-ladder)
- `velocity` (with trends)
- `forecast` (full weighted pipeline)
- `dealsLost` (WITH trends & historical comparison)
- `stageTimings` (WITH sorting, deal counts)

**Lock:**
- `seasonalTrends`, `aiAdvisor` (not yet built)

### 🟣 GROWTH ($99/mo)
**Show:**
- Everything

---

## ⚠️ One Important Caveat

The plan says:
> "Never hide data users already created."

**Key concern:**
- If a Solo user has created deals and lost some, do they see the count in Solo?
- Or does the ENTIRE Deals Lost card disappear?

**Recommendation:**
Show a summary in Solo:
```
"Deals Lost: 3 deals, $15,000 value"
↓ [Unlock full analysis for $29/mo]
```

This follows Notion/Figma pattern: "Here's what you have. Here's what you're missing."

---

## 🚀 Implementation Roadmap

### Phase 1: Add Permission Checks (2 hours)
- [ ] Fetch user tier in `/reports/page.tsx`
- [ ] Create `useReportPermissions` hook
- [ ] Create `LockedCard` component
- [ ] Wrap each section with tier check
- [ ] Test all four tiers with mock data

### Phase 2: Create Basic Variants (3-4 hours)
- [ ] `DealsLostBasic` — Text list only, no chart
- [ ] `StageTimingsBasic` — Simple list, no bar chart
- [ ] Add conditional rendering logic
- [ ] Test transitions between tiers

### Phase 3: Add Trend/Historical Toggle (2 hours)
- [ ] Add `showTrends` prop to `DealsLost`, `Velocity`
- [ ] Add `showHistorical` to `StageTimings`
- [ ] Test visual differences per tier

### Phase 4: Print Modal Restrictions (1 hour)
- [ ] Disable print options for locked sections
- [ ] Update presets per tier
- [ ] Test print output per tier

**Total Time: ~8-9 hours of development**

---

## ✨ Final Assessment

**Plan Quality: 9/10** ✅

The GPT plan is:
- ✅ Clear and opinionated (no ambiguity)
- ✅ Follows real SaaS patterns (Notion, Linear)
- ✅ Aligns with your codebase structure
- ✅ Doesn't over-complicate permissions
- ✅ Has clear upgrade paths

**Only changes needed:**
1. Decide: Full lock vs feature lock for dual-mode sections
2. Decide: Show summary in Solo or hide entire section?
3. Build the basic/summary variants (if you choose feature lock)

**My recommendation:**
Go with **Layer 2 (feature lock) + show summaries in Solo**. It's more user-friendly and aligns with modern SaaS.
