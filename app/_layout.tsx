import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexProvider client={convex}>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
          }} 
        />
      </ConvexProvider>
    </GestureHandlerRootView>
  );
}
