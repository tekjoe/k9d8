# Google Play Store Launch Checklist

## Phase 1: Pre-Launch Preparation ✅

### App Configuration
- [x] Updated `app.json` with production package name (`com.k9d8.app`)
- [x] Added `versionCode: 1` for Android
- [x] Updated iOS bundle identifier to `com.k9d8.app`
- [x] Verified icon exists at `./assets/images/icon.png` (512x512)
- [x] Verified adaptive icons exist for Android
- [x] Mapbox token configured via environment variable

### Assets
- [x] App icon: `./assets/images/icon.png` (512x512 PNG)
- [x] Android adaptive icons: foreground, background, monochrome
- [x] Splash screen: `./assets/images/splash-icon.png`
- [x] Favicon: `./assets/images/favicon.png`
- [ ] Feature graphic (1024x500) - NEED TO CREATE
- [ ] Phone screenshots (2-8 screenshots) - NEED TO CAPTURE
- [ ] Tablet screenshots (optional) - CAN ADD LATER

### Environment
- [x] Production Supabase URL configured
- [x] Production Supabase anon key configured
- [x] Production Mapbox token configured
- [x] Mapbox download token configured

### Store Listing
- [x] Short description: 59 characters (max 80)
- [x] Full description: 939 characters (max 4000)
- [x] Privacy policy page created at `/privacy`

## Phase 2: Build Production App Bundle 🔄

### EAS Configuration
- [x] Created `eas.json` with production profile
- [ ] Login to Expo: `eas login`
- [ ] Configure project: `eas build:configure`
- [ ] Build production AAB: `eas build --platform android --profile production`

### Alternative: Local Build
- [ ] `npx expo prebuild --platform android`
- [ ] `cd android && ./gradlew bundleRelease`

## Phase 3: Google Play Console Setup ⏳

### Developer Account
- [ ] Create Google Play Developer account ($25 fee)
- [ ] Complete account verification (wait 48 hours)

### App Creation
- [ ] Create new app in Play Console
- [ ] App name: "k9d8"
- [ ] Default language: English (United States)
- [ ] App type: App
- [ ] Free or paid: Free

### App Setup
- [ ] App Access: All functionality available without special access
- [ ] Ads: No, my app does not contain ads
- [ ] Content Ratings: Complete questionnaire (Social Networking)
- [ ] Target Audience: 18 and over (or 13-15 with age gate)
- [ ] Data Safety: Complete form with privacy policy link

## Phase 4: Store Listing ⏳

### App Details
- [ ] App name: k9d8
- [ ] Short description: Connect with dog owners, discover parks, arrange playdates
- [ ] Full description: (see store-assets/full-description.txt)

### Graphics
- [ ] Upload app icon (512x512)
- [ ] Upload feature graphic (1024x500)
- [ ] Upload phone screenshots (min 2)
- [ ] Upload tablet screenshots (optional)

### Categorization
- [ ] Application type: Applications
- [ ] Category: Lifestyle or Social
- [ ] Tags: Dogs, Pets, Social, Lifestyle

## Phase 5: Release Setup ⏳

### Create Release
- [ ] Navigate to Production > Create new release
- [ ] Upload AAB file from Phase 2
- [ ] Review permissions

### Testing (Recommended)
- [ ] Set up Internal Testing (up to 100 testers)
- [ ] Set up Closed Testing (Alpha)
- [ ] Or proceed directly to Production

## Phase 6: Pre-Launch Checklist ⏳

### Technical
- [ ] Test on Android 10, 11, 12, 13, 14
- [ ] Test offline scenarios
- [ ] Test location services
- [ ] Test push notifications
- [ ] Verify app size < 100MB
- [ ] Remove debug code/console logs

### Content
- [ ] All placeholder text removed
- [ ] No test data in production
- [ ] Supabase RLS policies secure
- [ ] Mapbox token restrictions set

### Legal
- [ ] Privacy Policy published and linked
- [ ] Data Safety form completed
- [ ] Content rating completed

## Phase 7: Launch ⏳

### Submit
- [ ] Click "Send for review" or "Start rollout to Production"
- [ ] Wait for Google Play review (1-3 days)
- [ ] Monitor email for policy issues

### Post-Launch
- [ ] Download app from Play Store to verify
- [ ] Test core user flows
- [ ] Monitor crash reports
- [ ] Respond to user reviews

---

## Required Assets to Create

### High Priority (Before Launch)
1. Feature Graphic (1024x500) - Canva or Figma
2. Phone Screenshots (5-8 screenshots):
   - Home/Map view with parks
   - Dog profile page
   - Park details with check-in
   - Playdate creation
   - Chat/Messaging interface
   - Notifications

### Lower Priority (Can Add Later)
- 7-inch tablet screenshots
- 10-inch tablet screenshots
- Video preview (30 sec - 2 min)

---

## Quick Commands

```bash
# Build production AAB
eas build --platform android --profile production

# Build APK for testing
eas build --platform android --profile preview

# Build iOS (for App Store later)
eas build --platform ios
```

---

## Notes

- **Package Name**: `com.k9d8.app` (final)
- **Version**: 1.0.0
- **Version Code**: 1
- **Privacy Policy**: https://k9d8.com/privacy
- **Support Email**: support@k9d8.com (to be set up)
