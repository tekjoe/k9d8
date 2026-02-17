---
shaping: true
---

# Responsive Web Pages — Slices

Shape B selected. Each slice ends in demo-able UI on web.

---

## Slice Overview

| Slice | Title | Parts | Demo |
|-------|-------|-------|------|
| V1 | Infrastructure + friends pages | B1, B2, B5 (friends) | Friends list & requests render responsively with sidebar |
| V2 | Playdate create | B5 (create) | Create playdate form renders in centered container with sidebar |
| V3 | User profile | B4, B5 (users) | User profile renders with responsive hero, dog grid, friend actions |
| V4 | Playdate detail | B3, B5 (playdates/[id]) | Playdate detail renders with two-column layout, RSVP lists, modals |

---

## V1: Infrastructure + Friends Pages

**Why first:** Builds the shared foundation (hook + wrapper) and proves it on the two simplest pages (89 + 119 lines, both already use `useFriends()` — no business logic extraction needed).

### Deliverables

| # | File | What |
|---|------|------|
| 1 | `src/hooks/useResponsiveLayout.ts` | Hook returning `{ isMobile, isTablet, isDesktop, showSidebar, width }` with breakpoint constants |
| 2 | `src/components/ui/WebPageLayout.tsx` | Wrapper: conditional `DesktopSidebar` + `ScrollView` + responsive padding + `maxWidth` prop |
| 3 | `app/(tabs)/profile/friends/index.web.tsx` | Friends list with `WebPageLayout` — grid layout for friend cards on desktop |
| 4 | `app/(tabs)/profile/friends/requests.web.tsx` | Friend requests with `WebPageLayout` — wider action buttons, grid on desktop |

### Demo
- Navigate to friends list on web at >768px — sidebar visible, friend cards in responsive grid
- Navigate to friend requests — accept/decline buttons properly spaced
- Resize below 768px — sidebar hides, layout stacks to single column

---

## V2: Playdate Create

**Why second:** Simple form page (146 lines). Already uses `usePlaydates()` + `useDogs()` hooks. Only local logic is parks loading (small enough to duplicate). Validates `WebPageLayout` with a form-based page.

### Deliverables

| # | File | What |
|---|------|------|
| 1 | `app/playdates/create.web.tsx` | Create form inside `WebPageLayout` with `maxWidth: 600`, centered. Uses `PlaydateForm` component directly |

### Demo
- Navigate to create playdate on web — form renders in centered container with sidebar
- Form fields don't stretch to full width on large screens

---

## V3: User Profile

**Why third:** Introduces the hook extraction pattern at medium complexity (310 lines). The `.tsx` gets refactored to use the new hook, then `.web.tsx` consumes the same hook with different layout.

### Deliverables

| # | File | What |
|---|------|------|
| 1 | `src/hooks/useUserProfile.ts` | Hook extracting: profile/dogs/friendship fetching, friendship state derivations (`isOwnProfile`, `isFriend`, `isPending`, `isSentByMe`, `isSentToMe`), all action handlers (`handleSendRequest`, `handleAccept`, `handleRemoveFriend`, `handleMessage`) |
| 2 | `app/users/[id].tsx` | Refactor to consume `useUserProfile()` — same UI, logic delegated to hook |
| 3 | `app/users/[id].web.tsx` | Profile with `WebPageLayout` — responsive hero, two-column layout (profile info + dog cards), max-width action buttons |

### Demo
- Navigate to a user profile on web — hero section with centered avatar, dog cards in grid
- Friend action buttons don't stretch full width
- Mobile native still works unchanged (run on device/simulator to verify)

---

## V4: Playdate Detail

**Why last:** Most complex page (733 lines). Hook extraction is the largest lift. Modal needs responsive treatment. Depends on V1 infrastructure being proven.

### Deliverables

| # | File | What |
|---|------|------|
| 1 | `src/hooks/usePlaydateDetail.ts` | Hook extracting: playdate fetching, RSVP filtering (`goingRsvps`, `maybeRsvps`), derived state (`isOrganizer`, `userRsvp`, `isCancelled`), all handlers (`handleCancel`, `handleRsvp`, `handleCancelRsvp`), dog picker state (`showDogPicker`, `setShowDogPicker`), dogs list |
| 2 | `app/playdates/[id].tsx` | Refactor to consume `usePlaydateDetail()` — same UI, logic delegated to hook |
| 3 | `app/playdates/[id].web.tsx` | Playdate detail with `WebPageLayout` — two-column layout (details + action sidebar), responsive RSVP lists, responsive dog picker modal |

### Demo
- Navigate to playdate detail on web — info on left, actions/RSVP sidebar on right
- Dog picker modal renders with proper width constraints
- Cancel/RSVP actions work correctly
- Mobile native still works unchanged

---

## Dependency Graph

```
V1 (infrastructure + friends)
├── V2 (playdate create) — uses WebPageLayout + useResponsiveLayout
├── V3 (user profile) — uses WebPageLayout + introduces hook extraction pattern
└── V4 (playdate detail) — uses WebPageLayout + largest hook extraction
```

V2, V3, V4 all depend on V1. V2/V3/V4 are independent of each other but ordered by complexity (ascending) so the pattern is proven on simpler cases first.
