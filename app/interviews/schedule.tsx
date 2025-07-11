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

export default function ScheduleInterview() {
  const router = useRouter();
  const { candidateId, jobId } = useLocalSearchParams<{
    candidateId: Id<'users'>;
    jobId: Id<'jobs'>;
  }>();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewerEmail, setInterviewerEmail] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const scheduleInterview = useMutation(api.candidate.scheduleInterviewForCandidate);
  const candidateProfile = useQuery(
    api.candidate.getCandidateProfile,
    candidateId ? { userId: candidateId } : 'skip'
  );
  const job = useQuery(api.jobs.getJobById, jobId ? { jobId } : 'skip');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin') {
          Alert.alert('Access Denied', 'Only admins can schedule interviews');
          router.back();
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

  const handleScheduleInterview = async () => {
    if (!selectedDate || !selectedTime || !interviewerName || !interviewerEmail) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'User information not found');
      return;
    }

    setIsLoading(true);
    try {
      const scheduledDate = new Date(`${selectedDate}T${selectedTime}`).getTime();

      await scheduleInterview({
        candidateId: candidateId!,
        jobId: jobId!,
        scheduledDate,
        scheduledTime: selectedTime,
        interviewerName,
        interviewerEmail,
        meetingLink: meetingLink || undefined,
        notes: notes || undefined,
        scheduledBy: currentUser._id as Id<'users'>,
      });

      Alert.alert(
        'Success',
        'Interview scheduled successfully! HR will be notified for confirmation.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/dashboard/admin'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule interview');
      console.error('Schedule interview error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!candidateProfile || !job || !currentUser) {
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Interview</Text>
      </View>

      {/* Candidate Info */}
      <View style={styles.candidateCard}>
        <Text style={styles.sectionTitle}>Candidate Information</Text>
        <View style={styles.candidateInfo}>
          <Text style={styles.candidateName}>
            {candidateProfile.firstName} {candidateProfile.lastName}
          </Text>
          <Text style={styles.candidateEmail}>{candidateProfile.email}</Text>
          <Text style={styles.jobTitle}>Position: {job.title}</Text>
          <Text style={styles.department}>Department: {job.department}</Text>
        </View>
      </View>

      {/* Interview Details Form */}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Interview Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Interview Date *</Text>
          <TextInput
            style={styles.input}
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Interview Time *</Text>
          <TextInput
            style={styles.input}
            value={selectedTime}
            onChangeText={setSelectedTime}
            placeholder="HH:MM (24-hour format)"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Interviewer Name *</Text>
          <TextInput
            style={styles.input}
            value={interviewerName}
            onChangeText={setInterviewerName}
            placeholder="Enter interviewer name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Interviewer Email *</Text>
          <TextInput
            style={styles.input}
            value={interviewerEmail}
            onChangeText={setInterviewerEmail}
            placeholder="interviewer@company.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Meeting Link (Optional)</Text>
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
          <Text style={styles.label}>Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional instructions or notes"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.scheduleButton, isLoading && styles.disabledButton]}
        onPress={handleScheduleInterview}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="calendar" size={20} color="#FFFFFF" />
            <Text style={styles.scheduleButtonText}>Schedule Interview</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
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
  candidateCard: {
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
  candidateInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  candidateEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 4,
  },
  department: {
    fontSize: 14,
    color: '#6B7280',
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
  scheduleButton: {
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
  scheduleButtonText: {
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
