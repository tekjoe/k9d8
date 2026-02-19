# Test Coverage Checklist

## Phase 0: Foundation
- [ ] Install `jest-expo`, `jest`, `@types/jest`
- [ ] Install `@testing-library/react-native`, `@testing-library/jest-native`
- [ ] Create `jest.config.ts` with jest-expo preset, path mapping, transform patterns
- [ ] Create `jest.setup.ts` with extended matchers
- [ ] Add `test`, `test:watch`, `test:coverage` scripts to `package.json`
- [ ] Fix imports in `__tests__/utils/playdates.test.ts` (PlayDate → Playdate casing)
- [ ] Create Supabase mock at `src/lib/__mocks__/supabase.ts`
- [ ] Create shared helper at `__tests__/helpers/supabaseMock.ts`
- [ ] Verify: `npm test -- --testPathPattern=playdates` passes

## Phase 1: Pure Utility Functions
- [ ] `__tests__/utils/slug.test.ts` — generateParkSlug, generateParkSlugWithState, extractSlugFromUrl, extractShortIdFromSlug, isValidUUID, parseSlugOrId, findParkIdFromSlug
- [ ] `__tests__/services/wordFilter.test.ts` — filterMessage
- [ ] `__tests__/services/parks.pure.test.ts` — boundingBoxFromCenter, stateAbbrevToName, stateNameToAbbrev, getParkStateSlug
- [ ] Verify: `npm test` — all Phase 0+1 tests pass

## Phase 2: Service Layer
- [ ] `__tests__/services/blocks.test.ts` — blockUser, unblockUser, getBlockStatus, getBlockedUsers
- [ ] `__tests__/services/reports.test.ts` — reportMessage
- [ ] `__tests__/services/checkins.test.ts` — checkIn, checkOut, getActiveCheckIns, getAllActiveCheckIns, getUserRecentCheckIns, getUserActiveCheckIn
- [ ] `__tests__/services/parks.test.ts` — getParksInBounds, getAllParks, getParksNearby, getActiveCheckInCounts, getParkById, getParkByShortId, getParkBySlug, getParkCityCounts, getParksByCity, getParkStateCounts, getParksByState, getParksByStatePaginated, getFeaturedParks
- [ ] `__tests__/services/messages.test.ts` — getConversations, getOrCreateConversation, getMessages, sendMessage, markConversationRead
- [ ] `__tests__/services/friends.test.ts` — getFriends, getPendingRequests, getSentRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, removeFriendByUserId, getRecentFriendships, getFriendshipStatus
- [ ] `__tests__/services/dogs.test.ts` — getDogsByOwner, getDogWithOwner, getDogById, createDog, updateDog, deleteDog, uploadDogPhoto
- [ ] `__tests__/services/playdates.test.ts` — getPlayDates, getPlayDateById, getMyPlayDates, createPlayDate, updatePlayDate, cancelPlayDate, rsvpToPlayDate, cancelRSVP, getPlaydateWithExpirationCheck, rsvpToPlaydateWithCheck, getActivePlaydates, getPastPlaydates, getAllPlaydatesForUser
- [ ] `__tests__/services/auth.test.ts` — signInWithEmail, signUpWithEmail, signOut, updateProfile, deleteAccount, signInWithGoogle, signInWithApple, deleteUserAvatar, uploadUserAvatar
- [ ] `__tests__/services/notifications.test.ts` — registerPushToken, removePushToken, getNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, cleanupOldNotifications, subscribeToNotifications
- [ ] `__tests__/services/parkReviews.test.ts` — createParkReview, getParkReviews, voteParkReview, unvoteParkReview, deleteParkReview, reportParkReview
- [ ] `__tests__/services/parkPhotos.test.ts` — uploadParkPhoto, getParkPhotos, voteParkPhoto, unvoteParkPhoto, deleteParkPhoto, getFeaturedPhotosForParks, reportParkPhoto
- [ ] `__tests__/services/moderation.test.ts` — native stubs (all 10 functions)
- [ ] Verify: `npm run test:coverage` — services at 90%+

## Phase 3: Lib Layer
- [ ] `__tests__/lib/storage.test.ts` — LargeSecureStore getItem/setItem/removeItem, encrypt/decrypt roundtrip
- [ ] `__tests__/utils/fileUpload.test.ts` — readFileForUpload (web vs native)
- [ ] Verify: `npm run test:coverage` — lib + utils at 90%+

