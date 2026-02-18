# iOS App Store Launch Plan

## Overview

This document outlines the complete process for launching the k9d8 app on the Apple App Store.

**App Type:** React Native (Expo) app with native modules (Mapbox)  
**Bundle ID:** `com.anonymous.k9d8` (to be updated)  
**Current Version:** 1.0.0  
**Minimum iOS Version:** iOS 15.0 (recommended)

---

## Phase 1: Apple Developer Program Enrollment

### 1.1 Join Apple Developer Program

**Cost:** $99 USD per year  
**Enrollment:** [developer.apple.com](https://developer.apple.com/programs/)

**Requirements:**
- Apple ID with two-factor authentication enabled
- Legal entity status (Individual or Organization)
- D-U-N-S Number (for organizations)
- Valid credit card for payment

**Enrollment Steps:**
1. Go to [Apple Developer Program](https://developer.apple.com/programs/enroll/)
2. Sign in with Apple ID
3. Choose entity type:
   - **Individual:** Use your personal name in App Store
   - **Organization:** Use company name (requires D-U-N-S verification)
4. Complete purchase ($99/year)
5. Wait for approval (24-48 hours for individuals, longer for organizations)

**Important Notes:**
- Enrollment can take several days for organizations (D-U-N-S verification)
- Membership must be renewed annually to keep app in store
- Use same Apple ID for all developer activities

### 1.2 Set Up Developer Account

After enrollment, complete these tasks:

#### Accept Agreements
- [ ] Accept Apple Developer Program License Agreement
- [ ] Accept Paid Apps Agreement (if offering in-app purchases)

#### Add Team Members (if Organization)
- [ ] Go to [App Store Connect > Users and Access](https://appstoreconnect.apple.com/access/users)
- [ ] Invite team members with appropriate roles:
  - **Admin:** Full access
  - **App Manager:** Manage specific apps
  - **Developer:** Upload builds, manage testers
  - **Marketing:** Manage store listing
  - **Customer Support:** Respond to reviews

#### Enable Two-Factor Authentication
- [ ] Ensure all team members have 2FA enabled on their Apple ID
- [ ] Set up app-specific passwords for CI/CD if needed

---

## Phase 2: App Store Connect Setup

### 2.1 Create New App

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click "Apps" → "+" → "New App"
3. Enter:
   | Field | Value |
   |-------|-------|
   | Platform | iOS |
   | Name | k9d8 (must be unique worldwide) |
   | Primary Language | English (U.S.) |
   | Bundle ID | com.k9d8.app (from app.json) |
   | SKU | k9d8-001 (internal identifier) |
   | User Access | Full Access |

**Bundle ID Notes:**
- Must match exactly what's in `app.json`
- Cannot be changed after creation
- Format: `com.companyname.appname`

### 2.2 App Information

Navigate to App Information and configure:

#### General Information
- [ ] **Subtitle:** Brief tagline (max 30 characters)
  - Example: "Connect with dog owners"
- [ ] **Content Rights:** Confirm you own or have rights to all content
- [ ] **Age Rating:** Complete questionnaire

#### Age Rating Questionnaire

Answer honestly about app content:

| Category | Likely Answer for k9d8 |
|----------|------------------------|
| Unrestricted Web Access | No |
| Gambling | No |
| Contests | No (unless you add sweepstakes) |
| Profanity/Crude Humor | No |
| Mature/Suggestive Themes | No |
| Horror/Fear | No |
| Medical/Treatment Info | No |
| Alcohol/Tobacco/Drugs | No |
| Simulated Gambling | No |
| Sexual Content/Nudity | No |
| Graphic Violence | No |
| Prolonged Graphic Violence | No |

**Expected Rating:** 4+ (Everyone) or 12+ (if user-generated content)

#### Pricing and Availability

- [ ] **Price:** Free or set price
- [ ] **Availability:** Select countries/regions
  - Start with: United States, Canada, UK, Australia
  - Expand to: EU countries, Japan, etc.
- [ ] **Pre-orders:** Optional (build anticipation)
- [ ] **Educational Discount:** Enable if applicable

#### App Privacy

Complete App Privacy section (see Phase 5 for details):
- [ ] Privacy Policy URL (required)
- [ ] Data collection disclosures
- [ ] Privacy nutrition labels

---

## Phase 3: Required Assets

### 3.1 App Icon

**Required Sizes:**

| Size | Usage | Format |
|------|-------|--------|
| 1024×1024 | App Store | PNG |
| 180×180 | iPhone Home Screen | PNG |
| 120×120 | iPhone Spotlight | PNG |
| 167×167 | iPad Home Screen | PNG |
| 152×152 | iPad Spotlight | PNG |

**Guidelines:**
- Square corners (iOS rounds them automatically)
- No transparency
- No iOS-style gloss or rounded corners
- Simple, recognizable design
- Test in both light and dark modes

**Expo Configuration:**
```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "ios": {
      "icon": "./assets/images/ios-icon.png"
    }
  }
}
```

### 3.2 Screenshots

**Required for iPhone:**
- 6.7" Display (iPhone 14 Pro Max, 15 Pro Max): 1290×2796
- 6.5" Display (iPhone 14 Plus, 13 Pro Max): 1284×2778
- 5.5" Display (iPhone 8 Plus, SE): 1242×2208

**Required for iPad (if supporting):**
- 12.9" Display (iPad Pro): 2048×2732
- 11" Display (iPad Pro, Air): 1668×2388

**Screenshot Guidelines:**
- Minimum: 2 screenshots, Maximum: 10 per device size
- No status bars showing carrier info (use Simulator or Xcode to capture)
- Show actual app content (no mockups)
- No excessive text overlays
- Localize screenshots for each language

**Recommended Screenshot Flow:**
1. Map view showing nearby dog parks
2. Dog profile with photos and details
3. Check-in at a park
4. Playdate creation screen
5. Messaging/chat interface
6. User profile and settings

### 3.3 App Preview Video (Optional)

**Specifications:**
- Length: 15-30 seconds
- Resolution: Same as screenshots for each device size
- Format: MOV, M4V, MP4 (H.264 codec)
- Max file size: 500MB
- No device frames or hands interacting

**Best Practices:**
- Show 3-5 key features
- Use screen capture (QuickTime, Xcode, or iOS Simulator)
- Add captions for accessibility
- Create separate versions for each device size

### 3.4 Text Assets

**App Name:**
- Max 30 characters
- Must be unique (search App Store first)
- Example: "k9d8 - Dog Parks & Playdates"

**Subtitle:**
- Max 30 characters
- Appears below name in App Store
- Example: "Connect with local dog owners"

**Promotional Text:**
- Max 170 characters
- Can be updated without new release
- Example: "New! Schedule playdates and chat with other dog owners."

**Description:**
- Max 4000 characters
- Structure with short paragraphs
- Include key features
- End with contact/support info

**Keywords:**
- Max 100 characters total
- Separate by commas, no spaces after commas
- No duplicate words
- No competitor names
- No trademarked terms

**Example Keywords:**
```
dog,park,pet,social,meetup,walk,playdate,canine,owner,location,map,friends,community
```

**Support URL:**
- Required
- Can be simple help page
- Example: `https://k9d8.app/support`

**Marketing URL (Optional):**
- Example: `https://k9d8.app`

---

## Phase 4: Technical Configuration

### 4.1 Update app.json

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
      "bundleIdentifier": "com.k9d8.app",
      "buildNumber": "1.0.0.1",
      "infoPlist": {
        "UIBackgroundModes": [
          "location",
          "fetch",
          "remote-notification"
        ],
        "NSLocationWhenInUseUsageDescription": "k9d8 uses your location to show nearby dog parks and allow check-ins.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "k9d8 uses your location to notify you when friends are at nearby parks.",
        "NSCameraUsageDescription": "k9d8 uses your camera to take photos of your dogs for their profiles.",
        "NSPhotoLibraryUsageDescription": "k9d8 accesses your photos to add pictures to dog profiles.",
        "NSUserNotificationUsageDescription": "k9d8 sends notifications for messages, playdate invites, and friend activity."
      }
    }
  }
}
```

### 4.2 Required Permissions (InfoPlist)

**Location Services:**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>k9d8 uses your location to show nearby dog parks and allow check-ins.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>k9d8 uses your location to notify you when friends are at nearby parks.</string>
```

