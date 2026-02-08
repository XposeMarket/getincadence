# Elijah Media - Photographer Portfolio + Booking Integration

## Project Overview
A public photographer portfolio website for **Elijah Media** that allows:
1. **Clients** - Browse gallery styles (VHS, Night time, Day time), book photoshoots, check availability
2. **Photographer (Elijah)** - Manage gallery, set availability/off-days, manage bookings
3. **Integration** - Bookings sync directly to Cadence CRM as "Bookings" in "Inquiry" stage

---

## Part 1: Technology & Architecture

### Stack
- **Framework**: Next.js 14 (same as Cadence for consistency)
- **Styling**: Tailwind CSS (same as Cadence)
- **Database**: Supabase (shared with Cadence)
- **Storage**: Supabase Storage (for images)
- **Auth**: Supabase Auth (photographer login only)
- **Deployment**: Vercel (separate from main Cadence)

### Deployment Strategy
- **Option A**: Separate Next.js app on separate Vercel project ✅ CHOSEN
- **GitHub**: Separate repository for portfolio
- **Domain**: Own domain (TBD - e.g., `elijahmedia.com`)
- **Database**: Shared Supabase with Cadence (different schema)
- **No connection**: Completely separate from Cadence project UI

---

## Part 2: Database Schema

### New Tables Needed

#### 1. `photography_styles`
```sql
CREATE TABLE photography_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id),  -- Photographer's org (Elijah)
  name TEXT NOT NULL,  -- "VHS", "Night Time", "Day Time"
  slug TEXT NOT NULL,
  description TEXT,
  order_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INDEX: org_id, slug
UNIQUE: org_id + slug
```

#### 2. `gallery_photos`
```sql
CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id),
  style_id UUID NOT NULL REFERENCES photography_styles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,  -- Supabase Storage URL
  alt_text TEXT,
  order_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INDEX: org_id, style_id
```

#### 3. `photographer_calendar` (NEW - replaces booking_requests table)
```sql
CREATE TABLE photographer_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id),  -- Elijah's org
  
  date DATE NOT NULL,
  day_status TEXT NOT NULL,  -- 'available', 'booked', 'off', 'no_more_bookings'
  
  -- If booked or off, optional notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INDEX: org_id, date
UNIQUE: org_id + date
```

#### 4. `photographer_bookings` (Tracks which Cadence bookings are from portfolio)
```sql
CREATE TABLE photographer_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id),
  
  -- Link to Cadence deal
  deal_id UUID NOT NULL REFERENCES deals(id),
  
  -- Client Info
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  
  -- Booking Details
  booking_type TEXT NOT NULL,  -- 'personal' or 'event'
  event_type TEXT,  -- Only if booking_type = 'event'
  num_people INTEGER,  -- Only for events
  
  -- Date & Time
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  preferred_times TEXT[] DEFAULT ARRAY[]::TEXT[],  -- Backup preferences if needed
  
  -- Location
  location_type TEXT NOT NULL,  -- 'manual', 'flexible'
  location_manual TEXT,  -- If location_type = 'manual'
  
  -- Description
  special_requests TEXT,
  
  -- Status (mirrors Cadence stage but for quick access)
  status TEXT DEFAULT 'inquiry',  -- inquiry, confirmed, completed, paid, declined
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INDEX: org_id, booking_date, deal_id
```

These three tables replace the old `booking_requests` and `booking_request_approvals` tables.

---

## Part 3: File Structure