## Phase 4: Hooks
- [ ] Create `__tests__/helpers/renderWithProviders.tsx` — wrapper with AuthContext
- [ ] `__tests__/hooks/useAuth.test.ts`
- [ ] `__tests__/hooks/useDogs.test.ts`
- [ ] `__tests__/hooks/useLocation.test.ts`
- [ ] `__tests__/hooks/useCheckIn.test.ts`
- [ ] `__tests__/hooks/useConversations.test.ts`
- [ ] `__tests__/hooks/useMessages.test.ts`
- [ ] `__tests__/hooks/useParks.test.ts`
- [ ] `__tests__/hooks/useNearbyPups.test.ts`
- [ ] `__tests__/hooks/useNearbyParks.test.ts`
- [ ] `__tests__/hooks/useResponsiveLayout.test.ts`
- [ ] `__tests__/hooks/useRecentActivity.test.ts`
- [ ] `__tests__/hooks/useNotificationsData.test.ts`
- [ ] `__tests__/hooks/usePlaydateExpiration.test.ts`
- [ ] `__tests__/hooks/usePlaydateDetail.test.ts`
- [ ] `__tests__/hooks/usePlaydates.test.ts`
- [ ] `__tests__/hooks/useModeration.test.ts`
- [ ] `__tests__/hooks/useFriends.test.ts`
- [ ] `__tests__/hooks/useUserProfile.test.ts`
- [ ] `__tests__/hooks/useParkPhotos.test.ts`
- [ ] `__tests__/hooks/useParkReviews.test.ts`
- [ ] `__tests__/hooks/useNotifications.test.ts`
- [ ] Verify: `npm run test:coverage` — hooks at 85%+

## Phase 5: Components
- [ ] Create module mocks: `__mocks__/expo-router.ts`, `__mocks__/expo-image.ts`, `__mocks__/expo-haptics.ts`, `__mocks__/@rnmapbox/maps.ts`
- [ ] `__tests__/components/dogs/DogSizeTag.test.tsx`
- [ ] `__tests__/components/dogs/DogCard.test.tsx`
- [ ] `__tests__/components/dogs/DogForm.test.tsx`
- [ ] `__tests__/components/parks/ParkCard.test.tsx`
- [ ] `__tests__/components/parks/CheckInButton.test.tsx`
- [ ] `__tests__/components/parks/CheckInList.test.tsx`
- [ ] `__tests__/components/parks/ParkReviewList.test.tsx`
- [ ] `__tests__/components/parks/ParkReviewCard.test.tsx`
- [ ] `__tests__/components/parks/ParkPhotoGrid.test.tsx`
- [ ] `__tests__/components/parks/ParkPhotoCard.test.tsx`
- [ ] `__tests__/components/parks/ParkDetailMobile.test.tsx`
- [ ] `__tests__/components/messages/MessageBubble.test.tsx`
- [ ] `__tests__/components/messages/ConversationListItem.test.tsx`
- [ ] `__tests__/components/playdates/PlaydateCard.test.tsx`
- [ ] `__tests__/components/playdates/PlaydateForm.test.tsx`
- [ ] `__tests__/components/auth/SocialAuthButtons.test.tsx`
- [ ] `__tests__/components/ui/Skeleton.test.tsx`
- [ ] `__tests__/components/ui/ConfirmModal.test.tsx`
- [ ] `__tests__/components/ui/DesktopSidebar.test.tsx`
- [ ] `__tests__/components/ui/WebPageLayout.test.tsx`
- [ ] `__tests__/components/web/NavBar.test.tsx`
- [ ] `__tests__/components/web/Footer.test.tsx`
- [ ] `__tests__/components/web/PublicParkDetail.test.tsx`
- [ ] `__tests__/components/web/ParkDetailAuth.test.tsx`
- [ ] `__tests__/components/seo/SEOHead.test.tsx`
- [ ] `__tests__/components/seo/StructuredData.test.tsx`
- [ ] `__tests__/components/ImagePickerWithModeration.test.tsx`
- [ ] Verify: `npm run test:coverage` — components at 80%+

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
