import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        // Add small delay to ensure navigation works properly
        setTimeout(() => {
          if (user.role === 'admin') {
            router.replace('/dashboard/admin');
          } else if (user.role === 'hr') {
            router.replace('/dashboard/hr');
          } else {
            router.replace('/'); // Default fallback
          }
        }, 100);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/Slrd.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Employee Hiring System</Text>
        <Text style={styles.subtitle}>
          Streamline your recruitment process with our modern hiring platform
        </Text>

        <View style={styles.features}>
          {[
            { icon: '👥', label: 'Candidate Management' },
            { icon: '💼', label: 'Job Posting' },
            { icon: '🎯', label: 'Smart Matching' },
            { icon: '📊', label: 'Analytics Dashboard' },
          ].map((f, i) => (
            <View style={styles.feature} key={i}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/auth/signup')}>
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: (width * 0.4) / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    width: '70%',
    height: '70%',
    borderRadius: (width * 0.4 * 0.7) / 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 40,
    lineHeight: 22,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
    width: '100%',
  },
  feature: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIcon: {
    fontSize: 30,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    paddingHorizontal: 16,
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonText: {
    color: '#3b82f6',
    fontSize: 18,
    fontWeight: '600',
  },
});
