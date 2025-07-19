import { Stack } from 'expo-router';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen name="dashboard/admin" />
        <Stack.Screen name="dashboard/hr" />
        <Stack.Screen name="jobs/create" />
        <Stack.Screen name="jobs/list" />
        <Stack.Screen name="candidates/upload" />
        <Stack.Screen name="candidates/list" />
        <Stack.Screen name="queries/create" />
        <Stack.Screen name="queries/[id]" />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="feedback/index" />
      </Stack>
    </ConvexProvider>
  );
}