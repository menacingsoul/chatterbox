import { Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function Register() {
  const router = useRouter();

  

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <Text className="text-purple-500 text-4xl">ChatterBox</Text>
      <TouchableOpacity
        className="bg-black p-2 mt-2 rounded-xl"
        
      >
        <Text className="text-white">Click here to go to welcome screen</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
