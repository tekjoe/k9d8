# Admin Panel Plan: admin.k9d8.com

## Context

The k9d8 app has no admin tooling. Reports (message, photo, review) sit in the database with no way to review or act on them. There's no visibility into user growth, check-in activity, or content moderation status. This plan creates a Next.js admin panel at `admin.k9d8.com` to manage users, dogs, reports, and view analytics.

---

## Monorepo vs Separate Repo: Separate Repo

**Recommendation: Create a new standalone repo (`k9d8-admin`).**

The shared code surface is tiny — just `src/types/database.ts` (pure TS interfaces, no RN dependencies). None of the existing service functions are reusable because they all import from a React Native-specific Supabase client. The admin needs a `service_role` key server-side client, so every query is written fresh anyway.

Converting the Expo app to a monorepo (turborepo + pnpm workspaces) would require restructuring the entire project, reconfiguring Vercel, EAS builds, and risking breakage — all to share one types file. For a solo developer, a simple `cp` command or sync script is far less friction.

**Type sync strategy:** Copy `database.ts` into the admin repo. Run a script after new migrations:
```bash
# scripts/sync-types.sh
cp ../k9d8/src/types/database.ts src/types/database.ts
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Data tables | TanStack Table (via shadcn DataTable) |
| Charts | Recharts (via shadcn Charts) |
| Auth | Supabase Auth + middleware admin allowlist |
| Supabase client | `@supabase/ssr` + server-side `service_role` |
| Deployment | Vercel (separate project → `admin.k9d8.com`) |

---

## Supabase Access Pattern

**Server-side `service_role` client** (bypasses RLS, never exposed to browser):

```typescript
// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // no NEXT_PUBLIC_ prefix
);
```

All data fetching happens in Server Components and Server Actions. The anon key is only used for the login flow.

---

## Admin Auth

Supabase Auth login + env var allowlist:

1. Admin logs in with their existing k9d8 account (email/password)
2. Next.js middleware checks the session and verifies `user.id` is in `ADMIN_USER_IDS`
3. Unauthorized users see a "not authorized" page

```env
ADMIN_USER_IDS=your-uuid-here
```

---

## Pages

```
/login                    — Email/password login
/unauthorized             — Access denied page
/                         — Dashboard (summary cards + mini charts)
/users                    — User list (search, pagination)
/users/[id]               — User detail (profile, dogs, activity, reports, ban/disable)
/dogs                     — Dog list (search, filter by owner)
/dogs/[id]                — Dog detail (photos, owner link)
/reports                  — Moderation queue (tabbed: messages, photos, reviews)
/reports/[type]/[id]      — Report detail + action buttons
/analytics                — Charts (user growth, check-ins, playdates, parks, reports)
```

### Dashboard (`/`)
- Cards: total users, active check-ins today, pending reports, total dogs
- Mini charts: signups last 30 days, report volume last 30 days

### Users (`/users` + `/users/[id]`)
- DataTable: display_name, email, created_at, dog count, report count
- Search by name/email
- Detail page: profile, dogs owned, recent check-ins/playdates, reports against their content
- Actions: disable/ban user (via `supabaseAdmin.auth.admin.updateUserById`), delete account

### Reports (`/reports`)
- Tabs: Message Reports, Photo Reports, Review Reports
- DataTable: reporter, content preview, reason, status, created_at
- Filter by status (pending/reviewed/dismissed/actioned)
- Detail page: full content, reporter info, action buttons (dismiss, delete content, ban user)
- Server Actions to update report status and take moderation action

### Analytics (`/analytics`)
- User growth (line chart, cumulative + daily signups)
- Check-in activity (daily)
- Playdate creation rate
- Popular parks (bar chart)
- Report volume by type/status

---

## File Structure

```
k9d8-admin/
  src/
    app/
      layout.tsx
      page.tsx                  — Dashboard
      login/page.tsx
      unauthorized/page.tsx
      users/page.tsx
      users/[id]/page.tsx
      dogs/page.tsx
      dogs/[id]/page.tsx
      reports/page.tsx
      reports/[type]/[id]/page.tsx
      analytics/page.tsx
    components/
      sidebar.tsx
      data-table.tsx
      stats-card.tsx
      report-actions.tsx
      user-actions.tsx
    lib/
      supabase-admin.ts
      supabase-auth.ts
    actions/
      users.ts
      reports.ts
      analytics.ts
    types/
      database.ts               — Copied from main repo
  middleware.ts
  scripts/
    sync-types.sh
```

---

## Phased Implementation

### Phase 1: Project Setup & Auth
- `npx create-next-app@latest k9d8-admin` (App Router, Tailwind, TypeScript)
- Install: `@supabase/supabase-js`, `@supabase/ssr`, shadcn/ui
- Copy `database.ts` from main repo
- Set up `lib/supabase-admin.ts` and `lib/supabase-auth.ts`
- Build login page, middleware with admin allowlist
- Create sidebar layout (nav links, user info, logout)
- Deploy to Vercel, configure `admin.k9d8.com` DNS

### Phase 2: Users & Dogs
- Add shadcn DataTable component
- Build `/users` with server-side search + pagination
- Build `/users/[id]` detail with dogs, activity, reports
- Add user actions (disable/ban via Supabase Auth admin API)
- Build `/dogs` and `/dogs/[id]` pages

### Phase 3: Moderation Queue
- Build `/reports` with tabs for each report type
- Join report tables with reporter profiles and reported content
- Build report detail page with action buttons
- Server Actions: update status, delete content, ban user
- Add pending report count badge to sidebar

### Phase 4: Analytics
- Install Recharts
- Build aggregate queries (signups by day, check-ins by day, popular parks)
- Build chart components and analytics page
- Build dashboard with summary cards + mini charts

### Phase 5: Polish
- Loading states (Suspense + skeletons)
- Confirmation dialogs for destructive actions
- Toast notifications
- Responsive sidebar
- Optional: audit log table for admin actions

---

## Verification

1. Login with admin credentials → see dashboard
2. Login with non-admin account → see unauthorized page
3. Navigate to /users → see paginated user list, search works
4. View user detail → see dogs, activity, reports
5. Navigate to /reports → see pending reports across all types
6. Take action on a report → status updates, content deleted if applicable
7. View /analytics → charts render with real data
8. Test on mobile viewport → sidebar collapses, tables scroll

---

## Key Reference Files (main repo)

- `/Users/tekjoe/Dev/k9d8/src/types/database.ts` — Types to copy
- `/Users/tekjoe/Dev/k9d8/src/lib/supabase.ts` — Client setup reference
- `/Users/tekjoe/Dev/k9d8/src/services/reports.ts` — Report operations pattern
- `/Users/tekjoe/Dev/k9d8/supabase/migrations/` — Table schemas
- `/Users/tekjoe/Dev/k9d8/vercel.json` — Existing deployment config (admin is separate)
