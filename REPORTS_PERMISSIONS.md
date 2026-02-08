# Reports Page Permissions Strategy

## Core Principle
**One Reports page, same layout, but sections unlock by tier.**

Never hide data users created. Lock analysis, visualization, and historical depth instead.

---

## Tier Breakdown

### 🟢 SOLO (Personal Awareness)

**Visible & Functional:**
- KPI Summary (4 cards)
  - Total Revenue
  - New Contacts
  - Deals Won
  - Tasks Completed
- Execution Health
  - Idle Deals (3-7 days)
  - Idle Deals (7+ days)
  - Overdue Tasks
  - Incomplete Tasks
- Basic Metrics (No charts, just numbers)
  - Win Rate
  - Avg Deal Size
  - Avg Sales Cycle

**Locked (Show with Upgrade CTA):**
- Deals Lost (entire section)
- Pipeline Overview (entire section)
- Avg Time in Stage
- Conversion Funnel
- Sales Velocity
- Forecast Pipeline

**Upgrade Copy:**
> "Advanced insights unlock as your pipeline grows. Upgrade to Starter."

---

### 🟡 STARTER (Early Optimization)

**Visible & Functional:**
- Everything in SOLO, plus:
- Pipeline Overview (full)
  - All stages, deal counts, values
- Deals Lost (basic mode)
  - Total count + value
  - Loss reason breakdown (text list, no chart)
  - Last 3 lost deals
  - No trend comparison
- Avg Time in Stage (summary)
  - Simple list of stages with avg days
  - No visualization
  - No sorting
  - No deal counts per stage

**Locked (Show with Upgrade CTA):**
- Deals Lost (detailed) - full charts, trends, last 5
- Avg Time in Stage (detailed) - bar charts, sorting
- Conversion Funnel
- Sales Velocity
- Forecast Pipeline
- Seasonal Trends

**Upgrade Copy:**
> "See deeper diagnostics. Upgrade to Team for charts, trends, and full pipeline analysis."

---

### 🔵 TEAM (Pipeline Mastery) ⭐ MOST POPULAR

**Visible & Functional:**
- Everything in STARTER, plus:
- Deals Lost (full)
  - Reason breakdown with chart
  - Trend vs previous period
  - Last 5 lost deals
- Avg Time in Stage (full)
  - Horizontal bar chart
  - Sortable longest → shortest
  - Deal count per stage
  - Insight box
- Conversion Funnel (full step-ladder UI)
  - Stage-to-stage %
  - Drop-off analysis
- Sales Velocity
  - Dollar value per day
  - Trend vs previous period
  - Coaching copy when low data
- Forecast Pipeline
  - Weighted revenue by stage
  - Expected close value
  - Estimated probability disclaimer

**Locked (Show with Upgrade CTA):**
- Seasonal Trends (monthly/quarterly patterns)
- AI Sales Advisor
- Predictive scoring
- Benchmarks

**Upgrade Copy:**
> "Start predicting outcomes. Upgrade to Growth for AI insights and strategic recommendations."

---

### 🟣 GROWTH (Strategic + AI-Driven)

**Visible & Functional:**
- Everything in TEAM, plus:
- Seasonal Trends
  - Monthly patterns
  - Quarterly patterns
  - YoY comparison
- AI Sales Advisor
  - Actionable insights
  - At-risk deal watchlist
  - Recommendations tied to metrics
  - Manual refresh + smart caching
- Advanced Permissions
  - Manager-only views
  - Role-based report access
- Custom Fields in Reports
  - Filter by custom fields
  - Group by custom fields
- API Access
  - Export reports
  - BI tool integrations (Looker, Tableau, etc.)

**Everything Unlocked** (no CTAs)

---

## Implementation Details

### Section Visibility Matrix

| Section | Solo | Starter | Team | Growth | Notes |
|---------|------|---------|------|--------|-------|
| KPI Summary | ✅ | ✅ | ✅ | ✅ | Always visible |
| Idle Deals | ✅ | ✅ | ✅ | ✅ | Always visible |
| Overdue Tasks | ✅ | ✅ | ✅ | ✅ | Always visible |
| Incomplete Tasks | ✅ | ✅ | ✅ | ✅ | Always visible |
| Top Open Deals | ✅ | ✅ | ✅ | ✅ | Always visible |
| Win Rate / Metrics | ✅ | ✅ | ✅ | ✅ | Always visible |
| Pipeline Overview | 🔒 | ✅ | ✅ | ✅ | Locked in Solo |
| Deals Lost (Basic) | 🔒 | ✅ | ✅ | ✅ | Text-only in Starter |
| Deals Lost (Full) | 🔒 | 🔒 | ✅ | ✅ | Charts in Team+ |
| Avg Time in Stage (Summary) | 🔒 | ✅ | ✅ | ✅ | List-only in Starter |
| Avg Time in Stage (Chart) | 🔒 | 🔒 | ✅ | ✅ | Charts in Team+ |
| Conversion Funnel | 🔒 | 🔒 | ✅ | ✅ | Team+ only |
| Sales Velocity | 🔒 | 🔒 | ✅ | ✅ | Team+ only |
| Forecast Pipeline | 🔒 | 🔒 | ✅ | ✅ | Team+ only |
| Seasonal Trends | 🔒 | 🔒 | 🔒 | ✅ | Growth only |
| AI Sales Advisor | 🔒 | 🔒 | 🔒 | ✅ | Growth only |
| Custom Fields | 🔒 | 🔒 | 🔒 | ✅ | Growth only |
| API Access | 🔒 | 🔒 | 🔒 | ✅ | Growth only |

