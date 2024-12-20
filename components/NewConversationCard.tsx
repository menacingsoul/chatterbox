import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from "react-native";
import { Trash2, Eye } from "lucide-react-native";
import { useState } from "react";

const NewConversationCard = ({
  firstName,
  lastName,
  imageUri = "https://ui-avatars.com/api/?name=" + firstName + "+" + lastName,
  onChat,
}) => {
  return (
    <View className="bg-white rounded-2xl shadow-md p-4 mb-4 flex-row items-center border border-gray-100">
      {/* Profile Image with Gradient Border */}
      <View className="mr-4 p-1 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500">
        <Image
          source={{ uri: imageUri }}
          className="w-16 h-16 rounded-full border-2 border-white"
        />
      </View>

      {/* Name and Details Container */}
      <View className="flex-1 pr-2">
        <Text className="text-gray-900 text-lg mb-1 font-inter">
          {firstName} {lastName}
        </Text>
      </View>

      {/* Action Buttons Container */}
      <View className="flex-row gap-2">
        {/* View Profile Button */}
        <TouchableOpacity
          onPress={onChat}
          className="bg-indigo-300 p-2 px-4  rounded-xl"
        >
          <Text className=" font-interbold">Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NewConversationCard;
