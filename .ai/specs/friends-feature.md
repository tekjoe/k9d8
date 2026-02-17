# Friends Feature + Check-in Modal Improvements

## Context
Users want to connect socially within the app. The friends feature lets users add each other as friends, view friends on their profile, and receive push notifications when a friend checks into a dog park. Additionally, the check-in modal needs a close button and drag-to-dismiss.

---

## Part A: Friends Feature

### 1. Database Migration
**New file:** `supabase/migrations/00007_friendships.sql`

- `friendships` table with `requester_id`, `addressee_id`, `status` (enum: pending/accepted/declined), timestamps
- `UNIQUE(requester_id, addressee_id)` + `CHECK(requester_id != addressee_id)`
- RLS policies: users see own friendships, insert as requester only, addressee can update status, either can delete
- `are_friends()` SECURITY DEFINER helper (reusable by other RLS policies)
- `get_friends(uid)` and `get_friend_ids(uid)` SECURITY DEFINER functions for efficient lookups
- Realtime enabled
- Pattern: follows `00003_messaging.sql` and `00005_fix_messaging_rls.sql`

### 2. Types
**Modify:** `src/types/database.ts`
- Add `FriendshipStatus` type and `Friendship` interface

### 3. Service Layer
**New file:** `src/services/friends.ts`
- `getFriends(userId)` — calls `get_friends` RPC, returns `Profile[]`
- `getPendingRequests(userId)` — incoming pending requests with requester profile
- `sendFriendRequest(requesterId, addresseeId)` — checks both directions for duplicates before insert
- `acceptFriendRequest(friendshipId)` — updates status to accepted
- `declineFriendRequest(friendshipId)` — updates status to declined
- `removeFriend(friendshipId)` — deletes row
- `getFriendshipStatus(userId, otherUserId)` — returns friendship or null
- Pattern: follows `src/services/messages.ts`

### 4. Hook
**New file:** `src/hooks/useFriends.ts`
- Returns: `friends`, `pendingRequests`, `pendingCount`, `loading`, action functions, `refresh`
- Realtime subscription on `friendships` table (INSERT/UPDATE/DELETE)
- Pattern: follows `src/hooks/useConversations.ts`

### 5. UI — Profile Page Friends Section
**Modify:** `app/(tabs)/profile/index.tsx`
- Add "Friends (N)" section between profile info and "My Dogs"
- Horizontal scroll of friend avatars (pressable, navigates to user profile)
- Pending requests badge linking to requests screen
- Empty state with "Find Friends" CTA

### 6. UI — Friends List Screen
**New file:** `app/(tabs)/profile/friends/index.tsx`
- FlatList of accepted friends (avatar, name, chevron)
- Pressing a friend navigates to `/users/[id]`

### 7. UI — Friend Requests Screen
**New file:** `app/(tabs)/profile/friends/requests.tsx`
- FlatList of pending incoming requests
- Each row: avatar, name, Accept button, Decline button

### 8. UI — Register Routes
**Modify:** `app/(tabs)/profile/_layout.tsx`
- Add `friends/index` and `friends/requests` Stack.Screen entries

### 9. UI — User Profile Screen (view other users)
**New file:** `app/users/[id].tsx`
- Public user profile: avatar, name, bio, their dogs
- Friendship action button (contextual: Add Friend / Request Sent / Accept & Decline / Friends)
- Message button when already friends
- Register route in `app/_layout.tsx`
- Pattern: follows `app/dogs/[id].tsx`

### 10. UI — Add Friend from Dog Profile
**Modify:** `app/dogs/[id].tsx`
- Below "Message Owner" button, add "Add Friend" button when not already friends
- Uses `getFriendshipStatus()` to determine current state

### 11. Friend Check-in Notification (Edge Function)
**New file:** `supabase/functions/friend-checkin-notification/index.ts`
- Receives `{ user_id, park_id }` payload
- Fetches user profile name and park name
- Calls `get_friend_ids` RPC to get friend list
- Gets push tokens for all friends
- Sends via Expo Push API: "{Name} just checked in at {Park}!"
- Notification data includes `{ type: 'friend_checkin', parkId }`
- Pattern: follows `supabase/functions/push-notification/index.ts`

### 12. Trigger Notification from Check-in
**Modify:** `src/services/checkins.ts`
- After successful check-in, fire-and-forget invoke `friend-checkin-notification` edge function
- Pattern: follows `sendMessage()` in `src/services/messages.ts`

### 13. Handle Notification Tap
**Modify:** `src/hooks/useNotifications.ts`
- Add handler for `type === 'friend_checkin'` — navigate to `/parks/${parkId}`

---

## Part B: Check-in Modal Improvements

### 14. Close Button + Drag to Dismiss
**Modify:** `app/parks/[id].tsx` (lines 404-512)

**Close button:** Add an X button (Ionicons `close`) top-right of the modal sheet, next to the existing handle bar.

**Drag to dismiss:** Replace the `<Modal>` with a `PanResponder`-based approach or use `react-native-gesture-handler` (already installed at ~2.28.0) to detect downward swipe on the modal content and animate it off-screen, then call `setCheckInModalVisible(false)`. The approach:
- Wrap modal content in a `PanGestureHandler`
- Track vertical translation with `Animated.Value`
- On release: if dragged down > 100px, dismiss; otherwise snap back
- Keep the existing handle bar as the visual drag indicator

---

## Implementation Order
1. Migration (00007_friendships.sql)
2. Types (database.ts)
3. Service (friends.ts)
4. Hook (useFriends.ts)
5. Edge function (friend-checkin-notification)
6. Check-in service modification (checkins.ts)
7. Notification tap handler (useNotifications.ts)
8. Profile layout routes (_layout.tsx)
9. Profile page friends section (profile/index.tsx)
10. Friends list screen (friends/index.tsx)
11. Friend requests screen (friends/requests.tsx)
12. User profile screen (users/[id].tsx + _layout.tsx route)
13. Dog profile Add Friend button (dogs/[id].tsx)
14. Check-in modal close button + drag to dismiss (parks/[id].tsx)

## Verification
- Apply migration via `supabase db push` or local `supabase migration up`
- Deploy edge function via `supabase functions deploy friend-checkin-notification`
- Test friend request flow: send from dog profile -> accept on requests screen -> verify appears on profile
- Test check-in notification: check in at park -> verify friend receives push notification
- Test notification tap: tap notification -> navigates to park detail
- Test check-in modal: verify X button closes, drag down dismisses

---

*Created: February 2026*
