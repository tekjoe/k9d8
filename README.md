# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

   **If scanning the QR code does nothing** (phone doesn’t load the app), the phone may not be able to reach your computer (different Wi‑Fi or firewall). Use tunnel mode so the QR code works from any network:

   ```bash
   npm run start:tunnel
   ```
   or `npx expo start --tunnel`. The first run may prompt to install `@expo/ngrok` if needed.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Android (emulator / device)

**If the build fails with "Unable to locate a Java Runtime":**  
Gradle needs a JDK. Install one (e.g. JDK 17) and set both `JAVA_HOME` and `PATH`.

- **macOS (Homebrew):**
  ```bash
  brew install openjdk@17
  ```
  Then add to `~/.zshrc` (Apple Silicon use `/opt/homebrew`; Intel use `/usr/local`):
  ```bash
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
  export PATH="$JAVA_HOME/bin:$PATH"
  ```
  Run `source ~/.zshrc` (or open a new terminal), then `npm run android` again.
- Or install [Android Studio](https://developer.android.com/studio); it bundles a JDK (often under `~/Library/Java/JavaVirtualMachines/` or Android Studio’s jbr). Set `JAVA_HOME` to that JDK’s `Contents/Home` and ensure it’s on `PATH`.

**If `npm run android` fails with "Failed to resolve the Android SDK path":**

1. **Install the Android SDK** (e.g. via [Android Studio](https://developer.android.com/studio)); the default install location on macOS is `~/Library/Android/sdk`.

2. **Set `ANDROID_HOME`** in your shell profile (e.g. `~/.zshrc`):

   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
   ```

3. Restart the terminal or run `source ~/.zshrc`, then run `npm run android` again.

If your SDK is installed elsewhere, set `ANDROID_HOME` to that directory instead.

## iOS + Mapbox (native map)

If `pod install` fails with **Error installing MapboxCommon** (e.g. `mapbox:YOUR_MAPBOX_SECRET_TOKEN`), the Mapbox **download token** is missing or invalid. It’s a separate token from the public map token.

1. Open [Mapbox Account → Access tokens](https://account.mapbox.com/access-tokens/).
2. Create a token with the **Downloads:Read** scope (or use the default secret token).
3. In the project root, add to `.env` (create it if needed):

   ```bash
   MAPBOX_DOWNLOAD_TOKEN=sk.eyJ1...
   EXPO_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...   # public token for map tiles (if not already set)
   ```

4. Run prebuild again: `npx expo prebuild --clean`, then `npx expo run:ios`.

Do not commit the download token; `.env` is gitignored.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
