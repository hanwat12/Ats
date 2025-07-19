
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function CandidateListScreen() {
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterByJob, setFilterByJob] = useState<any>(null);

  const candidates = useQuery(api.candidates.getAllCandidates);
  const jobs = useQuery(api.jobs.getAllJobs);
  const shortlistCandidate = useMutation(api.candidates.shortlistCandidate);
  const shortlistedCandidates = useQuery(api.candidates.getShortlistedCandidates);
  const confirmCandidate = useMutation(api.candidates.confirmCandidate);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
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

  const handleShortlist = async (candidateId: string) => {
    try {
      await shortlistCandidate({
        candidateId: candidateId as any,
        adminId: user.userId as any,
      });
      Alert.alert('Success', 'Candidate shortlisted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to shortlist candidate');
    }
  };

  const handleConfirm = async (candidateId: string) => {
    try {
      await confirmCandidate({
        candidateId: candidateId as any,
        hrId: user.userId as any,
      });
      Alert.alert('Success', 'Candidate confirmed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm candidate');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return '#3B82F6';
      case 'shortlisted': return '#F59E0B';
      case 'confirmed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const filteredCandidates = candidates?.filter(candidate => 
    !filterByJob || candidate.jobId === filterByJob._id
  );

  const displayCandidates = user?.role === 'hr' 
    ? shortlistedCandidates 
    : filteredCandidates;

  if (!user) {
    return <View style={styles.loading}><Text>Loading...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {user.role === 'hr' ? 'Shortlisted Candidates' : 'All Candidates'}
        </Text>
      </View>

      {user.role === 'admin' && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Job:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, !filterByJob && styles.activeFilter]}
              onPress={() => setFilterByJob(null)}
            >
              <Text style={[styles.filterText, !filterByJob && styles.activeFilterText]}>
                All Jobs
              </Text>
            </TouchableOpacity>
            {jobs?.map((job) => (
              <TouchableOpacity
                key={job._id}
                style={[styles.filterChip, filterByJob?._id === job._id && styles.activeFilter]}
                onPress={() => setFilterByJob(job)}
              >
                <Text style={[styles.filterText, filterByJob?._id === job._id && styles.activeFilterText]}>
                  {job.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {displayCandidates?.map((candidate) => (
          <View key={candidate._id} style={styles.candidateCard}>
            <View style={styles.candidateHeader}>
              <View style={styles.candidateInfo}>
                <Text style={styles.candidateName}>{candidate.name}</Text>
                <Text style={styles.candidateEmail}>{candidate.email}</Text>
                <Text style={styles.candidateDetails}>
                  Experience: {candidate.experience} years
                </Text>
                <Text style={styles.candidateDetails}>
                  Job: {jobs?.find(j => j._id === candidate.jobId)?.title || 'Unknown Job'}
                </Text>
                <Text style={styles.candidateDetails}>
                  Uploaded by: HR User
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(candidate.status) }]}>
                <Text style={styles.statusText}>{candidate.status.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.candidateActions}>
              {user.role === 'admin' && candidate.status === 'uploaded' && (
                <TouchableOpacity
                  style={styles.shortlistButton}
                  onPress={() => handleShortlist(candidate._id)}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Shortlist</Text>
                </TouchableOpacity>
              )}

              {user.role === 'hr' && candidate.status === 'shortlisted' && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => handleConfirm(candidate._id)}
                >
                  <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Confirm</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.viewButton}>
                <Ionicons name="document-text" size={16} color="#3B82F6" />
                <Text style={styles.viewButtonText}>View Resume</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {!displayCandidates?.length && (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>
              {user.role === 'hr' ? 'No shortlisted candidates yet' : 'No candidates uploaded yet'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 16,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
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
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  candidateInfo: {
    flex: 1,
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
    marginBottom: 4,
  },
  candidateDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  candidateActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shortlistButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButton: {
    backgroundColor: '#EBF8FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  viewButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
});
