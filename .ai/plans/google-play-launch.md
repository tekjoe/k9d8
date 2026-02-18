# Google Play Store Launch Plan

## Overview

This document outlines the complete process for launching the k9d8 app on the Google Play Store.

**App Type:** React Native (Expo) app with native modules (Mapbox)  
**Package Name:** `com.anonymous.k9d8` (to be updated)  
**Current Version:** 1.0.0

---

## Phase 1: Pre-Launch Preparation

### 1.1 Update App Configuration

#### Update `app.json` with production values:

```json
{
  "expo": {
    "name": "k9d8",
    "slug": "k9d8",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "k9d8",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.k9d8.app"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.k9d8.app",
      "versionCode": 1
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ],
      "expo-secure-store",
      [
        "@rnmapbox/maps",
        {
          "RNMapboxMapsDownloadToken": "YOUR_MAPBOX_SECRET_TOKEN"
        }
      ],
      "@react-native-community/datetimepicker",
      "expo-notifications"
    ]
  }
}
```

#### Key changes needed:
- [ ] Change `android.package` from `com.anonymous.k9d8` to production package name (e.g., `com.k9d8.app`)
- [ ] Add `versionCode` (must increment with each release)
- [ ] Verify `icon` path exists and meets requirements (512x512 PNG)
- [ ] Verify adaptive icon images exist

### 1.2 Verify Required Assets

| Asset | Specification | Location |
|-------|--------------|----------|
| App Icon | 512x512 PNG, 32-bit with alpha | `./assets/images/icon.png` |
| Feature Graphic | 1024x500 JPG/PNG | Create for Play Store |
| Phone Screenshots | 16:9 or 9:16 aspect ratio, min 320px, max 3840px | Capture from device |
| Tablet Screenshots | 16:9 or 9:16, 7-inch and 10-inch | Capture from emulator |
| Short Description | 80 characters max | Write copy |
| Full Description | 4000 characters max | Write copy |

### 1.3 Environment & Secrets

Ensure these are configured for production builds:

```bash
# .env file (NOT committed to git)
EXPO_PUBLIC_SUPABASE_URL=https://your-production-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
EXPO_PUBLIC_MAPBOX_TOKEN=pk.your_public_mapbox_token
MAPBOX_DOWNLOAD_TOKEN=sk.your_secret_mapbox_token
```

- [ ] Verify production Supabase instance
- [ ] Verify Mapbox production token
- [ ] Verify all API endpoints use production URLs

### 1.4 Analytics Setup

Analytics are essential for understanding user behavior, tracking app performance, and making data-driven decisions.

#### Recommended: Firebase Analytics

Firebase Analytics is the recommended solution for Expo/React Native apps due to:
- Free unlimited event logging
- Automatic integration with Google Play
- Built-in crash reporting (Crashlytics)
- Audience segmentation
- No additional SDK bloat

##### Installation

```bash
# Install Firebase packages
npx expo install @react-native-firebase/app
npx expo install @react-native-firebase/analytics
npx expo install @react-native-firebase/crashlytics
```

##### Configuration

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" → Name it "k9d8"
   - Enable Google Analytics
   - Accept terms and create project

2. **Register Android App:**
   - Click Android icon (</>)
   - Package name: `com.k9d8.app` (must match app.json)
   - App nickname: "k9d8 Android"
   - Download `google-services.json`
   - Place in project root

3. **Update `app.json`:**

```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ]
  }
}
```

4. **Add to `.env`:**

```bash
# Firebase configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_APP_ID=your_app_id
```

##### Implementation

Create `lib/analytics.ts`:

```typescript
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

export const Analytics = {
  // Screen tracking
  logScreenView: (screenName: string, screenClass?: string) => {
    analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  },

  // Custom events
  logEvent: (name: string, params?: Record<string, any>) => {
    analytics().logEvent(name, params);
  },

  // User properties
  setUserId: (userId: string) => {
    analytics().setUserId(userId);
    crashlytics().setUserId(userId);
  },

  setUserProperty: (name: string, value: string) => {
    analytics().setUserProperty(name, value);
  },

  // Error tracking
  logError: (error: Error, context?: string) => {
    crashlytics().recordError(error);
    if (context) {
      crashlytics().log(context);
    }
  },
};
```

##### Recommended Events to Track

| Event | Trigger | Parameters |
|-------|---------|------------|
| `screen_view` | Navigation to screen | `screen_name` |
| `sign_up` | Account creation | `method` (email, google, etc.) |
| `login` | User login | `method` |
| `check_in` | User checks in at park | `park_id`, `park_name` |
| `create_playdate` | Playdate created | `park_id`, `has_dogs` |
| `join_playdate` | User RSVPs to playdate | `playdate_id`, `source` |
| `add_dog` | Dog profile created | `breed`, `size` |
| `view_park` | Park details viewed | `park_id`, `source` (map, list) |
| `search_parks` | Search performed | `query_length`, `results_count` |
| `message_sent` | Chat message sent | `recipient_type` (friend, group) |
| `friend_added` | Friend connection made | `source` |

##### Usage Example

