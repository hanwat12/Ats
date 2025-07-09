import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';

interface User {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function HRRequisitionsListScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const approvedRequisitions = useQuery(api.requisitions.getApprovedRequisitions);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin' && parsedUser.role !== 'hr') {
          Alert.alert('Access Denied', 'You do not have permission to view requisitions');
          router.back();
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Upload Resumes" showBack={true} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Approved Requisitions</Text>
            <Text style={styles.headerSubtitle}>
              Select a requisition to upload candidate resumes
            </Text>
          </View>

          {approvedRequisitions?.map((requisition) => (
            <TouchableOpacity
              key={requisition._id}
              style={styles.requisitionCard}
              onPress={() =>
                router.push(`/requisitions/upload-resume?requisitionId=${requisition._id}` as any)
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <Text style={styles.jobRole}>{requisition.jobRole}</Text>
                  <View style={styles.approvedBadge}>
                    <Text style={styles.approvedText}>APPROVED</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() =>
                    router.push(
                      `/requisitions/upload-resume?requisitionId=${requisition._id}` as any
                    )
                  }
                >
                  <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Upload Resume</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Ionicons name="business" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{requisition.department}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>
                    {requisition.experienceRequired} years experience
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="people" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{requisition.numberOfPositions} position(s)</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="person" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>Created by {requisition.creatorName}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="document-text" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>
                    {requisition.candidatesCount} candidate(s) uploaded
                  </Text>
                </View>
              </View>

              {requisition.skillsRequired.length > 0 && (
                <View style={styles.skillsContainer}>
                  <Text style={styles.skillsTitle}>Required Skills:</Text>
                  <View style={styles.skillsList}>
                    {requisition.skillsRequired.slice(0, 3).map((skill: string, index: number) => (
                      <View key={index} style={styles.skillTag}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                    {requisition.skillsRequired.length > 3 && (
                      <Text style={styles.moreSkills}>
                        +{requisition.skillsRequired.length - 3}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>
                  Approved{' '}
                  {new Date(requisition.approvedAt || requisition.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {approvedRequisitions?.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Approved Requisitions</Text>
              <Text style={styles.emptyDescription}>
                No requisitions have been approved yet. Check back later or contact admin.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerSection: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  requisitionCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  jobRole: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  approvedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  approvedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  skillsContainer: {
    marginBottom: 16,
  },
  skillsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  skillText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  moreSkills: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    alignSelf: 'center',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
});
