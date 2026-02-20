# Test Coverage Checklist

## Phase 0: Foundation
- [x] Install `jest-expo`, `jest`, `@types/jest`
- [x] Install `@testing-library/react-native`, `@testing-library/jest-native`
- [x] Create `jest.config.js` with jest-expo preset, path mapping, transform patterns
- [x] Create `jest.setup.ts` with extended matchers
- [x] Add `test`, `test:watch`, `test:coverage` scripts to `package.json`
- [x] Fix imports in `__tests__/utils/playdates.test.ts` (PlayDate → Playdate casing)
- [x] Create Supabase mock at `src/lib/__mocks__/supabase.ts`
- [x] Create shared helper at `__tests__/helpers/supabaseMock.ts`
- [x] Verify: `npm test -- --testPathPattern=playdates` passes (28/28 ✓)

## Phase 1: Pure Utility Functions
- [x] `__tests__/utils/slug.test.ts` — generateParkSlug, generateParkSlugWithState, extractSlugFromUrl, extractShortIdFromSlug, isValidUUID, parseSlugOrId, findParkIdFromSlug
- [x] `__tests__/services/wordFilter.test.ts` — filterMessage
- [x] `__tests__/services/parks.pure.test.ts` — boundingBoxFromCenter, stateAbbrevToName, stateNameToAbbrev, getParkStateSlug
- [x] Verify: `npm test` — all Phase 0+1 tests pass (83/83 ✓)

## Phase 2: Service Layer
- [x] `__tests__/services/blocks.test.ts` — blockUser, unblockUser, getBlockStatus, getBlockedUsers
- [x] `__tests__/services/reports.test.ts` — reportMessage
- [x] `__tests__/services/checkins.test.ts` — checkIn, checkOut, getActiveCheckIns, getAllActiveCheckIns, getUserRecentCheckIns, getUserActiveCheckIn
- [x] `__tests__/services/parks.test.ts` — getParksInBounds, getAllParks, getParksNearby, getActiveCheckInCounts, getParkById, getParkByShortId, getParkBySlug, getParkCityCounts, getParksByCity, getParkStateCounts, getParksByState, getParksByStatePaginated, getFeaturedParks
- [x] `__tests__/services/messages.test.ts` — getConversations, getOrCreateConversation, getMessages, sendMessage, markConversationRead
- [x] `__tests__/services/friends.test.ts` — getFriends, getPendingRequests, getSentRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, removeFriendByUserId, getRecentFriendships, getFriendshipStatus
- [x] `__tests__/services/dogs.test.ts` — getDogsByOwner, getDogWithOwner, getDogById, createDog, updateDog, deleteDog, uploadDogPhoto
- [x] `__tests__/services/playdates.test.ts` — getPlayDates, getPlayDateById, getMyPlayDates, createPlayDate, updatePlayDate, cancelPlayDate, rsvpToPlayDate, cancelRSVP, getPlaydateWithExpirationCheck, rsvpToPlaydateWithCheck, getActivePlaydates, getPastPlaydates, getAllPlaydatesForUser
- [x] `__tests__/services/auth.test.ts` — signInWithEmail, signUpWithEmail, signOut, updateProfile, deleteAccount, signInWithGoogle, signInWithApple, deleteUserAvatar, uploadUserAvatar
- [x] `__tests__/services/notifications.test.ts` — registerPushToken, removePushToken, getNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, cleanupOldNotifications, subscribeToNotifications
- [x] `__tests__/services/parkReviews.test.ts` — createParkReview, getParkReviews, voteParkReview, unvoteParkReview, deleteParkReview, reportParkReview
- [x] `__tests__/services/parkPhotos.test.ts` — uploadParkPhoto, getParkPhotos, voteParkPhoto, unvoteParkPhoto, deleteParkPhoto, getFeaturedPhotosForParks, reportParkPhoto
- [x] `__tests__/services/moderation.test.ts` — native stubs (all 10 functions)
- [x] Verify: `npm run test:coverage` — services at 92% lines/functions (83% stmts, 68% branches — remaining gaps are platform-specific web OAuth paths)

## Phase 3: Lib Layer
- [x] `__tests__/lib/storage.test.ts` — LargeSecureStore getItem/setItem/removeItem, encrypt/decrypt roundtrip
- [x] `__tests__/utils/fileUpload.test.ts` — readFileForUpload (web vs native)
- [x] Verify: 259 tests passing across 19 suites

