import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import { useUser } from "@/contexts/UserContext";
import Loader from "@/components/Loader";
import { PlusIcon } from "lucide-react-native";

const AllChatsScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  console.log("backend: ", process.env.EXPO_PUBLIC_BACKEND_URL);
  console.log("user: ", user?.id || "User is null or undefined");

  const fetchChats = async () => {
    if (!user) {
      console.warn("User is not defined, skipping fetchChats");
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chats/getChats`,
        { params: { userId: user.id } }
      );
      setChats(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load chats");
      setLoading(false);
      console.error("Error fetching chats:", err);
    }
  };

  // Get other participant from the chat
  const getOtherParticipant = (participants) => {
    return participants.find((p) => p._id !== user.id) || participants[0];
  };
  

  const filteredChats = chats.filter((chat) => {
    const otherParticipant = getOtherParticipant(chat.participants);
    const fullName =
      `${otherParticipant.firstName} ${otherParticipant.lastName}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    return (
      fullName.includes(searchLower) ||
      (chat.lastMessage.message &&
        chat.lastMessage.message.toLowerCase().includes(searchLower))
    );
  });

  const renderChatItem = ({ item }) => {
    const otherParticipant = getOtherParticipant(item.participants);

    return (
      <TouchableOpacity
        className="flex-row items-center p-4 border-b border-gray-100"
        onPress={() => router.push(`/(root)/chat/${item._id}`)}
      >
        {/* Avatar with online indicator */}
        <View className="relative">
          <Image
            source={{ uri: otherParticipant.image }}
            className="w-14 h-14 rounded-full"
          />
        </View>

        {/* Chat details */}
        <View className="flex-1 ml-4">
          <View className="flex-row justify-between items-center">
            <Text className="font-semibold font-poppinssemibold text-lg">
              {`${otherParticipant.firstName} ${otherParticipant.lastName}`}
            </Text>
            <Text className="text-gray-500 text-sm font-inter">
              {new Date(item.lastMessage.timeStamp).toLocaleDateString()}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mt-1">
            <Text
              className="text-gray-600 flex-1 mr-4 font-inter"
              numberOfLines={1}
            >
              {item.lastMessage.message}
            </Text>
            {/* Add unread count here if you add it to your API */}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500 font-poppinsregular">{error}</Text>
        <TouchableOpacity
          className="mt-4 bg-indigo-500 px-4 py-2 rounded-full"
          onPress={fetchChats}
        >
          <Text className="text-white font-inter">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-interbold">Chats</Text>
          <View className="flex-row space-x-4">
            <TouchableOpacity>
              <Ionicons name="camera-outline" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="create-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
          <Ionicons name="search-outline" size={20} color="gray" />
          <TextInput
            className="flex-1 ml-2"
            placeholder="Search chats"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Chats List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item._id}
        className="flex-1"
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-10 right-6 bg-indigo-400 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push("/(root)/newConversation")}
      >
        <PlusIcon size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AllChatsScreen;
