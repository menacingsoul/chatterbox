import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useOAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useUser } from "@clerk/clerk-expo";
import logo from "../../assets/images/icon.png";

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Warm up the android browser to improve UX
    // https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

const SignInScreen = () => {
  const router = useRouter();

  useWarmUpBrowser();

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const onPress = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } =
        await startOAuthFlow({
          redirectUrl: Linking.createURL("/(auth)/register", {
            scheme: "chatterbox",
          }),
        });

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      } else {
        // Use signIn or signUp for next steps such as MFA
      }
    } catch (err) {
      console.error("OAuth error", err);
    }
  }, []);

  const user = useUser();
  console.log("user:", user);

  return (
    <View className="flex-1 items-center justify-center bg-white p-5">
      <Image source={logo} className="w-full h-[300px]" resizeMode="contain" />
      <Text
        className="text-3xl font-semibold font-poppins text-indigo-700 mb-2"
      >
        Welcome to ChatterBox
      </Text>
      <Text className="text-md font-inter text-gray-600 text-center mb-8">
        Connect with friends and chat in real-time!
      </Text>

      <TouchableOpacity
        className="flex flex-row items-center bg-black p-3 rounded-3xl mt-4"
        onPress={onPress}
      >
        <AntDesign name="google" size={24} color="white" />
        <Text className="text-white font-poppins text-lg font-semibold ml-2">
          Continue with Google
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignInScreen;