```typescript
import { Analytics } from '@/lib/analytics';

// In your check-in handler
async function handleCheckIn(park: Park) {
  Analytics.logEvent('check_in', {
    park_id: park.id,
    park_name: park.name,
    has_dogs: selectedDogs.length > 0,
  });
  
  // Perform check-in...
}

// In navigation
useEffect(() => {
  Analytics.logScreenView('ParkDetails', 'ParkDetailsScreen');
}, []);
```

##### Privacy & Compliance

- **Data Collection Disclosure:** Add to Play Store Data Safety form:
  - Data type: "App activity"
  - Collected: Yes
  - Shared: No
  - Purpose: Analytics, Personalization

- **Opt-out:** Provide setting in app:

```typescript
// Add to settings screen
const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

async function toggleAnalytics(enabled: boolean) {
  await analytics().setAnalyticsCollectionEnabled(enabled);
  setAnalyticsEnabled(enabled);
}
```

#### Alternative Analytics Options

| Service | Best For | Cost |
|---------|----------|------|
| **Amplitude** | Product analytics, funnels | Free tier: 10M events/month |
| **Mixpanel** | User behavior analysis | Free tier: 20M events/month |
| **PostHog** | Open-source, self-hosted | Free cloud tier |
| **Sentry** | Error tracking + performance | Free tier: 5k errors/month |

##### Amplitude Setup (Alternative)

```bash
npm install @amplitude/analytics-react-native
```

```typescript
import * as amplitude from '@amplitude/analytics-react-native';

amplitude.init('YOUR_API_KEY');

// Track events
amplitude.track('Check In', {
  parkId: park.id,
  parkName: park.name,
});
```

---

## Phase 2: Build Production App Bundle

### 2.1 Install EAS CLI

```bash
npm install -g eas-cli
```

### 2.2 Configure EAS

```bash
# Login to Expo
eas login

# Configure project
eas build:configure
```

This creates `eas.json`:

```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### 2.3 Build Production AAB

```bash
# Build Android App Bundle (for Play Store)
eas build --platform android --profile production

# Or build APK for testing
eas build --platform android --profile preview
```

**Expected output:** `.aab` file (Android App Bundle)

### 2.4 Alternative: Local Build

If not using EAS:

```bash
# Prebuild native code
npx expo prebuild --platform android

# Build release AAB
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Phase 3: Google Play Console Setup

### 3.1 Create Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Pay one-time $25 registration fee
3. Complete account verification (may take 48 hours)

### 3.2 Create New App

1. Click "Create app"
2. Enter:
   - App name: "k9d8"
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
3. Accept Developer Program Policies

### 3.3 Set Up App

Navigate through the dashboard and complete:

#### App Access
- [ ] Select "All functionality is available without special access"

#### Ads
- [ ] Select "No, my app does not contain ads" (or yes if applicable)

#### Content Ratings
1. Click "Start questionnaire"
2. Select category: "Social Networking"
3. Answer questions about:
   - Violence
   - Fear
   - Sexual content
   - Language
   - Drugs
   - Gambling
   - In-app purchases
4. Receive content rating (expected: Everyone or Teen)

#### Target Audience
- [ ] Select "18 and over" (if no age gate needed) or "13-15" (requires age gate)

#### News Apps
- [ ] Select "No" unless applicable

#### Data Safety
Complete data collection disclosure:

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Location | Yes | No | App functionality (find dog parks) |
| Personal info (name, email) | Yes | No | Account creation |
| Photos/Videos | Optional | No | User profiles, dog photos |
| App activity | Yes | No | Analytics, crash reporting |
| Device IDs | Yes | No | Push notifications |

- [ ] Link to Privacy Policy (required)

#### Privacy Policy

Create and host a privacy policy at `https://k9d8.app/privacy` or similar.

Required sections:
- Information we collect
- How we use information
- Data sharing
- User rights
- Contact information

---

## Phase 4: Store Listing

### 4.1 Main Store Listing

#### App Details

| Field | Value | Status |
|-------|-------|--------|
| App name | k9d8 | ☐ |
| Short description | Connect with dog owners, discover parks, arrange playdates | ☐ |
| Full description | See template below | ☐ |

**Full Description Template:**

```
k9d8 is the ultimate social network for dog owners. Connect with fellow dog lovers, discover nearby dog parks, and arrange playdates for your furry friends.

FEATURES:
🐕 Dog Profiles - Create profiles for your dogs with photos, breed, size, and temperament
🗺️ Park Discovery - Find dog parks near you with detailed amenity information
📍 Check-ins - See who's at the park right now
📅 Playdates - Schedule meetups with other dog owners
💬 Real-time Chat - Message other owners and coordinate meetups
🔔 Notifications - Get alerts when friends check in or invite you to playdates

PERFECT FOR:
• New dog owners looking to socialize their pets
• Finding the best dog parks in your area
• Meeting neighbors with similar dog breeds
• Coordinating group walks and play sessions

Download k9d8 today and join the community of dog lovers!

Privacy Policy: https://k9d8.app/privacy
Terms of Service: https://k9d8.app/terms
```

