# Dog Park Reviews (Threaded Comments)

## Overview

Allow users to write reviews on dog park detail pages with threaded replies. Reviews can be upvoted, reported, and deleted by the author. Users receive push notifications when someone replies to their review.

## Database

### Tables

**park_reviews** (id, park_id, user_id, parent_id nullable self-ref, content TEXT 1-2000 chars, created_at, updated_at)
- CASCADE on park/profile/parent delete (deleting parent cascades replies)
- RLS: public SELECT, auth INSERT (own), DELETE (own)
- Indexes on park_id, user_id, parent_id

**park_review_votes** (id, review_id, user_id, created_at)
- UNIQUE(review_id, user_id) prevents duplicate votes

**park_review_reports** (id, reporter_id, review_id, reason, details, status, created_at, updated_at)
- UNIQUE(reporter_id, review_id) prevents duplicate reports
- Reasons: spam, harassment, hate_speech, inappropriate, other

### Notification Trigger

- Extend notifications type CHECK to include `'review_reply'`
- `notify_review_reply()` trigger on park_reviews INSERT where parent_id IS NOT NULL
- Calls `create_notification()` for parent review author (skip self-replies)
- Data: {park_id, review_id, reply_id}

## Threading Design

- 1 level of nesting only
- Top-level reviews: parent_id IS NULL
- Replies: parent_id = root review ID (not the reply being responded to)
- Display: parent card with indented replies below (16px left margin)
- No "Reply" button on reply cards

## Service Layer: `src/services/parkReviews.ts`

- `createParkReview(parkId, content, parentId?)` - Run word filter first, reject if not clean, then insert
- `getParkReviews(parkId, userId?)` - Fetch top-level + replies, join profiles, compute votes, nest replies under parents
- `voteParkReview(reviewId)` / `unvoteParkReview(reviewId)` - Toggle pattern
- `deleteParkReview(reviewId)` - CASCADE deletes replies
- `reportParkReview(reviewId, reason)` - Same report pattern as messages/photos

## Hook: `src/hooks/useParkReviews.ts`

Returns: reviews, loading, sortBy, setSortBy, createReview(), vote(), deleteReview(), report(), refresh()
- sortBy: 'votes' (default) or 'recent'
- Real-time subscription on park_reviews by park_id
- Optimistic vote toggle

## Components

- **ParkReviewList** - "Reviews" header with count, sort toggle (Top/Recent), "Write a Review" button (auth only) with inline TextInput. Maps reviews to ParkReviewCard
- **ParkReviewCard** - Author avatar + name, relative date, content, vote count + upvote button, Reply button. Long-press to report. Delete for owner only (with confirmation). "Reply" opens inline TextInput. Renders indented replies underneath

## Edge Function: `review-reply-notification`

Pattern from friend-checkin-notification:
- Triggered on park_reviews INSERT where parent_id IS NOT NULL
- Get parent author, replier name, park info
- Build park slug path for deep linking
- Send push: "{name} replied to your review"

## Notification Handling

Add `'review_reply'` case to useNotifications tap handler → navigate to `/dog-parks/{parkPath}`

## Integration

- **ParkDetailMobile.tsx**: Add Reviews section after "Upcoming Play Dates"
- **ParkDetailAuth.tsx**: Same layout
- **PublicParkDetail.tsx**: Read-only, "Sign in to write a review" CTA
