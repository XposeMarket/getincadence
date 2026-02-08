# Photographer Vertical Implementation - Phase 1 & 2

## Summary
Implemented industry type system for Cadence CRM, starting with support for two verticals:
1. **Default** - Standard sales CRM
2. **Photographer** - Photography booking and project management

## Changes Made

### Phase 1: Industry Configuration System
**File**: `lib/industry-config.ts`

Core configuration file that defines:
- **Terminology mappings** for each industry (Deals → Bookings, Contacts → Clients, etc.)
- **Default pipeline stages** specific to each industry
- **Feature flags** to show/hide reports based on industry
- **Helper functions** to access configs throughout the app

**Photographer Industry Definition**:
```
Terminology:
- Deals → Bookings
- Pipeline → Booking Flow  
- Contacts → Clients
- Tasks → To-Dos
- Reports → Insights
- Close Date → Event Date
- Deal Amount → Package Price

Pipeline Stages (in order):
1. Inquiry (gray)
2. Booked (blue)
3. Shoot Complete (amber)
4. Editing (purple)
5. Delivered (green - won)
6. Paid (cyan - won)
7. Declined (red - lost)

Features Disabled:
- Sales Reports (doesn't apply to photographers)
- Forecast (pipeline velocity metric)
- Conversion Funnel
- Sales Velocity
```

### Phase 2: UI Terminology Updates

**Industry Context Provider**: `lib/contexts/IndustryContext.tsx`
- React Context that wraps dashboard and provides terminology to all child components
- `useIndustry()` hook for accessing terminology in any dashboard component
- Fallback to default if context not available

**Updated Files**:
1. **DashboardShell.tsx** - Wraps children in IndustryProvider
2. **Sidebar.tsx** - Uses terminology for nav labels (Deals→Bookings, Contacts→Clients, etc.)
3. **deals/page.tsx** - Uses terminology for header, button text, search placeholder
4. **contacts/page.tsx** - Uses terminology for header, button text, search placeholder
5. **tasks/page.tsx** - Uses terminology for header, button text, stats cards
6. **reports/page.tsx** - Uses terminology for header

### Signup Form Enhancement
**File**: `app/(auth)/signup/page.tsx`

Added:
- Industry type selector dropdown below company name field
- Displays 2 options: "Default (Sales)" and "Photographer"
- Shows description of selected industry type
- Passes industryType to auth signup and account setup

### Auth Setup API
**File**: `app/api/auth/setup/route.ts`

Updated to:
- Accept `industryType` parameter
- Store industry_type in orgs table during org creation
- Use industry-specific pipeline name (e.g., "Booking Flow" for photographers)
- Create industry-specific pipeline stages based on industryConfig

### Database Migration
**File**: `supabase/migrations/003_add_industry_type.sql`

Adds:
- `industry_type` column to orgs table
- Default value: 'default'
- Constraint to only allow 'default' or 'photographer' values

## Next Steps (Photographer Vertical)

### Phase 3: Booking Request System
- [ ] Create `booking_requests` table migration
- [ ] Build email approval flow with token-based validation (via Resend)
- [ ] Create public photographer portfolio page (separate repository)
- [ ] Implement booking form that submits to portfolio site

### Phase 4: Photographer-Specific Features
- [ ] Update reports to show photography metrics instead of sales metrics
- [ ] Create default task templates for photography workflow:
  - Send invoice
  - Client review session
  - Final edits
  - Send final files
- [ ] Customize automations for photographer workflows
- [ ] Add photo upload/gallery to deals (bookings)

### Phase 5: Public Portfolio Integration
- [ ] Create separate GitHub Pages or Vercel site for photographer portfolio
- [ ] Build booking form that integrates with Cadence
- [ ] Email approval workflow (photographer approves in Cadence, responds via email)
- [ ] Sync approved bookings back to portfolio

## Architecture Notes

### Industry Config Pattern
The `INDUSTRY_CONFIGS` object is extensible. To add a new vertical:

```typescript
// Add to INDUSTRY_CONFIGS in lib/industry-config.ts
newvertical: {
  id: 'newvertical',
  label: 'New Vertical',
  description: 'Description here',
  terminology: { /* terminology mappings */ },
  features: { /* feature flags */ },
  defaultPipelineStages: [ /* stages */ ],
}
```

Then add to `IndustryType` type:
```typescript
export type IndustryType = 'default' | 'photographer' | 'newvertical'
```

### Using Terminology in Components
Use the `useIndustry()` hook from `IndustryContext`:

```tsx
import { useIndustry } from '@/lib/contexts/IndustryContext'

function MyComponent() {
  const { terminology } = useIndustry()
  return <h1>{terminology.deals}</h1> // Shows "Bookings" for photographers
}
```

## Files Modified
- `app/(auth)/signup/page.tsx` - Added industry dropdown
- `app/api/auth/setup/route.ts` - Updated to handle industry type
- `app/(dashboard)/deals/page.tsx` - Uses terminology
- `app/(dashboard)/contacts/page.tsx` - Uses terminology
- `app/(dashboard)/tasks/page.tsx` - Uses terminology
- `app/(dashboard)/reports/page.tsx` - Uses terminology
- `components/dashboard/DashboardShell.tsx` - Added IndustryProvider
- `components/dashboard/Sidebar.tsx` - Uses terminology for nav labels

## Files Created
- `lib/industry-config.ts` - Core config system
- `lib/contexts/IndustryContext.tsx` - React context provider
- `supabase/migrations/003_add_industry_type.sql` - Database migration

## Build Status
✅ Build successful
✅ No TypeScript errors
✅ Ready for Phase 3 implementation
