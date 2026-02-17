---
shaping: true
---

# Dog Friends — Shaping

## Source

> Users should be able to view and add their dogs' friends. Their friends will appear in the user profile page. This function will require a new database table, UI elements, and business logic. If any of your dog friends are active they will show up on the home view.

---

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| R0 | Dogs can have friend relationships with other dogs | Core goal |
| R1 | Users can send, accept, and decline dog friend requests on behalf of their dogs | Must-have |
| R2 | A dog's friends are visible on that dog's profile page | Must-have |
| R3 | Dog friends who are currently checked in at a park surface on the home view | Must-have |
| R4 | Dog friendships are distinct from human-to-human friendships | Must-have |
| R5 | Follows existing service/hook/Realtime patterns in the codebase | Must-have |
| R6 | RLS policies enforce that only dog owners can manage their dogs' friendships | Must-have |

---

## CURRENT: Existing System

No dog-to-dog friendship exists. Relevant adjacent systems:

| Part | Mechanism |
|------|-----------|
| **CUR1** | `friendships` table: requester_id/addressee_id (Profile refs), status (pending/accepted/declined), unique constraint, bidirectional check |
| **CUR2** | `src/services/friends.ts` + `src/hooks/useFriends.ts`: full request/accept/decline flow with Realtime subscriptions |
| **CUR3** | `check_ins` + `check_in_dogs` tables: track which dogs are active at a park (`checked_out_at IS NULL`) |
| **CUR4** | Home view "Pups Nearby" section: uses `useNearbyPups()` → `getAllActiveCheckIns()` → shows up to 6 active dogs |
| **CUR5** | Dog profile (`app/dogs/[id].tsx`): shows dog details + owner info + "Add Friend" / "Message Owner" (human friendship, not dog) |

---

## A: Mirror human friendship pattern for dogs

Follow the exact same architecture as human friendships, substituting dog IDs for profile IDs.

| Part | Mechanism |
|------|-----------|
| **A1** | `dog_friendships` table: `requester_dog_id` / `addressee_dog_id` (Dog refs), status enum, unique constraint, bidirectional RLS check via dog owner |
| **A2** | `src/services/dogFriends.ts`: `sendDogFriendRequest(requesterDogId, addresseeDogId)`, `acceptDogFriendRequest(id)`, `declineDogFriendRequest(id)`, `removeDogFriend(id)`, `getDogFriends(dogId)` — mirrors `friends.ts` |
| **A3** | `src/hooks/useDogFriends.ts`: state + Realtime subscriptions on `dog_friendships` table, returns `{ dogFriends, pendingRequests, sendRequest, acceptRequest, declineRequest, removeFriend }` |
| **A4** | Dog profile UI: new "Friends" section on `app/dogs/[id].tsx` showing dog friend avatars + "Add Dog Friend" button (visible when viewing another user's dog) |
| **A5** | Home view: filter `useNearbyPups()` results to highlight/badge dogs that are friends of any of the current user's dogs, or add a separate "Your Dog Friends Active Now" section |

---

## Fit Check

| Req | Requirement | Status | A |
|-----|-------------|--------|---|
| R0 | Dogs can have friend relationships with other dogs | Core goal | ✅ |
| R1 | Users can send, accept, and decline dog friend requests on behalf of their dogs | Must-have | ✅ |
| R2 | A dog's friends are visible on that dog's profile page | Must-have | ✅ |
| R3 | Dog friends who are currently checked in surface on the home view | Must-have | ✅ |
| R4 | Dog friendships are distinct from human-to-human friendships | Must-have | ✅ |
| R5 | Follows existing service/hook/Realtime patterns in the codebase | Must-have | ✅ |
| R6 | RLS policies enforce that only dog owners can manage their dogs' friendships | Must-have | ✅ |