**Camera & Photos:**
```xml
<key>NSCameraUsageDescription</key>
<string>k9d8 uses your camera to take photos of your dogs for their profiles.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>k9d8 accesses your photos to add pictures to dog profiles.</string>
```

**Notifications:**
```xml
<key>NSUserNotificationUsageDescription</key>
<string>k9d8 sends notifications for messages, playdate invites, and friend activity.</string>
```

**Critical:** All permission descriptions must clearly explain WHY the permission is needed. Vague descriptions will result in rejection.

### 4.3 App Capabilities

Enable required capabilities in [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list):

1. Go to Certificates, Identifiers & Profiles
2. Select App ID for k9d8
3. Enable capabilities:

| Capability | Purpose | Required? |
|------------|---------|-----------|
| Push Notifications | Send alerts | Yes |
| Background Modes | Location updates | Yes |
| Sign in with Apple | Authentication | Recommended |
| iCloud | Data sync | Optional |
| Maps | Map features | Yes (enabled by default) |

### 4.4 Certificates and Provisioning

**Using EAS Build (Recommended):**
EAS handles this automatically:
```bash
eas build --platform ios
```

**Manual Setup (if needed):**
1. **Development Certificate:**
   - Create CSR (Certificate Signing Request)
   - Generate iOS Development certificate
   - Download and install