#### Graphics

Upload to Play Console:

- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 JPG/PNG)
- [ ] Phone screenshots (minimum 2, max 8)
  - Home/Map view
  - Dog profile
  - Park details
  - Playdate creation
  - Chat/Messaging
- [ ] 7-inch tablet screenshots (optional)
- [ ] 10-inch tablet screenshots (optional)
- [ ] Video preview (optional, 30 sec - 2 min)

### 4.2 Categorization

| Field | Selection |
|-------|-----------|
| Application type | Applications |
| Category | Lifestyle or Social |
| Tags | Dogs, Pets, Social, Lifestyle |

---

## Phase 5: Release Setup

### 5.1 Create Release

1. Navigate to "Production" > "Create new release"
2. Upload AAB file from Phase 2
3. Review dependencies and permissions

### 5.2 Review Permissions

The app will request these permissions (verify all are necessary):

```xml
<!-- From AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

- [ ] Document why each permission is needed
- [ ] Remove any unused permissions

### 5.3 Sign App (if not using Play App Signing)

If using EAS, this is handled automatically. For manual signing:

```bash
# Generate upload key (if not exists)
keytool -genkey -v -keystore k9d8-upload-key.keystore -alias k9d8 -keyalg RSA -keysize 2048 -validity 10000

# Sign AAB
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore k9d8-upload-key.keystore app-release.aab k9d8
```

**Important:** Back up keystore file - lost keystores cannot be recovered!

### 5.4 Testing Tracks (Optional but Recommended)

Before production, test via:

#### Internal Testing
- Up to 100 testers
- Immediate availability
- Add email addresses of team members

#### Closed Testing (Alpha)
- Larger test group
- Requires tester opt-in via link
- Gather feedback before public release

#### Open Testing (Beta)
- Public but labeled as beta
- Listed on Play Store
- Good for soft launch

---

## Phase 6: Pre-Launch Checklist

### Technical

- [ ] App runs without crashes on Android 10, 11, 12, 13, 14
- [ ] App handles offline scenarios gracefully
- [ ] Location services work correctly
- [ ] Push notifications deliver properly
- [ ] Deep links work (if implemented)
- [ ] App size is reasonable (< 100MB ideally)
- [ ] No debug code or console logs in production
- [ ] ProGuard/R8 obfuscation enabled (default with EAS)

### Content

- [ ] All placeholder text removed
- [ ] All images load correctly
- [ ] No test data in production database
- [ ] Supabase RLS policies are secure
- [ ] Mapbox token has appropriate restrictions

### Legal

- [ ] Privacy Policy published and linked
- [ ] Terms of Service published (if applicable)
- [ ] Data Safety form completed accurately
- [ ] Content rating questionnaire completed

### Store Listing

- [ ] Screenshots show current UI
- [ ] Screenshots don't contain placeholder data
- [ ] Feature graphic represents the app
- [ ] Description is accurate and compelling
- [ ] Contact email is monitored

---

## Phase 7: Launch

### 7.1 Submit for Review

1. In Play Console, click "Send for review" or "Start rollout to Production"
2. Google Play review typically takes 1-3 days
3. Monitor email for policy issues

### 7.2 Post-Launch

After approval:

- [ ] Download app from Play Store to verify
- [ ] Test core user flows
- [ ] Monitor crash reports (Firebase Crashlytics recommended)
- [ ] Monitor analytics
- [ ] Respond to user reviews
- [ ] Plan first update

---

## Phase 8: Post-Launch Updates

### Version Management

For each update:

1. Update `version` in `app.json` (e.g., "1.0.1")
2. Increment `android.versionCode` (e.g., 2)
3. Build new AAB: `eas build --platform android`
4. Upload to Play Console
5. Submit for review

### Update Types

| Update Type | Version Code | User Impact |
|-------------|--------------|-------------|
| Bug fix | +1 | Standard update |
| Feature | +1 | Standard update |
| Breaking change | +10 | Consider forced update |

---

## Quick Reference Commands

```bash
# Build production AAB
eas build --platform android --profile production

# Build APK for testing
eas build --platform android --profile preview

# Prebuild (if needed)
npx expo prebuild --platform android

# Clean build
cd android && ./gradlew clean

# Build release locally
cd android && ./gradlew bundleRelease
```

---

## Troubleshooting

### Build Failures

| Issue | Solution |
|-------|----------|
| "Unable to locate Java" | Install JDK 17, set JAVA_HOME |
| Mapbox download fails | Verify MAPBOX_DOWNLOAD_TOKEN in .env |
| Gradle out of memory | Add `org.gradle.jvmargs=-Xmx4096m` to gradle.properties |
| EAS build fails | Check `eas build:logs` for details |

### Play Store Rejections

| Rejection Reason | Solution |
|------------------|----------|
| Missing privacy policy | Add privacy policy URL |
| Location permission justification | Explain in app description and Data Safety |
| App crashes on launch | Test on physical device before submission |
| Misleading description | Ensure description matches app functionality |

---

## Resources

- [Expo Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)
- [Play Store Launch Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)
