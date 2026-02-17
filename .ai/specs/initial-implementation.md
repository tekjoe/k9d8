# k9d8 Implementation Plan

## Context

k9d8 is a new cross-platform app (iOS, Android, web) for dog owners to find dog parks, check in with their dogs, and schedule play dates. This plan covers full project scaffolding through MVP.

## Tech Stack

- **Framework**: React Native + Expo (managed workflow)
- **Routing**: Expo Router (file-based)
- **Backend**: Supabase (Postgres, Auth, Realtime, Storage)
- **Maps**: @rnmapbox/maps (native) + react-map-gl (web)
- **Language**: TypeScript
- **Forms**: react-hook-form + zod
- **Dates**: date-fns

## Phase 1: Project Setup + Auth

### 1a. Scaffold and install dependencies

```bash
npx create-expo-app@latest k9d8 --template default
cd /Users/tekjoe/Dev/k9d8

# Supabase + auth storage
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-secure-store
npm install aes-js && npm install -D @types/aes-js

# Maps
npx expo install @rnmapbox/maps
npm install react-map-gl mapbox-gl && npm install -D @types/mapbox-gl

# Utilities
npx expo install expo-location expo-image-picker expo-image @react-native-community/datetimepicker
npm install react-hook-form zod @hookform/resolvers date-fns
```

Add `@rnmapbox/maps` config plugin to `app.json`.

### 1b. Create `.env`

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_MAPBOX_TOKEN=...
```

### 1c. Build core infrastructure

- `src/lib/storage.ts` — LargeSecureStore adapter (AES-256 key in SecureStore, encrypted session in AsyncStorage)
- `src/lib/supabase.ts` — Supabase client with typed `Database` generic
- `src/providers/AuthProvider.tsx` — React context: session management, `onAuthStateChange` listener
- `src/services/auth.ts` — `signInWithEmail`, `signUpWithEmail`, `signOut`
- `src/hooks/useAuth.ts` — Reads from AuthProvider context

### 1d. Set up Expo Router structure

```
app/
  _layout.tsx              # Root: wraps in AuthProvider
  index.tsx                # Redirects based on auth state
  (auth)/
    _layout.tsx            # Stack
    sign-in.tsx
    sign-up.tsx
  (tabs)/
    _layout.tsx            # Bottom tabs: Map, Play Dates, Profile
    index.tsx              # Map (placeholder)
    playdates/index.tsx    # Placeholder
    profile/index.tsx      # User info + sign out
```

### 1e. Supabase setup

- Create `profiles` table with RLS
- Add trigger on `auth.users` insert to auto-create profile

**Deliverable**: App boots, sign up/in/out works, auth-gated tab shell.

---

## Phase 2: Dog Profiles (CRUD)

- Create `dogs` table with enums (`dog_size`, `dog_temperament`), RLS policies
- Create `dog-photos` storage bucket (public read, authenticated upload)
- `src/services/dogs.ts` — CRUD + photo upload
- `src/hooks/useDogs.ts` — Wraps service with React state
- `src/components/dogs/` — `DogCard`, `DogForm` (react-hook-form + zod), `DogSizeTag`
- Screens: `profile/index.tsx` (dog list), `profile/dogs/create.tsx`, `profile/dogs/[id].tsx`
- Soft delete via `is_active` boolean

**Deliverable**: Users manage dogs with photos on their profile.

---

## Phase 3: Map + Parks

- Create `parks` table, seed with 10-20 sample parks
- `src/services/parks.ts` — `getParksNearby` (bounding-box query, no PostGIS needed for MVP)
- `src/hooks/useParks.ts`, `src/hooks/useLocation.ts` (expo-location wrapper)
- Platform-specific map components:
  - `src/components/parks/ParkMap.native.tsx` — @rnmapbox/maps
  - `src/components/parks/ParkMap.web.tsx` — react-map-gl
  - Import without extension; Metro/Webpack resolves automatically
- `src/components/parks/ParkCard.tsx` — Name, amenities, distance
- Screens: `(tabs)/index.tsx` (full-screen map), `parks/[id].tsx` (park detail)

**Deliverable**: Map with park pins, tappable to see park detail.

---

## Phase 4: Check-ins

- Create `check_ins` + `check_in_dogs` tables with RLS
- `src/services/checkins.ts` — check in/out, get active check-ins
- `src/hooks/useCheckIn.ts` — Supabase Realtime subscription on `check_ins` for live updates
- `src/components/parks/CheckInList.tsx` — Shows who's at a park with their dogs
- Update `parks/[id].tsx` — "Check In" button (select dogs), "Check Out", live attendance list

**Deliverable**: Live check-in/out at parks.

---

## Phase 5: Play Date Scheduling

- Create `play_dates` + `play_date_rsvps` tables with enums and RLS
- `src/services/playdates.ts` — CRUD + RSVP management
- `src/hooks/usePlaydates.ts`
- `src/components/playdates/` — `PlaydateCard`, `PlaydateForm`
- Screens: `playdates/index.tsx` (my dates + upcoming), `playdates/create.tsx`, `playdates/[id].tsx` (detail + RSVP)
- Update `parks/[id].tsx` — show upcoming play dates, "Schedule Play Date" button

**Deliverable**: Full play date flow — create, browse, RSVP, cancel. MVP complete.

---

## Project Structure

```
app/                    # Expo Router screens (thin, compose from src/components)
src/
  components/           # Reusable UI, organized by domain (ui/, dogs/, parks/, playdates/)
  hooks/                # Custom hooks wrapping services with React state
  services/             # Pure async functions calling Supabase (no React)
  providers/            # React context providers
  lib/                  # Library init (supabase client, storage adapter)
  types/                # TypeScript types (database.ts = Supabase generated)
  constants/            # Colors, config values
supabase/migrations/    # SQL migration files
```

**Key pattern**: Services (pure functions) → Hooks (React state) → Components (UI). Screens in `app/` stay thin.

## Database Schema (7 tables)

```
profiles 1───* dogs
profiles 1───* check_ins
profiles 1───* play_dates (as organizer)
parks    1───* check_ins
parks    1───* play_dates
check_ins 1───* check_in_dogs *───1 dogs
play_dates 1───* play_date_rsvps *───1 dogs
```

All tables have RLS enabled. `profiles` auto-created via trigger.

## Verification

After each phase:
1. `npx expo start --web` — verify web works
2. `npx expo run:ios` — verify iOS works (required for maps in Phase 3+)
3. Test auth flow end-to-end (sign up → sign in → navigate → sign out)
4. Verify Supabase RLS by checking that users can only modify their own data
5. After Phase 4: verify Realtime updates by opening two browser tabs and checking in/out

## CLAUDE.md

Created alongside Phase 1 scaffolding, documenting commands, architecture, conventions, and database schema.

---

*Created: February 2026*
*Status: Completed*
