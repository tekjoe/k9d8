---
shaping: true
---

# Responsive Web Pages — Shaping

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| R0 | 5 pages render with responsive layouts on web (not mobile-only) | Core goal |
| R1 | Desktop shows DesktopSidebar + adapted layout for each page | Must-have |
| R2 | Follow existing breakpoint conventions (768 / 1024 / 1440) | Must-have |
| R3 | Avoid the duplication problem seen in `dogs/[id].web.tsx` (+326% code, inlined form UI) | Must-have |
| R4 | Mobile native behavior is unchanged | Must-have |
| R5 | New pages are consistent with existing `.web.tsx` patterns | Must-have |

---

## Target Pages

| Page | Lines | Complexity | Key UI |
|------|-------|------------|--------|
| `playdates/create.tsx` | 146 | Low | Form wrapper + park selector |
| `playdates/[id].tsx` | 733 | High | Modals, RSVP lists, complex state |
| `users/[id].tsx` | 310 | Medium | Profile hero, dog cards, friend actions |
| `profile/friends/index.tsx` | 89 | Low | FlatList of friends |
| `profile/friends/requests.tsx` | 119 | Low | FlatList + accept/decline buttons |

---

## CURRENT: Existing Pattern

The established approach is: create a parallel `.web.tsx` file for each page that needs different web behavior.

| Part | Mechanism |
|------|-----------|
| **CUR1** | Each page gets a `.web.tsx` sibling — React Native resolves to it on web |
| **CUR2** | `.web.tsx` imports `useWindowDimensions()` and computes breakpoints inline |
| **CUR3** | Business logic (fetching, state, handlers) is duplicated in the `.web.tsx` file |
| **CUR4** | Layout/JSX is rewritten for desktop (sidebar + responsive containers) |

**Observed outcomes of CURRENT:**
- Best case: +20% code (parks detail) — mostly layout changes
- Worst case: +326% code (dog edit) — entire form UI re-inlined
- Breakpoint logic duplicated across 10+ files with no shared constants
- No shared responsive hook exists

---

## A: One `.web.tsx` per page (status quo)

Follow the existing pattern exactly — create 5 new `.web.tsx` files, each with duplicated logic + responsive layout.

| Part | Mechanism |
|------|-----------|
| **A1** | Create 5 `.web.tsx` files, one per target page |
| **A2** | Copy business logic from `.tsx` into each `.web.tsx` |
| **A3** | Add `useWindowDimensions()` + breakpoints inline in each file |
| **A4** | Wrap content with `DesktopSidebar` conditional pattern |

---

## B: Extract hook + responsive wrapper, then `.web.tsx` (SELECTED)

Create shared infrastructure first, then build leaner `.web.tsx` files that reuse it.

| Part | Mechanism |
|------|-----------|
| **B1** | **`useResponsiveLayout()` hook** — `src/hooks/useResponsiveLayout.ts`. Returns `{ isMobile, isTablet, isDesktop, showSidebar, width }` with centralized breakpoint constants (768 / 1024 / 1440) |
| **B2** | **`<WebPageLayout>` wrapper** — `src/components/ui/WebPageLayout.tsx`. Accepts children + optional `maxWidth` prop. Handles: conditional `DesktopSidebar`, `ScrollView` with responsive padding (16/32/48), `maxWidth` container, `useSafeAreaInsets` for header. Replaces ~20 lines of boilerplate per page |
| **B3** | **`usePlaydateDetail(id)` hook** — Extract from `playdates/[id].tsx` (733 lines). Returns `{ playdate, loading, error, goingRsvps, maybeRsvps, isOrganizer, userRsvp, handleCancel, handleRsvp, handleCancelRsvp, showDogPicker, setShowDogPicker, dogs }`. Both `.tsx` and `.web.tsx` consume this hook |
| **B4** | **`useUserProfile(id)` hook** — Extract from `users/[id].tsx` (310 lines). Returns `{ profile, dogs, friendship, loading, isOwnProfile, isFriend, isPending, isSentByMe, isSentToMe, handleSendRequest, handleAccept, handleRemoveFriend, handleMessage }`. Both `.tsx` and `.web.tsx` consume this hook |
| **B5** | **5 `.web.tsx` page files** — Each imports `useResponsiveLayout` + `WebPageLayout` + relevant business hook. Only contains layout JSX for desktop. `friends/index` and `friends/requests` need no business hook extraction (already use `useFriends()`) |

---

## C: Responsive-in-place (no `.web.tsx` files)

Make the existing `.tsx` files responsive by adding conditional layout directly, avoiding file duplication entirely.

| Part | Mechanism |
|------|-----------|
| **C1** | Add `useResponsiveLayout()` hook (same as B1) |
| **C2** | Import and use responsive breakpoints directly in each `.tsx` file |
| **C3** | Conditionally render `DesktopSidebar` inside the existing page components |
| **C4** | Use `Platform.OS` or breakpoint checks to branch layout within one file |

---

## Fit Check

| Req | Requirement | Status | A | B | C |
|-----|-------------|--------|---|---|---|
| R0 | 5 pages render with responsive layouts on web | Core goal | ✅ | ✅ | ✅ |
| R1 | Desktop shows DesktopSidebar + adapted layout | Must-have | ✅ | ✅ | ✅ |
| R2 | Follow existing breakpoint conventions | Must-have | ✅ | ✅ | ✅ |
| R3 | Avoid the duplication problem seen in `dogs/[id].web.tsx` | Must-have | ❌ | ✅ | ✅ |
| R4 | Mobile native behavior is unchanged | Must-have | ✅ | ✅ | ❌ |
| R5 | New pages are consistent with existing `.web.tsx` patterns | Must-have | ✅ | ✅ | ❌ |

**Notes:**
- A fails R3: Status quo approach directly leads to logic duplication — the pattern that caused +326% bloat in `dogs/[id].web.tsx`
- C fails R4: Adding web-specific imports (`DesktopSidebar`, `useWindowDimensions`) and conditional branches into native-first `.tsx` files risks regressions and bloats native bundle
- C fails R5: Breaks the established `.web.tsx` convention used by 10+ existing pages
