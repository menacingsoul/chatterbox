import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import axios from "axios";
import { useGlobalSearchParams, useRouter } from "expo-router";
import {
  Plus,
  MapPin,
  UsersRound,
  Clock,
  FileClock,
} from "lucide-react-native";
import ImageModalViewer from "@/components/ImageModalViewer";

const UserProfile = () => {
  const { id, friendshipStatus, userId } = useGlobalSearchParams();
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchOtherUserData = async () => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/viewUser`,
          { params: { id } }
        );
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchOtherUserData();
  }, [id]);

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-indigo-400 text-lg">Loading profile...</Text>
      </View>
    );
  }

  const handleFriendRequest = async () => {
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/friend/addFriend`,
        { userId: userId, friendId: id }
      );
    } catch (error) {
      console.error("Error handling friend request:", error);
    }
  };

  const handleButtonPress = () => {
    if (friendshipStatus === "Add Friend") {
      handleFriendRequest();
      console.log("Send Add Friend request");
    } else if (friendshipStatus === "View Request") {
      router.push(`/(root)/requests`);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header Section */}
      <View className="relative">
        <View className="h-56 bg-gradient-to-br from-indigo-200 to-indigo-300 absolute top-0 left-0 right-0" />
        <View className="items-center mt-24 px-6">
          <View className="bg-white rounded-2xl shadow-lg p-6 w-full">
            <View className="items-center -mt-20">
              <TouchableOpacity onPress={() => setImageModalVisible(true)}>
                <Image
                  source={{ uri: user?.image }}
                  className="w-36 h-36 rounded-full border-4 border-white shadow-md"
                />
              </TouchableOpacity>
              <ImageModalViewer
                visible={imageModalVisible}
                onClose={() => setImageModalVisible(false)}
                imageUri={user?.image}
              />
              <View className="mt-4 items-center">
                <Text className="text-2xl font-bold text-gray-800">
                  {user.firstName} {user.lastName}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* About Section */}
      <View className="px-6 mt-6">
        <View className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">About Me</Text>
          <Text className="text-gray-700 text-lg font-medium ">{user.bio}</Text>
        </View>

        {/* Contact Information */}
        <View className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">More</Text>
          <View className="flex-row items-center gap-1">
            <MapPin size={24} color="#6366f1" />
            <Text className="text-gray-700 text-lg font-medium">
              {user.location}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View className="flex-row space-x-4 mb-6">
          {friendshipStatus === "Add Friend" && (
            <TouchableOpacity
              className="flex-1 bg-indigo-500 py-4 rounded-xl flex-row items-center gap-2 justify-center"
              onPress={handleButtonPress}
            >
              <Text className="text-white font-bold mr-2">Add Friend</Text>
              <Plus size={20} color="white" />
            </TouchableOpacity>
          )}

          {friendshipStatus === "Pending" && (
            <TouchableOpacity
              className="flex-1 bg-gray-200 py-4 rounded-xl flex-row items-center gap-2 justify-center"
              disabled={true}
            >
              <Text className="text-gray-600 font-bold">Pending</Text>
              <Clock size={20} color="gray" />
            </TouchableOpacity>
          )}

          {friendshipStatus === "View Request" && (
            <TouchableOpacity
              className="flex-1 bg-black py-4 rounded-xl flex-row items-center gap-2 justify-center"
              onPress={handleButtonPress}
            >
              <Text className="text-white font-bold">View Request</Text>
              <FileClock size={20} color="white" />
            </TouchableOpacity>
          )}

          {friendshipStatus === "Friends" && (
            <TouchableOpacity
              className="flex-1 bg-indigo-300 py-4 rounded-xl flex-row items-center gap-2 justify-center"
              disabled={true}
            >
              <Text className="text-white font-bold">Friends</Text>
              <UsersRound size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default UserProfile;
