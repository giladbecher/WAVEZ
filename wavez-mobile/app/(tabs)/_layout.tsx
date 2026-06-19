import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

function TabLayout() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <View style={styles.mainContent}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="terms" options={{ headerShown: false }} />
        </Stack>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  mainContent: {
    flex: 1,
  },
});

export default TabLayout;
