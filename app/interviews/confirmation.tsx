import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function InterviewConfirmation() {
  const router = useRouter();
  const { interviewId } = useLocalSearchParams<{
    interviewId: Id<'interviews'>;
  }>();

  const safeBack = (router: ReturnType<typeof useRouter>) => {
    try {
      router.back();
    } catch {
      router.replace('/dashboard/hr');
    }
  };

  const [meetingLink, setMeetingLink] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const confirmInterview = useMutation(api.candidate.confirmInterviewByHR);
  const interview = useQuery(
    api.candidate.getInterviewById,
    interviewId ? { interviewId } : 'skip'
  );

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'hr' && parsedUser.role !== 'admin') {
          Alert.alert('Access Denied', 'You do not have permission to confirm interviews');
          safeBack(router);
          return;
        }
        setCurrentUser(parsedUser);
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/auth/login');
    }
  };

  const handleConfirmInterview = async () => {
    if (!interviewId || !currentUser) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    setIsLoading(true);
    try {
      await confirmInterview({
        interviewId: interviewId,
        confirmedBy: currentUser._id as Id<'users'>,
        meetingLink: meetingLink || undefined,
        additionalNotes: additionalNotes || undefined,
      });

      Alert.alert('Success', 'Interview confirmed successfully! The candidate will be notified.', [
        {
          text: 'OK',
          onPress: () => router.push('/dashboard/hr'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm interview');
      console.error('Confirm interview error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!interview || !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => safeBack(router)}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Interview</Text>
      </View>

      {/* Interview Details */}
      <View style={styles.interviewCard}>
        <Text style={styles.sectionTitle}>Interview Details</Text>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={20} color="#6B7280" />
          <Text style={styles.detailText}>{interview.candidateName || 'Candidate'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="briefcase" size={20} color="#6B7280" />
          <Text style={styles.detailText}>{interview.jobTitle || 'Job Position'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={20} color="#6B7280" />
          <Text style={styles.detailText}>
            {interview.scheduledDate
              ? new Date(interview.scheduledDate).toLocaleDateString()
              : 'Date not set'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={20} color="#6B7280" />
          <Text style={styles.detailText}>{interview.scheduledTime || 'Time not set'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-circle" size={20} color="#6B7280" />
          <Text style={styles.detailText}>
            Interviewer: {interview.interviewerName || 'Not specified'}
          </Text>
        </View>
        {interview.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{interview.notes}</Text>
          </View>
        )}
      </View>

      {/* Confirmation Form */}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>HR Confirmation</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Meeting Link</Text>
          <TextInput
            style={styles.input}
            value={meetingLink}
            onChangeText={setMeetingLink}
            placeholder="https://zoom.us/j/... or Teams link"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            placeholder="Any additional instructions or notes for the candidate"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, isLoading && styles.disabledButton]}
        onPress={handleConfirmInterview}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>Confirm Interview</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => safeBack(router)}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  interviewCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  notesSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  confirmButton: {
    backgroundColor: '#10B981',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    margin: 16,
    marginTop: 0,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
