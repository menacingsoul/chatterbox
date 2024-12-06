import React, { useEffect } from "react";
import { useRouter, usePathname } from "expo-router";
import { View, TouchableOpacity, Text, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FontAwesome, Ionicons, Feather } from "@expo/vector-icons";
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { UserProvider } from "@/contexts/UserContext";
import { PushTokenProvider } from "@/contexts/PushTokenContext";
import ChatterBoxHeader from "@/components/AppHeader";

const TabBar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    {
      name: "chat",
      iconComponent: MaterialCommunityIcons,
      icon: "message-outline",
      label: "Messages",
    },
    {
      name: "explore",
      iconComponent: Ionicons,
      icon: "compass-outline",
      label: "Explore",
    },
    {
      name: "requests",
      iconComponent: FontAwesome,
      icon: "bell-o",
      label: "Requests",
    },
    { name: "profile", iconComponent: Feather, icon: "user", label: "Profile" },
  ];

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          height: 64,
        }}
      >
        {tabs.map((tab) => {
          const isActive = pathname === `/${tab.name}`;
          const Icon = tab.iconComponent;

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => router.push(`/${tab.name}`)}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                name={tab.icon}
                size={26} // Consistent icon size across all tabs
                color={isActive ? "#818cf8" : "#6b7280"}
              />
              <Text
                style={{
                  fontSize: 12,
                  marginTop: 4,
                  color: isActive ? "#818cf8" : "#6b7280",
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const Layout = () => {
  const pathname = usePathname();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <UserProvider>
      <PushTokenProvider>
        <View style={{ flex: 1 }}>
          <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

          {!pathname.includes("chat/") && <ChatterBoxHeader />}

          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="messages" options={{ headerShown: false }} />
            <Stack.Screen name="explore" options={{ headerShown: false }} />
            <Stack.Screen name="requests" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
          </Stack>

          {!pathname.includes("chat/") && <TabBar />}
        </View>
      </PushTokenProvider>
    </UserProvider>
  );
};

export default Layout;
