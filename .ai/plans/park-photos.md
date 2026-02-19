# User-Submitted Dog Park Photos

## Overview

Allow registered users to upload photos to dog parks. Photos can be upvoted, and the top-voted photo becomes the featured image on park cards and the park detail hero. Users can report inappropriate photos and delete their own uploads.

## Database

### Storage Bucket: `park-photos`
- Public bucket, same pattern as `user-avatars`
- Upload path: `{userId}/{timestamp}.jpg`
- RLS: authenticated upload to own folder, public read, owner delete

### Tables

**park_photos** (id, park_id, user_id, photo_url, created_at)
- CASCADE on park/profile delete
- RLS: public SELECT, auth INSERT (own), DELETE (own)

**park_photo_votes** (id, photo_id, user_id, created_at)
- UNIQUE(photo_id, user_id) prevents duplicate votes
- CASCADE on photo delete

**park_photo_reports** (id, reporter_id, photo_id, reason, details, status, created_at, updated_at)
- UNIQUE(reporter_id, photo_id) prevents duplicate reports
- Reasons: spam, inappropriate, offensive, other

## Service Layer: `src/services/parkPhotos.ts`

- `uploadParkPhoto(userId, parkId, uri)` - Upload to storage + insert DB row
- `getParkPhotos(parkId, userId?)` - Fetch with profile join, vote counts, user vote status
- `voteParkPhoto(photoId)` / `unvoteParkPhoto(photoId)` - Toggle via insert/catch duplicate/delete
- `deleteParkPhoto(photoId, photoUrl)` - Delete DB row + storage object
- `reportParkPhoto(photoId, reason)` - Insert report, handle duplicate constraint

## Hook: `src/hooks/useParkPhotos.ts`

Returns: photos, featuredPhoto, loading, upload(), vote(), deletePhoto(), report(), refresh()
- `featuredPhoto` = photos[0] (sorted by votes desc)
- Real-time subscription on park_photos table
- Optimistic vote toggle

## Components

- **ParkPhotoGrid** - Section with header, "Add Photo" button (auth only), 2-col mobile / 3-col desktop grid. Uses `ImagePickerWithModeration` with `moderationEnabled: true`
- **ParkPhotoCard** - Thumbnail, uploader name, vote count, heart icon. Tap for full-screen modal with upvote/report/delete actions

## Integration

- **Park detail hero image**: `featuredPhoto?.photo_url || park.image_url`
- **ParkDetailMobile.tsx**: Add Photos section after "About This Park"
- **ParkDetailAuth.tsx**: Same, with 3-col grid on desktop
- **PublicParkDetail.tsx**: Read-only view, "Sign in to add photos" CTA

## Shared Utility

Extract `readFileForUpload` from `src/services/dogs.ts` to `src/utils/fileUpload.ts` for reuse by both dog photo and park photo uploads.
