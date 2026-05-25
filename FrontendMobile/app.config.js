const { version: APP_VERSION } = require('../Backend - Deployment/version.json');
const EAS_PROJECT_ID = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "2994a893-8549-4bf1-bf1a-d665c49f1c2f";

const androidVersionCodeFromVersion = (version) => {
  const [major = 0, minor = 0, patch = 0] = version
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);

  return major * 10000 + minor * 100 + patch;
};

const ANDROID_VERSION_CODE =
  Number.parseInt(process.env.EXPO_PUBLIC_ANDROID_VERSION_CODE || '', 10) ||
  androidVersionCodeFromVersion(APP_VERSION);

if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(EAS_PROJECT_ID)) {
  throw new Error('EXPO_PUBLIC_EAS_PROJECT_ID must be the Expo EAS project UUID, not the Firebase project ID');
}

export default {
  expo: {
    name: "CAPS",
    slug: "caps-mobile",
    version: APP_VERSION,
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "caps",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FE6902"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.caps.mobile",
      infoPlist: {
        NSFaceIDUsageDescription: "Use Face ID to quickly and securely sign in to CAPS."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FE6902"
      },
      package: "com.caps.mobile",
      versionCode: ANDROID_VERSION_CODE,
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "POST_NOTIFICATIONS",
        "VIBRATE",
        "android.permission.REQUEST_INSTALL_PACKAGES"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      "expo-localization",
      "expo-web-browser",
      "expo-local-authentication",
      "expo-notifications",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon.png",
          backgroundColor: "#FE6902",
          resizeMode: "contain"
        }
      ]
    ],
    extra: {
      eas: {
        projectId: EAS_PROJECT_ID
      },
      API_URL: process.env.EXPO_PUBLIC_API_URL,
      AI_SERVICE_URL: process.env.EXPO_PUBLIC_AI_SERVICE_URL,
      router: {
        origin: false
      }
    }
  }
};

// Fail immediately on startup if required env vars are missing
if (!process.env.EXPO_PUBLIC_API_URL || !process.env.EXPO_PUBLIC_AI_SERVICE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL and EXPO_PUBLIC_AI_SERVICE_URL are required. Set them in .env');
}