2. **Distribution Certificate:**
   - Generate iOS Distribution certificate
   - Download and install

3. **Provisioning Profiles:**
   - Development profile (for testing)
   - App Store profile (for submission)

**Important:** Keep certificates secure and backed up. Lost certificates cannot be recovered.

---

## Phase 5: Privacy Requirements

### 5.1 Privacy Policy

**Required:** Yes, for all apps

**Must Include:**
- What data is collected
- How data is used
- Data sharing practices
- User rights
- Contact information

**Location:** Host at `https://k9d8.app/privacy` and link in App Store Connect

### 5.2 App Privacy (Nutrition Labels)

Complete in App Store Connect under App Privacy:

**Step 1: Data Collection**

Select all data types collected:

| Data Type | k9d8 Likely Collects |
|-----------|---------------------|
| Contact Info | ✅ Email, Name |
| Health & Fitness | ❌ |
| Financial Info | ❌ (unless selling) |
| Location | ✅ Precise, Coarse |
| Sensitive Info | ❌ |
| Contacts | ❌ (unless importing) |
| User Content | ✅ Photos, Messages |
| Browsing History | ❌ |
| Search History | ✅ (app search) |
| Identifiers | ✅ Device ID, User ID |
| Purchases | ✅ (if in-app purchases) |
| Usage Data | ✅ Product interaction |
| Diagnostics | ✅ Crash data, Performance |

**Step 2: Data Usage**

For each data type, specify usage:

| Data Type | Uses |
|-----------|------|
| Location | App functionality, Analytics |
| Contact Info | App functionality, Account management |
| User Content | App functionality |
| Identifiers | Analytics, App functionality |

**Step 3: Data Linked to User**

Mark which data is linked to user identity:
- Email: Yes
- Device ID: Yes
- Location: Yes
- Photos: Yes
- Crash logs: No (if anonymized)

**Step 4: Tracking**

Does the app track users across other companies' apps/websites?
- **Likely Answer:** No (unless using certain advertising SDKs)

**Step 5: Privacy Policy URL**
- Enter: `https://k9d8.app/privacy`

### 5.3 Privacy Manifest (iOS 17+)

Starting with iOS 17, Apple requires a Privacy Manifest file.

**For Expo projects:**
This is typically handled by Expo and third-party SDKs.

**Checklist:**
- [ ] Verify all third-party SDKs include privacy manifests
- [ ] List all "required reason APIs" used
- [ ] Document tracking domains

**Common Required Reason APIs for k9d8:**
- File timestamp APIs (caching)
- Disk space APIs (storage management)
- System boot time APIs (session management)

---

## Phase 6: Build and Submission

### 6.1 Build Production IPA

Using EAS (Recommended):

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
 eas login

# Configure project
eas build:configure

