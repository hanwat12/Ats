import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface Interview {
  _id: string;
  applicationId: string;
  status: string;
  scheduledDate: number;
  interviewerName: string;
  interviewerEmail: string;
  notes?: string;
  application?: {
    jobId: string;
    candidateId: string;
  };
  job?: {
    title: string;
    department: string;
  } | null;
  candidate?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  candidateProfile?: {
    firstName: string;
    lastName: string;
    email: string;
    experience?: number;
  };
}

export default function ShortlistedCandidates() {
  const [user, setUser] = useState<{ role: 'admin' | 'hr' | string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const pendingInterviews = useQuery(api.candidate.getPendingInterviewsForHR);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin') {
          Alert.alert('Access Denied', 'You do not have permission to view shortlisted candidates');
          router.replace('/dashboard/hr');
          return;
        }
        setUser(parsedUser);
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/auth/login');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleConfirmInterview = (interview: Interview) => {
    router.push(`/interviews/confirmation?interviewId=${interview._id}`);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (pendingInterviews === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (user?.role === 'hr') {
                router.replace('/dashboard/hr');
              } else {
                router.replace('/dashboard/admin');
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shortlisted Candidates</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading interviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (user?.role === 'hr') {
              router.replace('/dashboard/hr');
            } else {
              router.replace('/dashboard/admin');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shortlisted Candidates</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingInterviews?.length || 0}</Text>
            <Text style={styles.statLabel}>Pending Confirmations</Text>
          </View>
        </View>

        {pendingInterviews && pendingInterviews.length > 0 ? (
          pendingInterviews.map((interviewData) => {
            if (!interviewData) return null;
            return (
              <View key={interviewData._id} style={styles.candidateCard}>
                <View style={styles.candidateHeader}>
                  <View style={styles.candidateAvatar}>
                    <Text style={styles.candidateInitials}>
                      {interviewData?.candidate?.firstName?.[0] || 'U'}
                      {interviewData?.candidate?.lastName?.[0] || 'U'}
                    </Text>
                  </View>
                  <View style={styles.candidateInfo}>
                    <Text style={styles.candidateName}>
                      {interviewData?.candidate?.firstName || 'Unknown'}{' '}
                      {interviewData?.candidate?.lastName || 'User'}
                    </Text>
                    <Text style={styles.candidateEmail}>
                      {interviewData?.candidate?.email || 'No email'}
                    </Text>
                    <Text style={styles.jobTitle}>
                      Position: {interviewData?.job?.title || 'Not specified'}
                    </Text>
                    <Text style={styles.department}>
                      Department: {interviewData?.job?.department || 'Not specified'}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Shortlisted</Text>
                  </View>
                </View>

                <View style={styles.interviewDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {interviewData?.scheduledDate
                        ? new Date(interviewData.scheduledDate).toLocaleDateString()
                        : 'Date not set'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {interviewData?.scheduledDate
                        ? new Date(interviewData.scheduledDate).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                        : 'Time not set'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Interviewer: {interviewData?.interviewerName || 'Not assigned'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="mail-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Contact: {interviewData?.interviewerEmail || 'No contact info'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="briefcase-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Experience: {interviewData?.candidateProfile?.experience || 0} years
                    </Text>
                  </View>

                  {interviewData?.notes && (
                    <View style={styles.notesSection}>
                      <Text style={styles.notesTitle}>Notes:</Text>
                      <Text style={styles.notesText}>{interviewData.notes}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => handleConfirmInterview(interviewData as unknown as Interview)}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.confirmButtonText}>Confirm Interview</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Shortlisted Candidates</Text>
            <Text style={styles.emptyStateText}>
              Candidates shortlisted by admins will appear here for interview confirmation.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { marginRight: 15 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  statsContainer: { marginBottom: 24 },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  candidateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  candidateHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  candidateAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  candidateInitials: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  candidateInfo: { flex: 1 },
  candidateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  candidateEmail: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  jobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  department: { fontSize: 14, color: '#6B7280' },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  interviewDetails: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: { fontSize: 14, color: '#374151', marginLeft: 8 },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notesTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  notesText: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  actionButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  confirmButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
