# Test Coverage Plan: 100% Coverage for k9d8

## Context

The k9d8 codebase (Expo Router + React Native + Supabase) has virtually no test infrastructure. There is 1 existing test file (`__tests__/utils/playdates.test.ts`) with broken imports. No Jest config, no test scripts, no mocking utilities, and no testing libraries are installed. This plan establishes a testing foundation and systematically covers the entire `src/` directory (~120 service functions, 21 hooks, 20 utility functions, 31 components) across 6 phases.

---

## Phase 0: Foundation

**Goal:** Get one test running end-to-end before writing any new tests.

### 0.1 Install Dependencies

```
npx expo install jest-expo jest @types/jest
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

### 0.2 Create Jest Config

**File:** `jest.config.ts`

- Use `jest-expo` preset (handles RN transforms, platform resolution)
- Map `@/*` paths via `moduleNameMapper`
- Configure `transformIgnorePatterns` for Expo/RN ecosystem packages
- Set `collectCoverageFrom` targeting `src/**/*.{ts,tsx}` excluding `src/types/`
- Set initial coverage thresholds at 80% (raise to 90%+ after Phase 4)

### 0.3 Create Setup File

**File:** `jest.setup.ts`

- Import `@testing-library/jest-native/extend-expect` for extended matchers

### 0.4 Add Scripts to `package.json`

```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

### 0.5 Fix Existing Test

**File:** `__tests__/utils/playdates.test.ts`

Fix all 10 import names — the test uses PascalCase `PlayDate` but the source exports camelCase `Playdate`:
- `isPlayDateExpired` → `isPlaydateExpired`
- `isPlayDateActive` → `isPlaydateActive`
- `canRSVPToPlayDate` → `canRSVPToPlaydate`
- `canEditPlayDate` → `canEditPlaydate`
- `getPlayDateStatus` → `getPlaydateStatus`
- `formatPlayDateTime` → `formatPlaydateTime`
- `isPastPlayDate` → `isPastPlaydate`
- `isUpcomingPlayDate` → `isUpcomingPlaydate`
- `sortPlayDatesByTime` → `sortPlaydatesByTime`
- `filterPlayDatesByTime` → `filterPlaydatesByTime`

### 0.6 Create Supabase Mock

**File:** `src/lib/__mocks__/supabase.ts`

This is the keystone mock — every service imports from `../lib/supabase`. The mock provides:
- `supabase.from()` returning a chainable query builder (select/insert/update/delete/eq/single/etc.)
- `supabase.auth.*` (getUser, signIn, signUp, signOut, onAuthStateChange, etc.)
- `supabase.storage.from()` (upload, getPublicUrl, remove)
- `supabase.functions.invoke()`
- `supabase.channel()` / `supabase.removeChannel()` for real-time

### 0.7 Create Shared Test Helper

**File:** `__tests__/helpers/supabaseMock.ts`

A `mockSupabaseQuery(data, error)` helper that configures `supabase.from()` to return a chainable mock resolving to `{ data, error }`. Reused across all service tests.

### Verification

Run `npm test -- --testPathPattern=playdates` — the existing test should pass, validating the entire toolchain.

---

## Phase 1: Pure Utility Functions (~73 tests, ~20 functions)

**Goal:** Cover all code with zero external dependencies. Highest ROI, no mocking.

| Test File | Source File | Functions | Est. Cases |
|-----------|-----------|-----------|------------|
| `__tests__/utils/slug.test.ts` | `src/utils/slug.ts` | 7 (generateParkSlug, generateParkSlugWithState, extractSlugFromUrl, extractShortIdFromSlug, isValidUUID, parseSlugOrId, findParkIdFromSlug) | ~25 |
| `__tests__/utils/playdates.test.ts` | `src/utils/playdates.ts` | 10 (already written, just fix imports) | ~31 |
| `__tests__/services/wordFilter.test.ts` | `src/services/wordFilter.ts` | 1 (filterMessage) | ~8 |
| `__tests__/services/parks.pure.test.ts` | `src/services/parks.ts` | 4 pure functions (boundingBoxFromCenter, stateAbbrevToName, stateNameToAbbrev, getParkStateSlug) | ~15 |

---

## Phase 2: Service Layer (~251 tests, ~105 functions)

**Goal:** Cover all Supabase-dependent service functions. This is the core business logic.

Each test file mocks `src/lib/supabase` and uses the shared `mockSupabaseQuery` helper. Tests verify:
- Happy path (data returned correctly)
- Error handling (Supabase errors propagated/thrown)
- Edge cases (empty results, null fields, auth guards)

