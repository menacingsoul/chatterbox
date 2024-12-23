import { channel } from "expo-updates";

export default {
  expo: {
    name: "chatterbox",
    slug: "chatterbox",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "chatterbox",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "cover",
      backgroundColor: "#000000",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.menacing_soul.chatterbox",
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ||
        "./android/app/google-services.json",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-camera",
      "expo-secure-store",
      "expo-notifications",
    ],
    experiments: {
      typedRoutes: true,
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },
    updates: {
      url: "https://u.expo.dev/e546d9ae-0ad5-423f-a5b0-82718b8dd6e9",
    },
    build: {
      development: {
        developmentClient: true,
        distribution: "internal",
        channel: "development",
      },
      preview: {
        distribution: "internal",
        android: {
          buildType: "apk",
        },
        channel: "preview",
      },
      production: {
        distribution: "internal",
        channel: "production",
      },
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "e546d9ae-0ad5-423f-a5b0-82718b8dd6e9",
      },
    },
    owner: "menacing_soul",
  },
};
