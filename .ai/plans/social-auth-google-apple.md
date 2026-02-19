# Add Google Sign-In and Apple Sign-In

## Context

k9d8 currently only supports email/password authentication via Supabase. Adding Google and Apple sign-in will reduce friction for new users and provide faster login for returning users. Both providers need to work across all three platforms (iOS, Android, Web).

## Prerequisites (Manual — Supabase Dashboard & Developer Consoles)

These must be done before the code changes will work:

1. **Google Cloud Console** — Create 3 OAuth 2.0 Client IDs:
   - **Web** client → Add `https://xsbvvyvjqhacdchfmjjr.supabase.co/auth/v1/callback` as redirect URI
   - **iOS** client → Bundle ID: `com.k9d8.app`
   - **Android** client → Package: `com.k9d8.app`, SHA-1 from signing key (`eas credentials`)

2. **Apple Developer Portal**:
   - Enable "Sign in with Apple" capability on App ID `com.k9d8.app`
   - Create a Services ID (e.g. `com.k9d8.app.web`) with redirect `https://xsbvvyvjqhacdchfmjjr.supabase.co/auth/v1/callback`
   - Create a Sign in with Apple private key (note Key ID + Team ID)

3. **Supabase Dashboard → Authentication → Providers**:
   - Enable **Google** with Web Client ID + Secret
   - Enable **Apple** with Services ID, Secret Key, Team ID, Key ID
   - Under Settings, enable **"Automatically link accounts with same email"**

4. **Environment Variables** — Add to `.env` and EAS secrets:
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web client id>
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<ios client id>
   ```

## Install Dependencies

```bash
npx expo install expo-apple-authentication expo-crypto
npm install @react-native-google-signin/google-signin
```

`expo-web-browser` is already installed.

## Code Changes

### 1. `app.json` — Add native plugins

- Add `"usesAppleSignIn": true` to `expo.ios`
- Add plugins: `"expo-apple-authentication"` and `["@react-native-google-signin/google-signin", { "iosUrlScheme": "<reversed-ios-client-id>" }]`

### 2. `src/lib/supabase.ts` — Platform-conditional URL detection

Change `detectSessionInUrl: false` → `detectSessionInUrl: Platform.OS === 'web'`

This is required for the web OAuth redirect flow to capture session tokens from the URL hash. Import `Platform` from `react-native`.

### 3. `src/services/auth.ts` — Add social auth functions

Add two new exported functions with platform-specific implementations:

**`signInWithGoogle()`**
- **Native (iOS/Android):** Use `@react-native-google-signin/google-signin` to get an `idToken`, then call `supabase.auth.signInWithIdToken({ provider: 'google', token })`.
- **Web:** Use `supabase.auth.signInWithOAuth({ provider: 'google' })` which redirects the browser.

**`signInWithApple()`**
- **iOS:** Use `expo-apple-authentication` + `expo-crypto` for nonce hashing. Get `identityToken`, then call `supabase.auth.signInWithIdToken({ provider: 'apple', token, nonce })`. Capture the user's name (Apple only provides it on first sign-in) and sync to profiles table.
- **Android:** Use `expo-web-browser` to open Supabase's Apple OAuth flow, then capture the redirect tokens.
- **Web:** Use `supabase.auth.signInWithOAuth({ provider: 'apple' })`.

Configure Google Sign-In at module level (outside of functions) for native platforms only.

### 4. `src/components/auth/SocialAuthButtons.tsx` — New shared component

Create a reusable component with:
- Google button (white background, border, Google icon)
- Apple button (black background, Apple icon)
- "or" divider line below buttons
- Loading states and error handling
- `mode` prop (`'sign-in'` | `'sign-up'`) for button text
- On native success, navigate to `/(tabs)`. On web, the OAuth redirect handles it.
- Gracefully handle user cancellation (no error shown)

### 5. `app/(auth)/sign-in.tsx` — Add social buttons

Import `SocialAuthButtons` and render with `mode="sign-in"`:
- **Desktop layout:** Insert between "Sign in to continue" subtitle (line 206) and error block (line 208)
- **Mobile layout:** Insert between the header block (line 359) and error block (line 361)

### 6. `app/(auth)/sign-up.tsx` — Add social buttons

Same pattern as sign-in, with `mode="sign-up"`. Add a small terms note: "By continuing, you agree to the Terms of Service and Privacy Policy."

### 7. `src/providers/AuthProvider.tsx` — Clean up OAuth URL hash on web

After session is captured on web, remove the `#access_token=...` fragment from the URL bar using `window.history.replaceState()`. This prevents token leakage via browser history/screenshots.

## Account Linking

With Supabase's "Automatically link accounts with same email" enabled:
- User signs up with email, later signs in with Google (same email) → same account
- User signs up with Google, later signs in with Apple (same email) → same account
- No code changes needed for this — it's handled by Supabase automatically
- The existing `handle_new_user()` trigger won't fire for linked identities (correct behavior since the profile already exists)

## Files Summary

| File | Action |
|------|--------|
| `app.json` | Modify — add plugins + `usesAppleSignIn` |
| `src/lib/supabase.ts` | Modify — platform-conditional `detectSessionInUrl` |
| `src/services/auth.ts` | Modify — add `signInWithGoogle`, `signInWithApple` |
| `src/components/auth/SocialAuthButtons.tsx` | **Create** — shared social auth buttons |
| `app/(auth)/sign-in.tsx` | Modify — render `SocialAuthButtons` |
| `app/(auth)/sign-up.tsx` | Modify — render `SocialAuthButtons` |
| `src/providers/AuthProvider.tsx` | Modify — URL hash cleanup on web |

## Verification

1. **Web** (`npx expo start --web`): Click "Sign in with Google" → Google consent → redirected back with session. Same for Apple. Verify URL hash is cleaned up.
2. **iOS** (EAS dev build): Apple shows native sheet. Google shows native picker. Both return to tabs.
3. **Android** (EAS dev build): Google shows native picker. Apple opens web browser flow.
4. **Account linking**: Sign up with email, sign out, sign in with Google using same email → same account (same dogs, friends, etc.)
5. **Cancellation**: Dismiss Google/Apple dialogs → no error shown, stays on sign-in screen.