# Build for App Store
eas build --platform ios --profile production
```

**eas.json configuration:**
```json
{
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release",
        "enterpriseProvisioning": "adhoc"
      }
    }
  }
}
```

### 6.2 Upload to App Store Connect

**Option A: EAS Submit (Recommended)**
```bash
eas submit --platform ios
```

**Option B: Transporter App**
1. Download [Transporter](https://apps.apple.com/us/app/transporter/id1450874784) from Mac App Store
2. Drag built IPA file to Transporter
3. Click Deliver

**Option C: Xcode**
1. Open project in Xcode: `npx expo run:ios`
2. Product → Archive
3. Distribute App → App Store Connect

### 6.3 Create New Version

1. In App Store Connect, go to k9d8 app
2. Click "+" next to iOS App
3. Enter version number (must match app.json version)
4. Complete:
   - What's New in This Release
   - Store listing information
   - Upload screenshots
   - Select build

### 6.4 App Review Information

Provide for Apple reviewers:

| Field | Guidance | Example |
|-------|----------|---------|
| Sign-in credentials | Test account credentials | Email: test@k9d8.app / Password: TestPass123 |
| Contact info | Person Apple can contact | Your email and phone |
| Notes | Special setup instructions | "Enable location permissions to see nearby parks. Create a dog profile to access all features." |
| Attachment | Screenshots or video (optional) | Helpful if complex features |

**Important:**
- Create a dedicated test account
- Ensure test account has data populated (dog profiles, sample check-ins)
- Test that all features work with the provided credentials

### 6.5 Submit for Review

1. Review all information for accuracy
2. Click "Add for Review"
3. Confirm submission

**Review Timeline:**
- 50% reviewed within 24 hours
- 90% reviewed within 48 hours
- Can expedite for critical bug fixes (limited use)

---

## Phase 7: App Review Guidelines Compliance

### 7.1 Safety Guidelines

**User-Generated Content:**
- Implement content filtering/reporting
- Have moderation policy
- Respond to objectionable content reports

**k9d8 actions:**
- [ ] Add "Report User" functionality
- [ ] Add "Block User" functionality
- [ ] Implement content moderation guidelines
- [ ] Provide in-app mechanism to report inappropriate content

**Privacy:**
- [ ] Only request permissions when needed
- [ ] Provide clear purpose strings
- [ ] Don't access unnecessary data

### 7.2 Performance Guidelines

**App Completeness:**
- [ ] No placeholder content
- [ ] All features functional
- [ ] No broken links
- [ ] No beta/alpha labels (unless using TestFlight)

**Accurate Metadata:**
- [ ] App name matches branding
- [ ] Screenshots show actual app
- [ ] Description is accurate
- [ ] Keywords are relevant

**Hardware Compatibility:**
- [ ] Works on supported devices
- [ ] Handles interruptions (calls, notifications)
- [ ] No excessive battery drain
- [ ] No excessive heat generation

### 7.3 Business Guidelines

**Payments:**
- [ ] Use In-App Purchase for digital goods/services
- [ ] Don't direct users to external payment methods
- [ ] Disclose subscription terms clearly

**Advertising:**
- [ ] Ads must not be excessive
- [ ] Must not interfere with app usage
- [ ] Must comply with advertising guidelines

### 7.4 Design Guidelines

**Apple Design Principles:**
- [ ] Respect platform conventions
- [ ] Use standard iOS UI components
- [ ] Support Dark Mode
- [ ] Support Dynamic Type (accessibility)
- [ ] Use SF Symbols or custom icons appropriately

**Expo/React Native considerations:**
- [ ] Use `react-native-safe-area-context` for notches
- [ ] Test on various screen sizes
- [ ] Support both portrait orientations if applicable

---

## Phase 8: Common Rejection Reasons & Solutions

### 8.1 Metadata Issues

| Rejection | Cause | Solution |
|-----------|-------|----------|
| Incomplete Information | Missing privacy policy URL | Add privacy policy link |
| Misleading Content | Screenshots don't match app | Update screenshots |
| Keyword Stuffing | Excessive keywords | Remove redundant keywords |
| Inappropriate Content | Adult content in screenshots | Remove or censor content |

### 8.2 Functionality Issues

| Rejection | Cause | Solution |
|-----------|-------|----------|
| Crashes on Launch | Build issue | Test on physical device, check crash logs |
| Broken Functionality | Features don't work | Thorough testing before submission |
| Login Issues | Test credentials don't work | Verify test account, provide clear instructions |
| Placeholder Content | Lorem ipsum text | Replace with real content |

### 8.3 Permission Issues

| Rejection | Cause | Solution |
|-----------|-------|----------|
| Missing Purpose String | No InfoPlist description | Add clear usage descriptions |
| Vague Purpose String | "App needs location" | Be specific: "To show nearby dog parks" |
| Unnecessary Permission | Requesting unused permissions | Remove unused permission requests |
| Background Location | Not justified | Explain specific use case or remove |

### 8.4 Payment Issues

| Rejection | Cause | Solution |
|-----------|-------|----------|
| External Purchase Link | Linking to external payment | Remove or use In-App Purchase |
| Missing Restore | No restore purchases button | Add restore functionality |
| Unclear Pricing | Subscription terms hidden | Disclose terms prominently |

### 8.5 Content Issues

| Rejection | Cause | Solution |
|-----------|-------|----------|
| Objectionable Content | User-generated inappropriate content | Add moderation/reporting tools |
| Copyright Infringement | Using protected content | Remove or obtain licenses |
| Impersonation | Copying other apps/brands | Differentiate branding |

---

## Phase 9: Post-Launch

### 9.1 Responding to Reviews

- [ ] Monitor App Store reviews daily
- [ ] Respond to negative reviews constructively
- [ ] Thank users for positive reviews
- [ ] Use feedback for improvement

### 9.2 Analytics and Monitoring

- [ ] Set up App Store Connect Analytics
- [ ] Monitor crash reports (Firebase/Crashlytics)
- [ ] Track key metrics:
  - Downloads
  - Active users
  - Retention rates
  - Average session duration
  - In-app purchase conversion

### 9.3 Updates

**For Each Update:**
1. Increment version in `app.json`
2. Update "What's New" text
3. Build new version: `eas build --platform ios`
4. Upload to App Store Connect
5. Submit for review (typically faster for updates)

**Expedited Review:**
Request for critical bug fixes:
- Go to [App Store Connect > Contact Us](https://appstoreconnect.apple.com/contact)
- Select "Request Expedited Review"
- Explain critical nature
- Limited to true emergencies

### 9.4 App Store Optimization (ASO)

**Continuous Improvements:**
- [ ] A/B test screenshots
- [ ] Update keywords based on performance
- [ ] Refresh promotional text for new features
- [ ] Localize for new markets
- [ ] Encourage positive reviews (in-app prompts at right moments)

---

## Quick Reference Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for App Store
eas build --platform ios --profile production

# Build for TestFlight testing
eas build --platform ios --profile preview

# Submit to App Store
eas submit --platform ios

# Run locally on device
npx expo run:ios --device

# Prebuild native code
npx expo prebuild --platform ios
```