```
cadence/  (main app - unchanged)

elijahmedia-portfolio/  (NEW - separate Next.js project)
├── app/
│   ├── layout.tsx                    # Main layout with Elijah Media logo
│   ├── page.tsx                      # Home/gallery showcase
│   ├── gallery/
│   │   ├── page.tsx                  # Full gallery page
│   │   └── [styleSlug]/
│   │       └── page.tsx              # Full gallery for specific style (VHS/Night/Day)
│   ├── book/
│   │   └── page.tsx                  # Booking form page with calendar
│   ├── admin/
│   │   ├── layout.tsx                # Admin layout (requires auth)
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Admin dashboard with calendar
│   │   ├── gallery/
│   │   │   ├── page.tsx              # Manage styles & photos
│   │   │   └── [styleId]/
│   │   │       └── page.tsx          # Edit specific style
│   │   ├── calendar/
│   │   │   └── page.tsx              # Calendar management (set off days, availability)
│   │   ├── bookings/
│   │   │   └── page.tsx              # View all bookings from Cadence
│   │   └── login/
│   │       └── page.tsx              # Admin login
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts              # Supabase auth callback
│   └── api/
│   │   ├── bookings/
│   │   │   └── route.ts              # POST new booking (creates Cadence deal)
│   │   ├── calendar/
│   │   │   ├── route.ts              # GET available dates, POST set off days
│   │   │   └── check-availability/route.ts  # Check if date/time is available
│   │   ├── gallery/
│   │   │   ├── styles/route.ts       # GET/POST styles
│   │   │   └── photos/route.ts       # POST/DELETE photos
│   │   └── cadence/
│   │       └── sync-booking/route.ts # Internal: sync to Cadence
│   └── globals.css
│
├── components/
│   ├── shared/
│   │   ├── Header.tsx                # Elijah Media logo + nav
│   │   ├── GalleryShowcase.tsx       # 3-photo showcase for a style
│   │   └── BookingModal.tsx          # Photo view modal
│   ├── booking/
│   │   ├── BookingForm.tsx           # Full booking form
│   │   ├── DateTimeSelector.tsx      # Calendar picker + time selection (NEW)
│   │   ├── LocationSelector.tsx      # Manual vs flexible location
│   │   ├── BookingTypeSelector.tsx   # Personal vs event
│   │   └── AvailabilityChecker.tsx   # Shows conflicts + warnings (NEW)
│   ├── admin/
│   │   ├── CalendarManager.tsx       # Calendar view + set off-days (NEW)
│   │   ├── BookingsList.tsx          # List bookings from Cadence
│   │   ├── StyleManager.tsx          # Manage VHS/Night/Day styles
│   │   └── PhotoUploader.tsx         # Upload photos
│   └── gallery/
│       ├── StyleCard.tsx             # Single style card
│       ├── PhotoGrid.tsx             # Grid of photos
│       └── FullGallery.tsx           # Full gallery view
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── hooks/
│   │   ├── usePhotographerAuth.ts
│   │   ├── useGalleryStyles.ts
│   │   ├── usePhotos.ts
│   │   ├── useCalendar.ts            # Fetch calendar & availability (NEW)
│   │   └── useBookings.ts            # Fetch portfolio bookings
│   ├── calendar-utils.ts             # Availability logic (NEW)
│   ├── booking-validation.ts         # Max 2 shoots, 3-hour rule (NEW)
│   ├── gallery-queries.ts
│   ├── admin-queries.ts
│   └── cadence-sync.ts               # Sync bookings to Cadence
│
├── public/
│   ├── logo.png                      # Photographer's logo
│   └── placeholders/                 # Default images
│
├── package.json                      # Separate deps
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── .env.local                        # Supabase keys
```

---

## Part 4: Page & Component Details

### Home Page (`/`)
**Layout:**
- Hero section with logo (centered, prominent)
- "Book Now" CTA button
- Photography style showcases (grid of 3+ styles)
- Each style shows:
  - Style name (e.g., "Night Time Shoots")
  - 3 sample photos in modal preview
  - "View Gallery" button → opens `/gallery/[styleSlug]`
  - "View More" button (if > 3 photos) → full style gallery

**Components:**
- `Header.tsx` - Logo + navigation (Home, Book, Admin Link)
- `GalleryShowcase.tsx` - Single style with 3 photos + modal
- `BookingModal.tsx` - Modal to view photo in detail

---

### Booking Page (`/book`)
**Form Sections:**

1. **Client Info**
   - Name (required)
   - Email (required)
   - Phone (optional)

2. **Booking Type** (required)
   - Radio: Personal Shoot / Event
   - If Event: "How many people?" (number input)
   - If Personal: Hidden

