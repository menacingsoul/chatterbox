import React from 'react';
import { Text, View} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChatterBoxHeader = () => {
  return (
    <SafeAreaView>
      {/* Manually adjust status bar */}
      <View className="w-full mx-auto flex justify-start items-center py-4 px-6 bg-white">
        <Text className="text-2xl font-bold text-indigo-400">ChatterBox</Text>
      </View>
    </SafeAreaView>
  );
};

export default ChatterBoxHeader;