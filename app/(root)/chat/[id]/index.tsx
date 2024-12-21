import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useUser } from "@/contexts/UserContext";
import { useGlobalSearchParams, useRouter } from "expo-router";
import CryptoJS from "react-native-crypto-js";
import { SendHorizonalIcon } from "lucide-react-native";
import EmojiSelector from "react-native-emoji-selector";
import Loader from "@/components/Loader";
import ChatImageModalViewer from "@/components/ChatImageModalViewer";

const ChatScreen = () => {
  const { id } = useGlobalSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const currentUser = user;
  const [message, setMessage] = useState("");
  const [friend, setFriend] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsImageModalVisible(false);
    setSelectedImage(null);
  };

  const SECRET_KEY = process.env.EXPO_PUBLIC_SECRET_KEY;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        setShowEmoji(false);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const decryptMessage = (encryptedMessage) => {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chats/getChatById`,
          { params: { chatId: id } }
        );

        const decryptedMessages = response.data.messages.map((msg) => ({
          ...msg,
          message: decryptMessage(msg.message), // Decrypt the message
        }));

        setMessages(decryptedMessages);
        setFriend(
          response.data.participants.find((p) => p._id !== currentUser.id)
        );
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching chat:", error);
        setIsLoading(false);
      }
    };

    fetchChat();
  }, [id]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleEmojiSelect = (emoji) => {
    setMessage((prevMessage) => prevMessage + emoji);
  };

  const toggleEmojiPicker = () => {
    Keyboard.dismiss();
    setShowEmoji(!showEmoji);
  };

  const encryptMessage = async (message) => {
    return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
  };

  const sendMessage = async () => {
    if (message.trim().length === 0) return;
    console.log("Sending message:", message);

    const encryptedMessage = await encryptMessage(message);
    console.log("Encrypted message:", encryptedMessage);

    const newMessage = {
      chatId: id,
      senderId: currentUser.id,
      messageType: "text",
      message: encryptedMessage,
      timeStamp: new Date(),
    };

    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chats/sendMessage`,
        newMessage
      );
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          ...newMessage,
          senderId: { _id: currentUser.id },
          message, // Display decrypted message in the UI
        },
      ]);
      setMessage("");
      setShowEmoji(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.senderId._id === currentUser.id;

    return (
      <View
        className={`flex-row ${
          isCurrentUser ? "justify-end" : "justify-start"
        } mb-3 mx-4`}
      >
        {!isCurrentUser && (
          <Image
            source={{ uri: friend?.image }}
            className="w-8 h-8 rounded-full mr-2 self-end mb-1"
          />
        )}
        <View
          className={`rounded-2xl px-4 py-3 max-w-[75%] 
            ${isCurrentUser ? "bg-indigo-500 rounded-tr-none" : "bg-gray-100 rounded-tl-none"}`}
        >
          {item.messageType === "image" && item.imageUrl ? (
            <View>
              <TouchableOpacity
                onPress={() => handleImagePress(item.imageUrl)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  className="w-64 h-64 rounded-lg"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          ) : (
            <Text
              className={`${
                isCurrentUser
                  ? "text-white font-inter text-[15px]"
                  : "text-gray-800 font-inter text-[15px]"
              }`}
            >
              {item.message}
            </Text>
          )}
          <Text
            className={`text-xs mt-1 
              ${
                isCurrentUser
                  ? "text-indigo-100 font-poppinssemibold"
                  : "text-gray-500 font-poppinssemibold"
              }`}
          >
            {new Date(item.timeStamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white w-full border-b border-gray-100 shadow-sm">
        <View className="flex-row items-center justify-between py-4 px-4">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 -ml-2"
            >
              <Ionicons name="chevron-back" size={24} color="#6366F1" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/(root)/profile/${friend._id}`)}
              className="flex-row items-center flex-1 ml-2"
            >
              <Image
                source={{ uri: friend?.image }}
                className="w-10 h-10 rounded-full border-2 border-indigo-100"
              />
              <View className="ml-3 flex-1">
                <Text className="text-lg font-semibold text-gray-900">
                  {friend?.firstName} {friend?.lastName}
                </Text>
                <Text className="text-sm text-indigo-500">Online</Text>
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="p-2">
            <Ionicons name="ellipsis-horizontal" size={24} color="#6366F1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      <ChatImageModalViewer
        visible={isImageModalVisible}
        onClose={handleCloseModal}
        imageUri={selectedImage}
      />

      {/* Input Area with Emoji Picker */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {showEmoji && !keyboardVisible && (
          <View style={{ height: 320 }}>
            <EmojiSelector
              onEmojiSelected={handleEmojiSelect}
              showSearchBar={false}
              showTabs={false}
              emojiSize={16} // Ensure font size is positive
            />
          </View>
        )}

        <View className="flex-row items-center p-4 bg-white border-t border-gray-100">
          <TouchableOpacity onPress={toggleEmojiPicker} className="mr-3">
            <Ionicons
              name={showEmoji ? "close-outline" : "happy-outline"}
              size={24}
              color="#6366F1"
            />
          </TouchableOpacity>
          <TextInput
            className="flex-1 bg-gray-50 rounded-full px-4 py-2 mr-3 border border-gray-200"
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            onFocus={() => setShowEmoji(false)}
            multiline
            minHeight={45}
            maxHeight={100}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            onPress={sendMessage}
            className="bg-indigo-500 rounded-full p-2.5 shadow-sm"
            disabled={message.trim().length === 0}
          >
            <SendHorizonalIcon size={26} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
