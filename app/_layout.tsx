import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL || '', {
  unsavedChangesWarning: false,
});

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>Please restart the app</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RootLayout() {
  if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Configuration Error</Text>
        <Text style={styles.errorText}>Convex URL not configured</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ConvexProvider client={convex}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              gestureEnabled: true,
            }}
          >
            <Stack.Screen
              name="resume/upload"
              options={{ title: 'Upload Resume', headerShown: false }}
            />
            <Stack.Screen
              name="interviews/schedule"
              options={{ title: 'Schedule Interview', headerShown: false }}
            />
            <Stack.Screen
              name="interviews/confirmation"
              options={{ title: 'Interview Confirmation', headerShown: false }}
            />
            <Stack.Screen
              name="interviews/shortlisted"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </ConvexProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