### Component Pattern: Locked Section

```tsx
// Every locked section follows this pattern:

<div data-report-section="sectionKey">
  {userTierHas('feature') ? (
    // Show full content
    <FullComponent />
  ) : (
    // Show locked state with CTA
    <LockedCard
      icon={ChevronUp}
      title="Conversion Funnel"
      description="See where deals drop off between stages."
      requiredTier="Team"
      upgradeCopy="Upgrade to Team for full pipeline diagnostics."
      currentTier={userTier}
    />
  )}
</div>
```

### LockedCard Component (to be created)

```tsx
interface LockedCardProps {
  icon: LucideIcon
  title: string
  description: string
  requiredTier: 'Starter' | 'Team' | 'Growth'
  upgradeCopy: string
  currentTier: SubscriptionPlan
}

// Shows:
// - Icon + title
// - Description
// - "Upgrade to [Tier]" button linking to billing
// - Subtle gradient overlay
```

---

## Tier Detection Logic

```tsx
// In reports/page.tsx, add:

type SubscriptionPlan = 'solo' | 'starter' | 'team' | 'growth'

const tierFeatures: Record<SubscriptionPlan, Set<string>> = {
  solo: new Set([
    'kpiSummary',
    'idleDeals',
    'overdueTasks',
    'incompleteTasks',
    'topDeals',
    'winMetrics',
  ]),
  starter: new Set([
    ...tierFeatures.solo,
    'pipelineOverview',
    'dealsLostBasic',
    'stageTimingsBasic',
  ]),
  team: new Set([
    ...tierFeatures.starter,
    'dealsLostFull',
    'stageTimingsFull',
    'funnel',
    'velocity',
    'forecast',
  ]),
  growth: new Set([
    ...tierFeatures.team,
    'seasonalTrends',
    'aiAdvisor',
    'advancedPermissions',
    'customFields',
    'apiAccess',
  ]),
}

const userTierHas = (feature: string): boolean => {
  return tierFeatures[userSubscription.plan].has(feature)
}
```

---

## Migration Strategy (When Upgrading/Downgrading)

### Upgrading (e.g., Solo → Starter)
- ✅ All new features visible immediately
- ✅ Reports persist
- ✅ New sections unlock with data already loaded

### Downgrading (e.g., Team → Solo)
- ✅ Summary metrics remain visible
- ✅ Locked sections show with upgrade CTA
- ⚠️ No data loss (user can always upgrade back)
- ⚠️ Advanced features show "locked" state

### Key Rule: Never Remove Data User Created
- Lost deals still count toward "Total Lost" in Solo
- User can see they have data, just not full analysis
- Encourages re-upgrade instead of churn

---

## Print Modal Updates

Print modal should show available sections based on tier:
- SOLO: Shows only Solo sections in export options
- STARTER: Shows Solo + Starter sections
- TEAM: Shows Solo + Starter + Team sections
- GROWTH: Shows all sections

Users cannot print locked sections.

---

## Future Enhancements (Phase 2)

These require new infrastructure but don't affect current tier structure:

- **Seasonal Trends** (Growth tier)
  - Requires historical data aggregation
  - Monthly/quarterly bucketing
  - YoY comparison logic

- **AI Sales Advisor** (Growth tier)
  - Requires OpenAI integration
  - Analysis caching layer
  - Watchlist data model

- **Custom Fields** (Growth tier)
  - Requires schema flexibility
  - Filter/group UI components
  - Dynamic report building

- **API Access** (Growth tier)
  - Requires API route protection
  - Report export endpoints
  - Rate limiting

---

## Implementation Checklist

### Phase 1: Tier Gates (This Sprint)
- [ ] Get user subscription tier from database
- [ ] Create `useReportPermissions` hook
- [ ] Create `LockedCard` component
- [ ] Wrap locked sections in permission checks
- [ ] Update print modal to respect tiers
- [ ] Test all four tier levels locally

### Phase 2: Tier-Specific Visuals (Next Sprint)
- [ ] Replace basic Deals Lost in Starter with list-only UI
- [ ] Replace basic Avg Time in Stage with no-chart version
- [ ] Add visual distinction for locked sections
- [ ] Add "Upgrade" buttons linking to `/settings/billing`

### Phase 3: AI + Advanced Features (Later)
- [ ] Seasonal Trends section
- [ ] AI Sales Advisor integration
- [ ] Custom fields filtering
- [ ] API routes for exports

---

## Design Pattern Consistency

All locked sections follow this visual pattern:

```
┌─────────────────────────────────────┐
│ 🔒 Feature Name                      │
│                                      │
│ Unlock this insight to see where    │
│ your pipeline slows down.           │
│                                      │
│         [Upgrade to Team]           │
│         Includes 2 more users       │
└─────────────────────────────────────┘
```

This keeps upgrade CTAs consistent and non-intrusive.
