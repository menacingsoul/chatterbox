import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EmojiSelector from "react-native-emoji-selector";

const ChatScreen = ({ id }) => {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Hey there! 👋",
      sender: "them",
      timestamp: "09:41 AM",
    },
    {
      id: "2",
      text: "Hi! How are you?",
      sender: "me",
      timestamp: "09:42 AM",
    },
    {
      id: "3",
      text: "I'm doing great, thanks! 😊",
      sender: "them",
      timestamp: "09:43 AM",
    },
  ]);

  const sendMessage = () => {
    if (message.trim().length > 0) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          text: message,
          sender: "me",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setMessage("");
    }
  };

  const renderMessage = ({ item }) => (
    <SafeAreaView
      className={`flex-row ${item.sender === "me" ? "justify-end" : "justify-start"} mb-2 mx-4`}
    >
      <View
        className={`rounded-2xl px-4 py-2 max-w-[80%] 
          ${item.sender === "me" ? "bg-indigo-400" : "bg-gray-200"}`}
      >
        <Text
          className={`${item.sender === "me" ? "text-white" : "text-black"}`}
        >
          {item.text}
        </Text>
        <Text
          className={`text-xs mt-1 
            ${item.sender === "me" ? "text-indigo-100" : "text-gray-500"}`}
        >
          {item.timestamp}
        </Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <SafeAreaView className="bg-indigo-300 w-full flex-row items-center justify-between border-b border-gray-200 mx-auto  py-4 px-6">
        <View className="flex-row items-center">
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="ml-3">
            <Text className="text-xl font-semibold text-white">John Doe</Text>
            <Text className="text-md text-indigo-100">Online</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="white" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        className="flex-1 mt-2"
        inverted={false}
      />

      {/* Emoji Selector */}
      {showEmoji && (
        <View className="h-64">
          <EmojiSelector
            onEmojiSelected={(emoji) => {
              setMessage((prevMessage) => prevMessage + emoji);
            }}
            showSearchBar={false}
            columns={8}
          />
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View className="flex-row items-center p-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => setShowEmoji(!showEmoji)}
            className="mr-2"
          >
            <Ionicons name="happy-outline" size={24} color="black" />
          </TouchableOpacity>
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            className="bg-indigo-400 rounded-full p-2"
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;