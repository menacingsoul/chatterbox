import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import { getUserByToken } from "@/lib/auth";
import { logout } from "@/lib/auth";
import axios from "axios";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { MapPin, MailIcon, InfoIcon } from "lucide-react-native";
import { useUser } from "@/contexts/UserContext";
import { usePushToken } from '@/contexts/PushTokenContext';

const ProfileScreen = () => {
  const { user } = useUser(); 
  const [userData, setUserData] = useState(null); // State for user details from the backend
  const router = useRouter();
  const { clearPushToken } = usePushToken();

  const handleLogout = async () => {
    await clearPushToken();
    await logout(() => {
      router.replace("/(auth)/welcome"); // Redirect to welcome or login screen
    });
  };

  // Fetch user details from the backend
  useEffect(() => {
    if (user?.email) {
      const fetchUserData = async () => {
        try {
          const response = await axios.get(
            `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/userDetails`,
            { params: { email: user.email } }
          );
          setUserData(response.data);
          console.log("User data:", response.data);
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      };

      fetchUserData();
    }
  }, [user]);

  // Render loading state if data is not yet available
  if (!user || !userData) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="h-48 bg-gray-200 justify-center items-center">
          <Text className="text-indigo-500 text-4xl font-bold">#LetsChat</Text>
        </View>
        {/* Profile Info */}
        <View className="px-4 pb-4">
          {/* Avatar */}
          <View className="relative -mt-16 mb-4">
            <Image
              source={{ uri: userData?.image }}
              className="w-32 h-32 rounded-full border-4 border-white"
            />
          </View>

          {/* User Info */}
          <View className="mb-6 gap-2">
            <Text className="text-2xl font-bold">
              {userData?.firstName} {userData?.lastName}
            </Text>

            <View className="flex-row items-center">
              <View className="bg-indigo-100 p-2 rounded-full mr-4">
                <MailIcon size={24} color="#6366f1" />
              </View>
              <Text className=" text-lg font-medium">{userData.email}</Text>
            </View>

            <View className="flex-row items-center">
              <View className="bg-indigo-100 p-2 rounded-full mr-4">
                <InfoIcon size={24} color="#6366f1" />
              </View>
              <Text className=" text-lg font-medium">{userData.bio}</Text>
            </View>

            <View className="flex-row items-center">
              <View className="bg-indigo-100 p-2 rounded-full mr-4">
                <MapPin size={24} color="#6366f1" />
              </View>
              <Text className="text-lg font-medium">{userData.location}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-4 gap-1">
            <TouchableOpacity className="flex-1 bg-black py-3 rounded-full">
              <Text className="text-white text-center font-semibold">
                Edit Profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-1 bg-red-500 py-3 rounded-full"
            >
              <View className="flex-row items-center justify-center">
                <Text className="text-white text-center font-semibold mr-2">
                  Logout
                </Text>
                <MaterialIcons name="logout" size={18} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