## Phase 4: Hooks
- [x] Create `__tests__/helpers/renderWithProviders.tsx` — wrapper with AuthContext
- [x] `__tests__/hooks/useAuth.test.ts`
- [x] `__tests__/hooks/useDogs.test.ts`
- [x] `__tests__/hooks/useLocation.test.ts`
- [x] `__tests__/hooks/useCheckIn.test.ts`
- [x] `__tests__/hooks/useConversations.test.ts`
- [x] `__tests__/hooks/useMessages.test.ts`
- [x] `__tests__/hooks/useParks.test.ts`
- [x] `__tests__/hooks/useNearbyPups.test.ts`
- [x] `__tests__/hooks/useNearbyParks.test.ts`
- [x] `__tests__/hooks/useResponsiveLayout.test.ts`
- [x] `__tests__/hooks/useRecentActivity.test.ts`
- [x] `__tests__/hooks/useNotificationsData.test.ts`
- [x] `__tests__/hooks/usePlaydateExpiration.test.ts`
- [x] `__tests__/hooks/usePlaydateDetail.test.ts`
- [x] `__tests__/hooks/usePlaydates.test.ts`
- [x] `__tests__/hooks/useModeration.test.ts`
- [x] `__tests__/hooks/useFriends.test.ts`
- [x] `__tests__/hooks/useUserProfile.test.ts`
- [x] `__tests__/hooks/useParkPhotos.test.ts`
- [x] `__tests__/hooks/useParkReviews.test.ts`
- [x] `__tests__/hooks/useNotifications.test.ts`
- [x] Verify: 356 tests passing across 40 suites

## Phase 5: Components
- [x] Create module mocks: `__mocks__/expo-router.ts`, `__mocks__/expo-image.ts`, `__mocks__/expo-haptics.ts`, `__mocks__/@rnmapbox/maps.ts`
- [x] `__tests__/components/dogs/DogSizeTag.test.tsx`
- [x] `__tests__/components/dogs/DogCard.test.tsx`
- [x] `__tests__/components/dogs/DogForm.test.tsx`
- [x] `__tests__/components/parks/ParkCard.test.tsx`
- [x] `__tests__/components/parks/CheckInButton.test.tsx`
- [x] `__tests__/components/parks/CheckInList.test.tsx`
- [x] `__tests__/components/parks/ParkReviewList.test.tsx`
- [x] `__tests__/components/parks/ParkReviewCard.test.tsx`
- [x] `__tests__/components/parks/ParkPhotoGrid.test.tsx`
- [x] `__tests__/components/parks/ParkPhotoCard.test.tsx`
- [x] `__tests__/components/parks/ParkDetailMobile.test.tsx`
- [x] `__tests__/components/messages/MessageBubble.test.tsx`
- [x] `__tests__/components/messages/ConversationListItem.test.tsx`
- [x] `__tests__/components/playdates/PlaydateCard.test.tsx`
- [x] `__tests__/components/playdates/PlaydateForm.test.tsx`
- [x] `__tests__/components/auth/SocialAuthButtons.test.tsx`
- [x] `__tests__/components/ui/Skeleton.test.tsx`
- [x] `__tests__/components/ui/ConfirmModal.test.tsx`
- [x] `__tests__/components/ui/DesktopSidebar.test.tsx`
- [x] `__tests__/components/ui/WebPageLayout.test.tsx`
- [x] `__tests__/components/web/NavBar.test.tsx`
- [x] `__tests__/components/web/Footer.test.tsx`
- [x] `__tests__/components/web/PublicParkDetail.test.tsx`
- [x] `__tests__/components/web/ParkDetailAuth.test.tsx`
- [x] `__tests__/components/seo/SEOHead.test.tsx`
- [x] `__tests__/components/seo/StructuredData.test.tsx`
- [x] `__tests__/components/ImagePickerWithModeration.test.tsx`
- [x] Verify: 480 tests passing across 67 suites

## Phase 6: Route Screens (Stretch)
- [ ] Smoke render tests for tab screens (index, explore, messages, profile)
- [ ] Smoke render tests for auth screens (sign-in, sign-up, onboard)
- [ ] Smoke render tests for top-level pages (landing, features, terms, privacy, download)
- [ ] Smoke render tests for nested routes (playdates, dog-parks, dogs, users, blog)
- [ ] Verify: `npm run test:coverage` — overall 90%+ on `src/`

## Final
- [ ] Raise coverage thresholds in `jest.config.ts` to 90%
- [ ] Add `npm test` to CI pipeline
- [ ] Document testing patterns in `.ai/plans/test-coverage.md`
