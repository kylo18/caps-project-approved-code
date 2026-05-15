const EAS_PROJECT_ID = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "2994a893-8549-4bf1-bf1a-d665c49f1c2f";

if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(EAS_PROJECT_ID)) {
  throw new Error('EXPO_PUBLIC_EAS_PROJECT_ID must be the Expo EAS project UUID, not the Firebase project ID');
}

export default {
  expo: {
    name: "CAPS",
    slug: "caps-mobile",
    version: "1.0.1",
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
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "POST_NOTIFICATIONS",
        "VIBRATE"
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
