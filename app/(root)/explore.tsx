import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import { useUser } from "@/contexts/UserContext";

const ExploreScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const { user } = useUser();  // State for the decoded user
  const router = useRouter();

  // Fetch user info once on component mount
  
  // Fetch users from backend with friendship statuses
  const fetchUsers = async () => {
    if (!user) return; // Don't fetch users if user info is not available
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/getAllUsers`,
        { params: { email: user.email } }
      );
      setUsers(response.data);
      console.log("Users:", response.data);
      // Assuming response contains an array of users with friendship statuses
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]); // Trigger fetch when the user data changes

  // Send friend request or handle friendship based on current status
  const handleFriendRequest = async (userId) => {
    try {
      console.log("User ID:", user?.id);
      console.log("FriendID:", userId);
      await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/friend/addFriend`,
        { userId: user?.id, friendId: userId }
      );
      fetchUsers();
    } catch (error) {
      console.error("Error handling friend request:", error);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(
    (userItem) =>
      userItem.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userItem.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }) => (
    <View className="flex-row items-center p-4 border-b border-gray-100">
      <TouchableOpacity
        className="flex-row flex-1 items-center"
        onPress={() =>
          router.push({
            pathname: `/profile/${item._id}`,
            params: { friendshipStatus: item.friendshipStatus,userId:user.id },
          })
        }
      >
        <Image
          source={{ uri: item.image }}
          className="w-16 h-16 rounded-full"
        />
        <View className="flex-1 ml-4">
          <Text className="font-semibold text-lg">
            {item.firstName} {item.lastName}
          </Text>
          <Text className="text-gray-500">{item.email}</Text>
          <Text className="text-gray-600 text-sm mt-1" numberOfLines={1}>
            {item.about}
          </Text>
        </View>
      </TouchableOpacity>
  
      {item.friendshipStatus === "Add Friend" && (
        <TouchableOpacity
          className="px-4 py-2 rounded-full bg-indigo-400"
          onPress={() => handleFriendRequest(item._id, "Add Friend")}
        >
          <Text className="text-white">Add Friend</Text>
        </TouchableOpacity>
      )}
  
      {item.friendshipStatus === "Pending" && (
        <TouchableOpacity
          className="px-4 py-2 rounded-full bg-gray-200"
          disabled={true}
        >
          <Text className="text-gray-600">Pending</Text>
        </TouchableOpacity>
      )}
  
      {item.friendshipStatus === "View Request" && (
        <TouchableOpacity
          className="px-4 py-2 rounded-full bg-black"
          onPress={() => router.push(`/(root)/requests`)}
        >
          <Text className="text-white">View Request</Text>
        </TouchableOpacity>
      )}
  
      {item.friendshipStatus === "Friends" && (
        <TouchableOpacity
          className="px-4 py-2 rounded-full bg-gray-200"
          disabled={true}
        >
          <Text className="text-gray-600">Friends</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  // Show loading spinner or empty state when no user is available
  if (!user) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold mb-4">Explore</Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
          <Ionicons name="search-outline" size={20} color="gray" />
          <TextInput
            className="flex-1 ml-2"
            placeholder="Search users"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        className="flex-1"
      />
    </SafeAreaView>
  );
};

export default ExploreScreen;
