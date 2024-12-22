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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useUser } from "@/contexts/UserContext";
import { useGlobalSearchParams, useRouter } from "expo-router";
import CryptoJS from "react-native-crypto-js";
import { SendHorizonalIcon, Camera } from "lucide-react-native";
import EmojiSelector from "react-native-emoji-selector";
import Loader from "@/components/Loader";
import * as ImagePicker from "expo-image-picker";
import ChatImageModalViewer from "@/components/ChatImageModalViewer";
import socket from "@/lib/socket";

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
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [friendOnlineStatus, setFriendOnlineStatus] = useState("Offline");

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
    socket.emit("join", { userId: currentUser.id, chatId: id });

    const handleMessage = (data) => {
      if (data.chatId === id) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
      }
    };

    const handleUserTyping = (data) => {
      if (data.chatId === id && data.userId !== currentUser.id) {
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.chatId === id && data.userId !== currentUser.id) {
        setIsTyping(false);
      }
    };

    const handleUserOnline = (data) => {
      if (data.userId === friend?._id) {
        setFriendOnlineStatus("Online");
      }
    };

    const handleUserOffline = (data) => {
      if (data.userId === friend?._id) {
        setFriendOnlineStatus("Offline");
      }
    };

    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);
    socket.on("message", handleMessage);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    return () => {
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
      socket.off("message", handleMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
    };
  }, [id, currentUser.id, friend]);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chats/getChatById`,
          { params: { chatId: id } }
        );
        const decryptedMessages = response.data.messages.map((msg) => ({
          ...msg,
          message: decryptMessage(msg.message),
        }));
        setMessages(decryptedMessages);
        const friendData = response.data.participants.find(
          (p) => p._id !== currentUser.id
        );
        setFriend(friendData);
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

  const pickImage = async () => {
    try {
      // Request permissions
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert("You need to enable permission to access the photo library.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        await uploadImageToCloudinary(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert("Error selecting image. Please try again.");
    }
  };

  const uploadImageToCloudinary = async (imageUri) => {
    try {
      // Create form data
      const formData = new FormData();
      const filename = imageUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append("file", {
        uri: imageUri,
        name: filename,
        type,
      });

      formData.append(
        "upload_preset",
        process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      ); // Replace with your upload preset
      formData.append("folder", `chat_images/${id}`); // Using chat ID as folder name

      // Upload to Cloudinary
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET_URL}`, // Replace with your cloud name
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        await sendImageMessage(data.secure_url);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    }
  };

  const sendMessage = async () => {
    if (message.trim().length === 0) return;
    setIsSending(true);

    try {
      const encryptedMessage = await encryptMessage(message);
      const newMessage = {
        chatId: id,
        senderId: currentUser.id,
        messageType: "text",
        message: encryptedMessage,
        timeStamp: new Date(),
      };

      await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chats/sendMessage`,
        newMessage
      );

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          ...newMessage,
          senderId: { _id: currentUser.id },
          message,
        },
      ]);
      setMessage("");
      setShowEmoji(false);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };
  const handleTyping = () => {
    socket.emit("typing", { chatId: id, userId: currentUser.id });
  };

  const handleStopTyping = () => {
    socket.emit("stopTyping", { chatId: id, userId: currentUser.id });
  };

  const sendImageMessage = async (imageUrl) => {
    setIsSending(true);

    try {
      const newMessage = {
        chatId: id,
        senderId: currentUser.id,
        messageType: "image",
        message: await encryptMessage("Sent an image"),
        imageUrl: imageUrl,
        timeStamp: new Date(),
      };

      await axios.post(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/chats/sendMessage`,
        newMessage
      );

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          ...newMessage,
          senderId: { _id: currentUser.id },
          message: "Sent an image",
        },
      ]);
    } catch (error) {
      console.error("Error sending image message:", error);
      alert("Error sending image. Please try again.");
    } finally {
      setIsSending(false);
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
              onPress={() => router.push("/(root)/chat")}
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
                <Text className="text-sm text-indigo-500">
                  {isTyping ? "Typing..." : friendOnlineStatus}
                </Text>
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
          <TouchableOpacity onPress={pickImage} className="mr-3">
            <Camera size={24} color="#6366F1" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={sendMessage}
            className="bg-indigo-500 rounded-full p-2.5 shadow-sm"
            disabled={message.trim().length === 0}
          >
            {isSending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <SendHorizonalIcon size={26} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