| Test File | Source File | Functions | Est. Cases |
|-----------|-----------|-----------|------------|
| `__tests__/services/blocks.test.ts` | `src/services/blocks.ts` | 4 | ~14 |
| `__tests__/services/reports.test.ts` | `src/services/reports.ts` | 1 | ~5 |
| `__tests__/services/checkins.test.ts` | `src/services/checkins.ts` | 6 | ~20 |
| `__tests__/services/parks.test.ts` | `src/services/parks.ts` | 13 async functions | ~35 |
| `__tests__/services/messages.test.ts` | `src/services/messages.ts` | 5 | ~18 |
| `__tests__/services/friends.test.ts` | `src/services/friends.ts` | 10 | ~25 |
| `__tests__/services/dogs.test.ts` | `src/services/dogs.ts` | 7 | ~18 |
| `__tests__/services/playdates.test.ts` | `src/services/playdates.ts` | 13 | ~30 |
| `__tests__/services/auth.test.ts` | `src/services/auth.ts` | 9 | ~25 |
| `__tests__/services/notifications.test.ts` | `src/services/notifications.ts` | 9 | ~22 |
| `__tests__/services/parkReviews.test.ts` | `src/services/parkReviews.ts` | 6 | ~15 |
| `__tests__/services/parkPhotos.test.ts` | `src/services/parkPhotos.ts` | 7 | ~18 |
| `__tests__/services/moderation.test.ts` | `src/services/moderation.ts` | 10 (native stubs) | ~6 |

**Additional mocks for auth.test.ts:** expo-apple-authentication, expo-crypto, expo-auth-session, expo-web-browser, Platform.OS

---

## Phase 3: Lib Layer (~16 tests)

| Test File | Source File | Functions | Est. Cases |
|-----------|-----------|-----------|------------|
| `__tests__/lib/storage.test.ts` | `src/lib/storage.ts` | LargeSecureStore (getItem/setItem/removeItem), encrypt/decrypt roundtrip | ~12 |
| `__tests__/utils/fileUpload.test.ts` | `src/utils/fileUpload.ts` | readFileForUpload (web vs native paths) | ~4 |

**Additional mocks:** expo-secure-store, @react-native-async-storage/async-storage, expo-file-system

---

## Phase 4: Hooks (~120 tests, 21 hooks)

**Goal:** Test all custom hooks using `renderHook` from `@testing-library/react-native`.

**Pattern:** Mock the underlying service module, then verify the hook calls the right service functions and manages state correctly.

**File:** `__tests__/helpers/renderWithProviders.tsx` — wrapper component providing AuthContext and other required providers.

| Test File | Hook | Key Behaviors |
|-----------|------|--------------|
| `__tests__/hooks/useDogs.test.ts` | useDogs | loadDogs on mount, addDog/editDog/removeDog update state |
| `__tests__/hooks/useCheckIn.test.ts` | useCheckIn | Real-time subscription setup/teardown, checkIn/checkOut |
| `__tests__/hooks/useMessages.test.ts` | useMessages | Pagination (loadMore), real-time new messages |
| `__tests__/hooks/usePlaydates.test.ts` | usePlaydates | CRUD operations, filtering upcoming/past |
| `__tests__/hooks/useFriends.test.ts` | useFriends | Request flow (send/accept/decline), refresh |
| `__tests__/hooks/useUserProfile.test.ts` | useUserProfile | Block/friend/message actions |
| `__tests__/hooks/useResponsiveLayout.test.ts` | useResponsiveLayout | Breakpoint returns for various widths |
| ... (14 more) | ... | ... |

**Real-time subscription testing:** Mock `supabase.channel()` to return a chainable mock, then invoke the `.on()` callback directly to simulate incoming data.

---

## Phase 5: Components (~150 tests, 31 components)

**Goal:** Test rendering and interaction of all components.

**Additional mock files needed:**
- `__mocks__/expo-router.ts` (useRouter, useLocalSearchParams, Link)
- `__mocks__/expo-image.ts`
- `__mocks__/expo-haptics.ts`
- `__mocks__/@rnmapbox/maps.ts`

**Priority order:**
1. Pure display: DogSizeTag, DogCard, ParkCard, Skeleton, MessageBubble, ConversationListItem
2. Forms: DogForm, PlaydateForm
3. Interactive: CheckInButton, ConfirmModal, ImagePickerWithModeration
4. Complex: ParkDetailMobile, ParkReviewList, ParkPhotoGrid
5. Web: NavBar, Footer, PublicParkDetail, ParkDetailAuth
6. SEO: SEOHead, StructuredData

---

## Phase 6: Route Screens (Stretch)

**Goal:** Smoke-test key screens render without crashing. Lower ROI for unit tests — better covered by Playwright E2E.

- Smoke render tests for all tab screens
- Smoke render tests for auth screens
- Skip `.web.tsx` variants initially (add with `jest-expo/web` preset later)

---

## Coverage Exclusions

These are excluded from coverage metrics (impractical to unit test):

- `src/types/` — Type definitions only
- `src/components/parks/ParkMap*` — Native map SDK dependencies
- `src/services/moderation.web.ts` — TensorFlow.js + nsfwjs ML model
- `app/_layout.tsx` files — Declarative route config

**Realistic target:** 90%+ line coverage on `src/` with explicit `istanbul ignore` for unreachable platform branches.

---

## Estimated Totals

| Phase | Test Cases | Functions Covered |
|-------|-----------|------------------|
| 0 — Foundation | 0 new (fix existing) | 0 |
| 1 — Pure Utils | ~73 | ~20 |
| 2 — Services | ~251 | ~105 |
| 3 — Lib | ~16 | ~8 |
| 4 — Hooks | ~120 | 21 hooks |
| 5 — Components | ~150 | 31 components |
| 6 — Screens | ~80 | ~63 files |
| **Total** | **~690** | **~248 units** |