---

## Resources

### Apple Documentation
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

### Expo Documentation
- [Expo iOS Build](https://docs.expo.dev/build/setup/)
- [Submitting to App Store](https://docs.expo.dev/submit/introduction/)
- [iOS Specifics](https://docs.expo.dev/build-reference/ios/)

### Tools
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Apple Developer Portal](https://developer.apple.com/account/)
- [Transporter App](https://apps.apple.com/us/app/transporter/id1450874784)

---

## Checklist Summary

### Pre-Development
- [ ] Join Apple Developer Program ($99/year)
- [ ] Accept all agreements
- [ ] Set up team members (if applicable)

### App Configuration
- [ ] Update bundle ID in app.json
- [ ] Add all required InfoPlist permissions
- [ ] Enable necessary capabilities
- [ ] Create privacy policy page

### Store Assets
- [ ] Create app icon (1024×1024)
- [ ] Capture screenshots for all device sizes
- [ ] Write app description and keywords
- [ ] Prepare support URL

### Build and Submit
- [ ] Build production IPA via EAS
- [ ] Upload to App Store Connect
- [ ] Complete App Privacy nutrition labels
- [ ] Fill in App Review Information
- [ ] Submit for review

### Post-Launch
- [ ] Monitor review status
- [ ] Respond to user reviews
- [ ] Track analytics
- [ ] Plan updates
