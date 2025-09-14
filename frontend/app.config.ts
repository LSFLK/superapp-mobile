import "dotenv/config";
import type { ExpoConfig } from "expo/config";

/* Uncomment the lines below if you want to use Firebase for iOS or Android */
// import fs from "fs";
// import path from "path";

const profile =
  process.env.EAS_BUILD_PROFILE ??
  (process.env.NODE_ENV === "production" ? "production" : "development");

// Allow forks to build by providing defaults, while letting you override via env.
const APP_NAME = process.env.APP_NAME ?? "";
const APP_SCHEME = process.env.APP_SCHEME ?? "";
const APP_SLUG = process.env.APP_SLUG && process.env.APP_SLUG.length > 0 ? process.env.APP_SLUG : "";
const APP_OWNER = process.env.APP_OWNER ?? "";
const APP_VERSION = process.env.APP_VERSION ?? "1.0.0";
const BUNDLE_ID = process.env.BUNDLE_IDENTIFIER ?? "com.example";
const ANDROID_PACKAGE = process.env.ANDROID_PACKAGE ?? "com.manodya.wso2superappmobile";
// Google Sign-In without Firebase requires iosUrlScheme to start with "com.googleusercontent.apps.".
// Provide a safe fallback pattern; override via IOS_URL_SCHEME env for real builds.
const IOS_URL_SCHEME =
  process.env.IOS_URL_SCHEME && process.env.IOS_URL_SCHEME.startsWith("com.googleusercontent.apps.")
    ? process.env.IOS_URL_SCHEME
    : "com.googleusercontent.apps.placeholder";
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? ""; // Uncomment this if you use EAS

/* =============== Firebase Configuration ===============
 *
 * To enable Firebase services for your project, you need to:
 *
 * 1.  Obtain your `GoogleService-Info.plist` (for iOS) and `google-services.json` (for Android)
 *     from your Firebase project settings.
 *
 * 2.  You have two options for providing these files to the build process:
 *
 *     a) (Recommended) In your `.env` file, provide the base64-encoded content of these files
 *        to `FIREBASE_IOS_PLIST_B64` and `FIREBASE_ANDROID_JSON_B64`. The `package.json`
 *        has scripts to decode these at `npm install`. Instructions are provided in the
 *        `.env.example` file. This will benefit local development and CI/CD pipelines.
 *
 *     b) Place the files directly in a `google-services` directory at the root of your project
 *        You may need to create this directory)
 *
 * 3.  After setting up your files, uncomment lines immediately below this comment section
 *     and the corresponding `googleServicesFile` line(s) in the `ios` and/or `android` section(s) below.
 *
 * ======================================================= */

// const here = (...p: string[]) => path.resolve(__dirname, ...p);
// const fileIfExists = (p: string) => (fs.existsSync(p) ? p : undefined);
// const iosPlist = fileIfExists(here("google-services/GoogleService-Info.plist"));
// const androidJson = fileIfExists(here("google-services/google-services.json"));

const config: ExpoConfig = {
  name: APP_NAME,
  slug: APP_SLUG,
  scheme: APP_SCHEME,
  version: APP_VERSION,
  owner: APP_OWNER || "govsupapp",
  newArchEnabled: true,
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    requireFullScreen: true,
    bundleIdentifier: BUNDLE_ID,
    // googleServicesFile: iosPlist, // Uncomment this if you use Firebase for iOS
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ["remote-notification"],
    },
    entitlements: {
      "aps-environment":
        profile === "production" ? "production" : "development",
    },
    icon: {
      dark: "./assets/images/ios-light.png",
      light: "./assets/images/ios-light.png",
      tinted: "./assets/images/ios-tinted.png",
    },
  },
  android: {
    package: ANDROID_PACKAGE,
    // Note: manifestPlaceholders not part of ExpoConfig typings; library plugin will inject placeholder internally.
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: APP_SCHEME }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
    // googleServicesFile: androidJson, // Uncomment this if you use Firebase for Android
    permissions: [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
    ],
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#476481",
    },
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    [
      "@wavemaker/react-native-app-auth-expo-plugin",
      { redirectScheme: APP_SCHEME, enableUniversalLinks: false },
    ],
  // Inject manifest placeholder for appAuthRedirectScheme early.
  [require.resolve("./plugins/app-auth-placeholder.js")],
    [
      "expo-build-properties",
      { android: { compileSdkVersion: 35, targetSdkVersion: 35, minSdkVersion: 24 } },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#FFFFFF",
        image: "./assets/images/splash-icon.png",
        dark: {
          image: "./assets/images/splash-icon.png",
          backgroundColor: "#000000",
        },
        imageWidth: 200,
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone",
        recordAudioAndroid: true,
      },
    ],
    "expo-router",
    [
      "expo-secure-store",
      {
        configureAndroidBackup: true,
        faceIDPermission:
          "Allow $(PRODUCT_NAME) to access your Face ID biometric data.",
      },
    ],
    ["expo-screen-orientation", { initialOrientation: "DEFAULT" }],
    ["expo-font", { fonts: ["./assets/fonts/SpaceMono-Regular.ttf"] }],
    // Include Google Sign-In plugin only if a non-placeholder scheme provided; else skip to avoid validation error.
    ...(IOS_URL_SCHEME === "com.googleusercontent.apps.placeholder"
      ? []
      : ([
          [
            "@react-native-google-signin/google-signin",
            { iosUrlScheme: IOS_URL_SCHEME },
          ],
        ] as any)),
  ],
  experiments: { typedRoutes: true },
  extra: {
    router: { origin: false },
    ...(EAS_PROJECT_ID ? { eas: { projectId: EAS_PROJECT_ID } } : {}),
  },
  assetBundlePatterns: ["**/*"],
};

export default config;