# Public Dog Profile with Message Owner Button

## Context

When users tap a dog avatar in the "Pups at the Park Now" section on a park detail page, nothing happens — the `DogAvatar` component has an `onPress` prop but it's never wired up. Users need to view a dog's profile and be able to message the dog's owner directly. No public dog profile screen exists yet.

---

## Step 1: Add `getDogWithOwner` to the dogs service

**File:** `src/services/dogs.ts`

Add a new function that fetches a dog with its owner's profile in a single query using a Supabase join. The existing `getDogById` remains untouched (used by the owner's edit screen).

```ts
import type { Dog, Profile, Database } from '../types/database';  // add Profile

export interface DogWithOwner extends Dog {
  owner: Profile;
}

export async function getDogWithOwner(id: string): Promise<DogWithOwner> {
  const { data, error } = await supabase
    .from('dogs')
    .select('*, owner:profiles!owner_id(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as DogWithOwner;
}
```

This follows the same join pattern used in `src/services/checkins.ts` (`profile:profiles!user_id(*)`) and `src/services/messages.ts`.

---

## Step 2: Create the public dog profile screen

**File (new):** `app/dogs/[id].tsx`

Follows the routing convention for shared detail screens (`app/parks/[id].tsx`, `app/playdates/[id].tsx`, etc.).

**Screen layout:**

1. **Header** — Back button (Ionicons `arrow-back`, `color="#1A1A2E"`) with safe area inset
2. **Hero photo** — Full-width dog photo (~280px height), fallback to Unsplash placeholder
3. **Name + breed** — Centered, `text-2xl font-bold` for name, `text-[15px] text-text-secondary` for breed
4. **Info tags** — Horizontal row of pill badges for Size, Temperament, and Age (using the `FeatureTag` pattern from park detail)
5. **Notes** — Conditionally shown if `dog.notes` exists
6. **Owner section** — Owner avatar + display name in a horizontal row
7. **"Message Owner" button** — Full-width green button. **Hidden when viewing your own dog** (`userId === dog.owner_id`). Calls `getOrCreateConversation(dog.owner_id)` then navigates to `/messages/${conversationId}`

**Key imports:**
- `getDogWithOwner` / `DogWithOwner` from `@/src/services/dogs`
- `getOrCreateConversation` from `@/src/services/messages`
- `useAuth` from `@/src/hooks/useAuth`

**Message button handler:**
```ts
const handleMessageOwner = useCallback(async () => {
  if (!dog || !userId) return;
  setMessageLoading(true);
  try {
    const conversationId = await getOrCreateConversation(dog.owner_id);
    router.push(`/messages/${conversationId}`);
  } catch (err) {
    Alert.alert('Error', 'Could not start conversation.');
  } finally {
    setMessageLoading(false);
  }
}, [dog, userId, router]);
```

**UI rules:**
- Use inline `color` prop on all `Ionicons` (NOT `className`)
- Use `ActivityIndicator` with `color` prop for loading states
- Match existing screen patterns for loading/error states

---

## Step 3: Register the route in root layout

**File:** `app/_layout.tsx`

Add one line after the existing `parks/[id]` screen registration:

```tsx
<Stack.Screen name="dogs/[id]" options={{ headerShown: false }} />
```

---

## Step 4: Wire up DogAvatar navigation in park detail

**File:** `app/parks/[id].tsx`

Change the `checkedInDogs` rendering (around line 338) from:

```tsx
{checkedInDogs.map((dog) => (
  <DogAvatar key={dog.id} dog={dog} />
))}
```

to:

```tsx
{checkedInDogs.map((dog) => (
  <DogAvatar
    key={dog.id}
    dog={dog}
    onPress={() => router.push(`/dogs/${dog.id}`)}
  />
))}
```

`router` is already available in this component. The `DogAvatar` component already accepts `onPress` and passes it to its `Pressable` wrapper — no changes to the component itself needed.

---

## Files Modified

| File | Action | Description |
|------|--------|-------------|
| `src/services/dogs.ts` | Modify | Add `DogWithOwner` interface + `getDogWithOwner()` function |
| `app/dogs/[id].tsx` | **Create** | New public dog profile screen with message button |
| `app/_layout.tsx` | Modify | Register `dogs/[id]` route (1 line) |
| `app/parks/[id].tsx` | Modify | Wire `onPress` on `DogAvatar` to navigate to dog profile |

---

## Verification

1. Go to a park detail page with active check-ins → tap a dog avatar → navigates to dog profile
2. Dog profile shows photo, name, breed, size, temperament, age, notes
3. Owner section shows the owner's display name and avatar
4. "Message Owner" button is visible for other users' dogs
5. Tapping "Message Owner" opens a conversation with the dog's owner
6. "Message Owner" button is hidden when viewing your own dog
7. Back button returns to the park detail page
8. Loading and error states display correctly

---

*Created: February 2026*
