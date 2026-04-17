export default {
  expo: {
    name: "CAPS",
    slug: "caps-mobile",
    version: "1.0.0",
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
        "ACCESS_NETWORK_STATE"
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
      API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://100.91.44.24:8000',
      AI_SERVICE_URL: process.env.EXPO_PUBLIC_AI_SERVICE_URL || 'http://100.91.44.24:8001',
      router: {
        origin: false
      }
    }
  }
};
