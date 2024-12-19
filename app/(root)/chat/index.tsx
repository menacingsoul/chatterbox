import React, { useState } from "react";
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

const AllChatsScreen = async () => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const chats = [
    {
      id: "1",
      name: "John Doe",
      lastMessage: "Hey, how are you doing?",
      time: "09:41 AM",
      unreadCount: 2,
      avatar: "https://via.placeholder.com/50",
      online: true,
    },
    {
      id: "2",
      name: "Sarah Smith",
      lastMessage: "The meeting is scheduled for tomorrow",
      time: "Yesterday",
      unreadCount: 0,
      avatar: "https://via.placeholder.com/50",
      online: false,
    },
    {
      id: "3",
      name: "Dev Team",
      lastMessage: "Mike: The new update is ready for testing 🚀",
      time: "Yesterday",
      unreadCount: 5,
      avatar: "https://via.placeholder.com/50",
      online: true,
    },
    {
      id: "4",
      name: "Alice Johnson",
      lastMessage: "Thanks for your help!",
      time: "Mon",
      unreadCount: 0,
      avatar: "https://via.placeholder.com/50",
      online: false,
    },
  ];

  const filteredChats = chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 border-b border-gray-100"
      onPress={() => router.push(`/(root)/chat/${item.id}`)}
    >
      {/* Avatar with online indicator */}
      <View className="relative">
        <Image
          source={{ uri: item.avatar }}
          className="w-14 h-14 rounded-full"
        />
        {item.online && (
          <View className="absolute right-0 bottom-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </View>

      {/* Chat details */}
      <View className="flex-1 ml-4">
        <View className="flex-row justify-between items-center">
          <Text className="font-semibold text-lg">{item.name}</Text>
          <Text className="text-gray-500 text-sm">{item.time}</Text>
        </View>

        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-gray-600 flex-1 mr-4" numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View className="bg-indigo-400 rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
              <Text className="text-white text-xs">{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold">Chats</Text>
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
        keyExtractor={(item) => item.id}
        className="flex-1"
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-indigo-400 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push("(root)/new-chat")}
      >
        <Ionicons name="chatbubble-outline" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
 
};

export default AllChatsScreen;