3. **Date & Time Selection** (required - NEW CALENDAR FEATURE)
   - Interactive calendar showing:
     - ✅ Available dates (green)
     - ❌ Off-days/unavailable (red)
     - 🔴 Booked dates (orange)
   - Select date → shows available time slots
   - Photographer rule: Max 2 shoots per day, minimum 3 hours apart
   - Estimated shoot duration based on booking type
   - Shows conflict warning if user tries to book overlapping time
   - Example: If booked 10am-1pm, can't book 1pm-2pm (less than 3 hours)

4. **Location** (required)
   - Radio option 1: "I'll provide location" → text input
   - Radio option 2: "Let's figure it out together" → skip location input

5. **Special Requests** (optional)
   - Text area for descriptions, special needs, etc.

6. **Submit**
   - Validation: all required fields
   - Loading state during submission
   - Success: Creates Cadence deal directly in "Inquiry" stage
   - Error handling

**Components:**
- `BookingForm.tsx` - Main form wrapper
- `DateTimeSelector.tsx` - Calendar widget (replaces TimeSelector)
- `LocationSelector.tsx` - Manual vs flexible toggle
- `BookingTypeSelector.tsx` - Personal vs event with conditional num_people
- `AvailabilityChecker.tsx` - Shows conflicts, warnings, 3-hour rule

---

### Gallery Page (`/gallery`)
**Layout:**
- Grid of all photography styles (cards)
- Each card:
  - Style name
  - 3 preview photos
  - "View Full Gallery" button

**Components:**
- `StyleCard.tsx` - Single style card
- `PhotoGrid.tsx` - Grid layout

---

### Style Gallery Page (`/gallery/[styleSlug]`)
**Layout:**
- Style name as header
- Masonry/grid of all photos for that style
- Back button to main gallery

**Components:**
- `FullGallery.tsx` - All photos for one style

---

