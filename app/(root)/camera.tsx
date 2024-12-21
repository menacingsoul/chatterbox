import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CheckCheck, CheckIcon } from "lucide-react-native";

const ImagePickerScreen = () => {
  const [image, setImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const uploadToCloudinary = async () => {
    if (!image) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: image,
        type: "image/jpeg",
        name: "upload.jpg",
      });
      formData.append(
        "upload_preset",
        process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );

      const response = await fetch(
        process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET_URL,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Navigate back to chats screen with the Cloudinary URL
        router.push({
          pathname: "/(root)/chat",
          params: { imageUrl: data.secure_url },
        });
      } else {
        console.error("Upload failed:", data);
      }
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 p-4">
        {image ? (
          // Image preview
          <View className="flex-1">
            <Image source={{ uri: image }} className="flex-1 rounded-lg"/>
            <View className="flex-row justify-around items-center p-4 bg-white/90 absolute bottom-0 w-full rounded-t-lg">
              <TouchableOpacity
                onPress={() => setImage(null)}
                className="bg-red-500 p-4 rounded-full"
                disabled={isUploading}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>

              {isUploading ? (
                <View className="bg-indigo-500 p-4 rounded-full">
                  <ActivityIndicator color="white" />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={uploadToCloudinary}
                  className="bg-indigo-500 p-4 rounded-full"
                >
                  <CheckIcon size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          // Option buttons
          <View className="flex-1 justify-center">
            <TouchableOpacity
              onPress={takePhoto}
              className="bg-indigo-500 p-4 rounded-lg mb-4 flex-row items-center justify-center"
            >
              <Ionicons
                name="camera"
                size={24}
                color="white"
                className="mr-2"
              />
              <Text className="text-white text-lg ml-2 font-medium">
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickImage}
              className="bg-indigo-500 p-4 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="image" size={24} color="white" className="mr-2" />
              <Text className="text-white text-lg ml-2 font-medium">
                Choose from Gallery
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ImagePickerScreen;
