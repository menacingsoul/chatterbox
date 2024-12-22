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
import { useSocket } from "@/contexts/SocketContext";

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
  const [isOnline, setIsOnline] = useState(false);
  const [onlineFriends, setOnlineFriends] = useState(new Set());
  const { socket, isConnected } = useSocket();
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [friendTyping, setFriendTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

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

  useEffect(() => {
    if (!socket || !id || !currentUser?.id) return;

    const setupSocket = () => {
      // Join chat room
      socket.emit("join", { userId: currentUser.id, chatId: id });
      setSocketConnected(true);

      // Listen for new messages
      socket.on("message", ({ chatId, newMessage }) => {
        if (chatId === id) {
          setMessages((prev) => [
            ...prev,
            {
              ...newMessage,
              message: decryptMessage(newMessage.message),
            },
          ]);
        }
      });

      socket.on("userOnline", ({ userId }) => {
        if (userId === friend?._id) {
          setIsOnline(true);
        }
        setOnlineFriends((prev) => new Set([...prev, userId]));
      });

      socket.on("userOffline", ({ userId }) => {
        if (userId === friend?._id) {
          setIsOnline(false);
        }
        setOnlineFriends((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      socket.on("onlineFriends", ({ friendIds }) => {
        setOnlineFriends(new Set(friendIds));
        if (friend?._id) {
          console.log("friendIds", friendIds);
          setIsOnline(friendIds.includes(friend._id));
        }
      });

      // Listen for typing status
      socket.on("userTyping", ({ chatId, userId }) => {
        if (chatId === id && userId !== currentUser.id) {
          setFriendTyping(true);
        }
      });

      socket.on("userStoppedTyping", ({ chatId, userId }) => {
        if (chatId === id && userId !== currentUser.id) {
          setFriendTyping(false);
        }
      });

      // Listen for connection status
      socket.on("connect", () => {
        setSocketConnected(true);
      });

      socket.on("disconnect", () => {
        setSocketConnected(false);
      });

      socket.emit("requestOnlineStatus", { friendId: friend?._id });
    };

    setupSocket();

    // Cleanup function
    return () => {
      if (socket) {
        socket.off("message");
        socket.off("userTyping");
        socket.off("userStoppedTyping");
        socket.off("userOnline");
        socket.off("userOffline");
        socket.off("onlineFriends");
        socket.off("connect");
        socket.off("disconnect");
      }
    };
  }, [socket, id, currentUser?.id]);

  useEffect(() => {
    if (!socket || !id || !currentUser?.id || !messages.length) return;

    // Mark messages as seen when they're received
    const unseenMessages = messages.filter(
      (msg) => !msg.seen && msg.senderId._id !== currentUser.id
    );

    if (unseenMessages.length > 0) {
      unseenMessages.forEach((msg) => {
        socket.emit("messageSeen", {
          chatId: id,
          messageId: msg._id,
          seenBy: currentUser.id,
        });
      });
    }
  }, [messages, socket, id, currentUser?.id]);

  const safeEmit = (eventName, data) => {
    if (socket && socketConnected) {
      socket.emit(eventName, data);
      return true;
    }
    console.warn("Socket not connected, message queued");
    return false;
  };

  const sendMessage = async () => {
    if (message.trim().length === 0) return;
    if (!socketConnected) {
      alert("Connection lost. Please try again.");
      return;
    }

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

      const sent = safeEmit("sendMessage", newMessage);

      if (sent) {
        setMessage("");
        setShowEmoji(false);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const sendImageMessage = async (imageUrl) => {
    if (!socketConnected) {
      alert("Connection lost. Please try again.");
      return;
    }

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

      const sent = safeEmit("sendMessage", newMessage);

      if (sent) {
        console.log("Image sent successfully");
      }
    } catch (error) {
      console.error("Error sending image message:", error);
      alert("Error sending image. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Modified typing handler with safety checks
  const handleTyping = () => {
    if (!socketConnected) return;

    if (!isTyping) {
      setIsTyping(true);
      safeEmit("typing", { chatId: id, userId: currentUser.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      safeEmit("stopTyping", { chatId: id, userId: currentUser.id });
    }, 1500);
  };
  
  console.log("isOnline", isOnline); 

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
          {isCurrentUser && (
            <View className="flex-row items-center ml-1">
              {item.seen ? (
                <View className="flex-row">
                  <Image
                    source={{ uri: friend?.image }}
                    className="w-3 h-3 rounded-full"
                  />
                </View>
              ) : (
                <Ionicons
                  name="checkmark-done"
                  size={16}
                  color="rgba(255, 255, 255, 0.7)"
                />
              )}
            </View>
          )}
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
              <View className="relative">
              <Image
                source={{ uri: friend?.image }}
                className="w-10 h-10 rounded-full border-2 border-indigo-100"
              />
              {isOnline && (
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </View>

              <View className="ml-3 flex-1">
                <Text className="text-lg font-poppinssemibold text-gray-900">
                  {friend?.firstName} {friend?.lastName}
                </Text>
                {friendTyping && (
                  <View className="pb-1">
                    <Text className="text-sm font-intermedium">
                      Typing...
                    </Text>
                    
                  </View>
                )}
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
            className="flex-1 bg-gray-50 rounded-full px-4 py-2 mr-3 border font-inter border-gray-200"
            placeholder={
              socketConnected ? "Type a message..." : "Connecting..."
            }
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              handleTyping();
            }}
            onFocus={() => setShowEmoji(false)}
            multiline
            minHeight={45}
            maxHeight={100}
            placeholderTextColor="#9CA3AF"
            editable={socketConnected}
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