### Admin Login (`/admin/login`)
**Flow:**
- Email + password form
- Uses Supabase Auth (photographer's account in Cadence org)
- Redirects to `/admin/dashboard` on success
- Uses auth callback at `/admin-callback`

---

### Admin Dashboard (`/admin/dashboard`)
**Protected route** - requires auth

**Layout:**
- Sidebar with nav: Dashboard, Gallery Manager, Bookings
- Stats cards:
  - Total bookings this month
  - Pending approvals
  - Completed bookings

**Components:**
- Admin nav sidebar
- Stats cards

---

### Admin Gallery Manager (`/admin/gallery`)
**Protected route** - requires auth

**Layout:**
- Left: List of styles (with add new button)
- Right: Photo grid for selected style

**Features:**
- **Create Style**
  - Modal: name, description, slug
  - Saves to DB
  - New style appears in list

- **Edit Style**
  - Click style → shows edit panel
  - Change name, description, order
  - Delete style button (with confirmation)

- **Upload Photos**
  - Drag-drop zone or file picker
  - Preview before upload
  - Upload to Supabase Storage
  - Add to database
  - Reorder photos with drag-drop (update order_position)

**Components:**
- `StyleManager.tsx` - List + add/edit styles
- `PhotoUploader.tsx` - Drag-drop upload
- `GalleryPreview.tsx` - Preview how it looks on home page

---

### Admin Bookings (`/admin/bookings`)
**Protected route** - requires auth

**Layout:**
- List/table of all booking requests
- Filters: Status (Pending, Approved, Rejected, Completed)
- Sort by: Date, Name, Type

**Features:**
- Click booking → opens detail page
- Status badge showing current status
- Last updated time

**Components:**
- `BookingsList.tsx` - Table/list of bookings

---

### Admin Booking Detail (`/admin/bookings/[bookingId]`)
**Protected route** - requires auth

**Layout:**
- Booking details (read-only):
  - Client name, email, phone
  - Booking type (personal/event)
  - Number of people (if event)
  - Date, start/end time
  - Location
  - Special requests
  - Submission date

- View in Cadence button:
  - Opens Cadence deal directly (link to `/deals/[dealId]` in Cadence)
  - Photographer manages stage progression there

**No approval buttons here** - booking already created in Cadence "Inquiry" stage

**Components:**
- `BookingDetailCard.tsx` - Display booking + link to Cadence

---

## Part 5: Integration with Cadence

### Booking Sync Flow (WITH EMAIL APPROVAL)

1. **Client submits booking form**
   - Selects date/time from calendar
   - System validates: date available, not overbooked, not off-day
   - Calculates start/end times based on booking type
   - Checks 3-hour spacing rule between existing bookings
   - If valid → submits form → API call: `POST /api/bookings`

2. **Portfolio API creates Cadence deal + sends approval email**
   ```
   POST /api/bookings
   - Input: client_name, email, phone, booking_type, date, start_time, 
            end_time, location, special_requests
   - Creates: deal in Cadence with:
     • Title: "{client_name}'s {booking_type} shoot"
     • Contact: Created from client info
     • Stage: "Inquiry" (photographer industry) ← CREATED HERE
     • Value: Default amount (can be manually adjusted)
     • Notes: special_requests + booking details
     • Custom field: portfolio_booking_id
   - Creates: photographer_bookings record with approval_token
   - Updates: photographer_calendar (TENTATIVE - not final)
   - Sends: approval email to photographer with approve/deny buttons
   - Returns: { success, dealId, bookingId }
   ```

3. **Photographer receives email with one-click approve/deny**
   - Email contains:
     • Booking summary (client, type, date/time, location, requests)
     • ✅ **APPROVE** button → `/api/bookings/approve?token=[token]`
     • ❌ **DENY** button → `/api/bookings/deny?token=[token]`
   - Approval/denial is one-click from email (no login needed)

4. **Photographer approves** → Deal stays in "Inquiry"
   - Approval token is validated
   - Deal remains in "Inquiry" stage
   - photographer_calendar is finalized (date/time locked)
   - Client receives confirmation email: "Your booking has been approved!"
   - Photographer manages through Cadence: Inquiry → Booked → Shoot Complete → Editing → Delivered → Paid

5. **Photographer denies** → Deal moves to "Declined"
   - Denial token is validated
   - Deal automatically moves to "Declined" stage
   - photographer_calendar removes the tentative booking
   - Client receives cancellation email with optional reason message

### Data Sync Direction
- **Portfolio → Cadence**: Booking request → creates deal directly in "Inquiry"
- **Cadence → Portfolio**: Stage updates optional (photographer manages in Cadence primary)
- **No email approval needed**: Direct integration saves time

### Calendar Overbooking Prevention
**Business Rules:**
- Max 2 shoots per day
- Minimum 3 hours between bookings
- Photographer can set days as "off" (completely unavailable)
- Photographer can set days as "no_more_bookings" (day open but no new shoots)

**Validation Logic:**
```
When booking submitted:
1. Check if date is in photographer_calendar as "off" → reject
2. Check if date is in photographer_calendar as "no_more_bookings" 
   AND already has bookings → reject
3. Query photographer_bookings for same date
4. Count shoots: if >= 2 → reject
5. For each existing booking on that date:
   - If proposed_start < existing_end AND proposed_end > existing_start → overlap error
   - If existing_end + 3_hours > proposed_start → too close error
6. If all checks pass → create booking
```

---

## Part 6: API Routes Overview

### Client: Booking Submission
```
POST /api/bookings
- Body: { 
    client_name, 
    client_email, 
    client_phone,
    booking_type,  // 'personal' | 'event'
    num_people,    // if event
    booking_date,  // ISO date
    start_time,    // "14:30"
    end_time,      // "17:30"
    location_type, // 'provided' | 'flexible'
    location_manual,
    special_requests
  }
- Response: { success, dealId, bookingId }
- Side effects: 
  1. Creates deal in Cadence "Inquiry" stage
  2. Creates photographer_bookings record with approval_token
  3. Marks photographer_calendar as TENTATIVE (pending approval)
  4. Sends approval email to photographer with approve/deny buttons
```

### Photographer: Approve Booking (from email)
```
GET /api/bookings/approve?token=[approval_token]
- Query: approval_token (from email link)
- Validates token & expiration (7 days)
- If valid:
  • Sets photographer_bookings.approval_status = 'approved'
  • Keeps deal in "Inquiry" stage
  • Finalizes photographer_calendar (marks date/time as confirmed booked)
  • Sends confirmation email to client
  • Sends confirmation email to photographer
- Response: { success, message } OR error page if invalid/expired
- No auth required (token-based)
```

### Photographer: Deny Booking (from email)
```
GET /api/bookings/deny?token=[approval_token]
- Query: approval_token (from email link)
- Validates token & expiration (7 days)
- If valid:
  • Sets photographer_bookings.approval_status = 'denied'
  • Moves deal to "Declined" stage
  • Removes booking from photographer_calendar (date/time available again)
  • Sends denial email to client with optional reason
  • Sends confirmation email to photographer
- Response: { success, message } OR error page if invalid/expired
- No auth required (token-based)
```

### Client: Check Availability
```
GET /api/bookings/check-availability?date=2024-01-15&startTime=14:30&duration=3
- Query: date, startTime, duration (in hours)
- Response: { available: boolean, conflicts: [], reason: string? }
- Validates: off-days, bookings, 2-shoots-per-day, 3-hour spacing
```

### Admin: Fetch Calendar & Availability
```
GET /api/calendar?month=2024-01
- Headers: auth token
- Response: { dates: { "2024-01-15": "booked", "2024-01-16": "off", ... } }
```

### Admin: Set Off-Day or No-More-Bookings
```
POST /api/calendar/set-availability
- Headers: auth token
- Body: { date, status } // 'available' | 'off' | 'no_more_bookings'
- Response: { success, updated: date }
```

### Admin: View Bookings (from Portfolio)
```
GET /api/bookings?status=all
- Headers: auth token
- Response: photographer_bookings[] (synced from Cadence)
```

### Admin: Gallery Styles
```
GET /api/gallery/styles - Fetch all styles
POST /api/gallery/styles - Create style (admin only)
PATCH /api/gallery/styles/[styleId] - Update style (admin only)
DELETE /api/gallery/styles/[styleId] - Delete style (admin only)
```

### Admin: Photos
```
POST /api/gallery/photos - Upload photo (admin only)
DELETE /api/gallery/photos/[photoId] - Delete photo (admin only)
PATCH /api/gallery/photos/[photoId] - Update order (admin only)
```

### Internal: Sync with Cadence (OPTIONAL)
```
POST /api/cadence/sync-booking
- Headers: internal auth (service key)
- Body: { bookingId }
- Creates deal in Cadence (called from POST /api/bookings)
- Returns: { dealId, success }
```

---

## Part 7: Authentication

### Photographer Admin Auth
- Uses Supabase Auth (same as Cadence)
- Photographer signs in with credentials
- Gets JWT token
- Protected routes check token

### Session Management
- JWT stored in httpOnly cookie
- Middleware checks auth on admin routes
- Redirect to `/admin/login` if unauthorized

---

## Part 8: Email Workflow (WITH APPROVAL)

### Email 1: Booking Confirmation (to Client)
**Trigger**: Client successfully submits booking form
**To**: Client email
**Content**: 
- "Your booking request has been received!"
- Booking summary: type, date, time, location, special requests
- "We're reviewing your request and will confirm shortly."
- Optional: booking confirmation number

### Email 2: Approval Request (to Photographer)
**Trigger**: Client submits booking form successfully
**To**: Photographer email
**Content**: 
- "New booking request received!"
- Full booking details: client name/email/phone, type, date, time, location, special requests
- ✅ **APPROVE** button/link: `https://portfolio.com/api/bookings/approve?token=[token]`
- ❌ **DENY** button/link: `https://portfolio.com/api/bookings/deny?token=[token]`
- "Click above to approve or deny. Links expire in 7 days."
- **Key**: One-click approve/deny - no login needed, instant action

### Email 3: Approval Confirmation (to Client)
**Trigger**: Photographer clicks APPROVE button
**To**: Client email
**Content**:
- "Your booking has been approved!"
- Confirmed date/time
- Next steps: "The photographer will be in touch before your shoot date."

### Email 4: Denial Notification (to Client)
**Trigger**: Photographer clicks DENY button
**To**: Client email
**Content**:
- "Unfortunately, we cannot accommodate your booking request."
- Optional: reason from photographer
- Suggested alternative dates (if available)
- Contact info for photographer

### Email 5: Approval Confirmation (to Photographer)
**Trigger**: Photographer clicks APPROVE button
**To**: Photographer email
**Content**:
- "Booking approved!"
- Client contact info
- Booking summary
- Link to view in Cadence CRM

### Email 6: Denial Confirmation (to Photographer)
**Trigger**: Photographer clicks DENY button
**To**: Photographer email
**Content**:
- "Booking denied and marked as declined."
- Reason (if entered)
- Client name, email, phone
- Booking details
- "Booking added to Cadence CRM"
- Link to Cadence booking

---

## Part 9: User Flows

### Client Flow
1. Visit home page → see gallery styles with sample photos
2. Click "View Full Gallery" on a style → see all photos for that style
3. Click "Book Now" → go to `/book`
4. Interactive calendar shows available dates (green), off-days (red), booked dates (orange)
5. Select date → shows available time slots with overbooking validation
6. Fill remaining form fields (booking type, location, special requests)
7. Submit form
8. **Booking created in Cadence "Inquiry" stage**
9. **Tentative calendar entry** (date/time locked pending approval)
10. Receive confirmation email with booking summary
11. Wait for photographer to approve/deny via email
12. On approval: calendar finalized, can see booking in Cadence
13. On denial: date/time freed up, receive cancellation email

### Photographer Flow
1. **Receives email** when client submits booking
2. **One-click approve/deny** from email buttons:
   - Click APPROVE → deal stays in "Inquiry", calendar locked
   - Click DENY → deal moves to "Declined", date/time freed up
3. **Admin login** (optional - for viewing/reporting):
   - Log in to `/admin/login` with email/password
4. Dashboard shows:
   - Total bookings this month
   - Calendar with booked/off-days
   - Pending/approved/denied bookings with status
5. Go to Calendar Manager → set off-days or "no more bookings" dates
6. Go to Gallery Manager → add/edit styles, upload photos
7. Go to Bookings → see all portfolio bookings with approval status
8. For each approved booking: view details and link to Cadence deal
9. Manage booking progression in Cadence CRM (Inquiry → Booked → Shoot Complete → Editing → Delivered → Paid)

---

## Part 10: Database Migrations Needed

**File**: `supabase/migrations/006_elijahmedia_portfolio.sql`

```sql
-- Photography Styles (Initial: VHS, Night time, Day time)
CREATE TABLE photography_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

-- Gallery Photos
CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  style_id UUID NOT NULL REFERENCES photography_styles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photographer Calendar (Availability tracking)
CREATE TABLE photographer_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_status TEXT NOT NULL DEFAULT 'available',
  -- Allowed: 'available' | 'off' | 'no_more_bookings'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, date)
);

-- Photographer Bookings (Synced from portfolio submissions)
CREATE TABLE photographer_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  booking_type TEXT NOT NULL,
  num_people INTEGER,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_type TEXT NOT NULL,
  location_manual TEXT,
  special_requests TEXT,
  status TEXT DEFAULT 'inquiry',
  approval_token TEXT UNIQUE,  -- One-time use token for approve/deny
  approval_status TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'denied'
  approval_expires_at TIMESTAMP WITH TIME ZONE,  -- 7 days from creation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, booking_date, start_time, end_time)
);

-- Indexes for performance
CREATE INDEX idx_photography_styles_org_id ON photography_styles(org_id);
CREATE INDEX idx_photography_styles_slug ON photography_styles(slug);
CREATE INDEX idx_gallery_photos_style_id ON gallery_photos(style_id);
CREATE INDEX idx_gallery_photos_org_id ON gallery_photos(org_id);
CREATE INDEX idx_photographer_calendar_org_id ON photographer_calendar(org_id);
CREATE INDEX idx_photographer_calendar_date ON photographer_calendar(date);
CREATE INDEX idx_photographer_bookings_org_id ON photographer_bookings(org_id);
CREATE INDEX idx_photographer_bookings_deal_id ON photographer_bookings(deal_id);
CREATE INDEX idx_photographer_bookings_date ON photographer_bookings(booking_date);

-- Initial styles for Elijah Media (org_id will be set when user creates portfolio)
-- These should be inserted after org is created with a script or admin panel
```

---

## Part 11: Implementation Phases

### Phase 1: Foundation & Booking Calendar (Days 1-3)
- [ ] Create new Next.js 14 portfolio project
- [ ] Setup GitHub repository & Vercel deployment
- [ ] Create database migration with 4 tables
- [ ] Layout with Elijah Media logo placeholder
- [ ] Create 3 initial styles: VHS, Night time, Day time
- [ ] Booking form with all fields
- [ ] DateTimeSelector with interactive calendar
- [ ] Availability checker (2-shoots/day, 3-hour rule)
- [ ] Form submission → creates Cadence deal in "Inquiry" + generates approval_token
- [ ] Tentative photographer_calendar entry (pending approval)
- [ ] Client confirmation email
- [ ] Photographer approval email with approve/deny buttons

### Phase 2: Gallery Management (Days 3-4)
- [ ] Photography styles CRUD (admin)
- [ ] Photo upload to Supabase Storage
- [ ] Gallery showcase on home page (3 photos per style)
- [ ] Full gallery page for each style
- [ ] Photo ordering/management
- [ ] Mobile-responsive gallery

### Phase 3: Admin Dashboard & Calendar (Days 4-5)
- [ ] Admin login/auth with Supabase
- [ ] Admin dashboard with stats
- [ ] Calendar management page (set off-days)
- [ ] Bookings list with approval status (pending/approved/denied)
- [ ] Booking detail view + link to Cadence deal
- [ ] Email token endpoints: `/api/bookings/approve?token=X` and `/api/bookings/deny?token=X`
- [ ] Approval/denial auto-moves deal to correct stage
- [ ] Finalize/release calendar slots on approve/deny
- [ ] Responsive design

### Phase 4: Polish & Launch (Day 5-6)
- [ ] Logo asset integration (when provided)
- [ ] Performance optimization
- [ ] SEO basics
- [ ] Testing (booking → Cadence deal)
- [ ] Deploy to Vercel
- [ ] Setup custom domain (when ready)

---

## Part 12: Key Features Summary

### For Clients
- ✅ Browse gallery (3 styles: VHS, Night time, Day time)
- ✅ Interactive calendar showing availability
- ✅ Book shoot with date/time picker
- ✅ Prevent double-booking (max 2/day, 3-hour spacing)
- ✅ Booking confirmation email
- ✅ No approval workflow needed

### For Photographer
- 🔐 Admin login with password
- 🔐 Dashboard with stats and calendar
- 🔐 Set off-days and "no more bookings" dates
- 🔐 Manage gallery styles and photos
- 🔐 View all portfolio bookings
- 🔐 Link to Cadence deals for management
- 🔄 Calendar updates prevent overbooking in real-time

### Integration with Cadence
- 🔄 Booking form → creates deal directly in "Inquiry" stage
- 🔄 No email approval workflow
- 🔄 Photographer manages through Cadence (source of truth)
- 🔄 Optional: sync stage updates back to portfolio

---

## Notes

- **Logo**: Placeholder until photographer provides asset
- **Brand**: "Elijah Media" throughout
- **Email**: Resend for transactional emails
- **Storage**: Supabase Storage bucket `elijahmedia-photos`
- **Calendar**: Real-time availability checking to prevent overbooking
- **Database**: Shared with Cadence but separate tables
- **Separation**: Portfolio site completely separate from Cadence UI

---

## Success Criteria

1. ✅ Client can browse gallery with 3 styles
2. ✅ Client can select available date/time from calendar
3. ✅ Overbooking prevention works (max 2/day, 3-hour spacing)
4. ✅ Booking form creates Cadence deal in "Inquiry" stage
5. ✅ Confirmation email sent to client
6. ✅ Photographer can log in to admin
7. ✅ Photographer can set off-days on calendar
8. ✅ Photographer can manage gallery (styles & photos)
9. ✅ Photographer sees bookings linked to Cadence deals
10. ✅ Responsive design (mobile & desktop)
11. ✅ Deployed to Vercel with own domain
