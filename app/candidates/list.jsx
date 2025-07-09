import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';

export default function CandidateListScreen() {
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobSelection, setShowJobSelection] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const candidates = useQuery(api.candidate.getAllCandidates);
  const recentApplications = useQuery(api.applications.getAllApplicationsForHR);
  const jobs = useQuery(api.jobs.getAllJobs);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin' && parsedUser.role !== 'hr') {
          Alert.alert('Access Denied', 'You do not have permission to view candidates');
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

  const filteredCandidates = candidates?.filter(candidate =>
    `${candidate.firstName || ''} ${candidate.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (candidate.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (candidate.skills || []).some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) || []);

  const getExperienceLevel = (years) => {
    if (!years || years === 0) return 'Entry Level';
    if (years <= 2) return 'Junior';
    if (years <= 5) return 'Mid-Level';
    if (years <= 8) return 'Senior';
    return 'Expert';
  };

  const handleShortlistCandidate = (candidate) => {
    if (!jobs || jobs.length === 0) {
      Alert.alert('No Jobs Available', 'Please create a job posting first before shortlisting candidates');
      return;
    }
    setSelectedCandidate(candidate);
  };

  const handleJobSelection = (job) => {
    if (selectedCandidate && job) {
      setShowJobSelection(false);
      router.push({
        pathname: '/interviews/schedule',
        params: {
          candidateId: selectedCandidate._id,
          jobId: job._id,
          candidateName: `${selectedCandidate.firstName} ${selectedCandidate.lastName}`,
          jobTitle: job.title
        }
      });
    }
  };

  const handleViewProfile = (candidate) => {
    router.push({
      pathname: '/hr/candidate-profile',
      params: {
        candidateId: candidate._id,
        candidateName: `${candidate.firstName} ${candidate.lastName}`
      }
    });
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

  if (candidates === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Candidates" showBack={true} />
        <View style={styles.loadingContainer}>
          <Text>Loading candidates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Candidates" showBack={true} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search candidates by name, skills, or location..."
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Header */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{candidates?.length || 0}</Text>
            <Text style={styles.statLabel}>Total Candidates</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {candidates?.filter(c => (c.experience || 0) >= 3).length || 0}
            </Text>
            <Text style={styles.statLabel}>Experienced</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {candidates?.filter(c => c.resumeId).length || 0}
            </Text>
            <Text style={styles.statLabel}>With Resume</Text>
          </View>
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {/* Candidates List */}
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((candidate) => (
            <View key={candidate._id} style={styles.candidateCard}>
              <View style={styles.candidateHeader}>
                <View style={styles.candidateAvatar}>
                  <Text style={styles.candidateInitials}>
                    {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                  </Text>
                </View>
                <View style={styles.candidateInfo}>
                  <Text style={styles.candidateName}>
                    {candidate.firstName} {candidate.lastName}
                  </Text>
                  <Text style={styles.candidateEmail}>{candidate.email}</Text>
                  <View style={styles.candidateMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={12} color="#6B7280" />
                      <Text style={styles.metaText}>{candidate.location || 'Not specified'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="briefcase-outline" size={12} color="#6B7280" />
                      <Text style={styles.metaText}>{getExperienceLevel(candidate.experience || 0)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.candidateActions}>
                  {candidate.resumeId && (
                    <TouchableOpacity style={styles.resumeButton}>
                      <Ionicons name="document-text" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.contactButton}>
                    <Ionicons name="mail" size={18} color="#10B981" />
                  </TouchableOpacity>
                </View>
              </View>

              {candidate.education && (
                <View style={styles.educationSection}>
                  <Ionicons name="school-outline" size={14} color="#6B7280" />
                  <Text style={styles.educationText}>{candidate.education}</Text>
                </View>
              )}

              {candidate.summary && (
                <Text style={styles.candidateSummary} numberOfLines={2}>
                  {candidate.summary}
                </Text>
              )}

              {candidate.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0 && (
                <View style={styles.skillsSection}>
                  <Text style={styles.skillsTitle}>Skills</Text>
                  <View style={styles.skillsContainer}>
                    {candidate.skills.slice(0, 4).map((skill, index) => (
                      <View key={index} style={styles.skillTag}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                    {candidate.skills.length > 4 && (
                      <View style={styles.moreSkillsTag}>
                        <Text style={styles.moreSkillsText}>+{candidate.skills.length - 4}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.candidateFooter}>
                <View style={styles.socialLinks}>
                  {candidate.linkedinUrl && (
                    <TouchableOpacity style={styles.socialButton}>
                      <Ionicons name="logo-linkedin" size={16} color="#0077B5" />
                    </TouchableOpacity>
                  )}
                  {candidate.githubUrl && (
                    <TouchableOpacity style={styles.socialButton}>
                      <Ionicons name="logo-github" size={16} color="#333" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.shortlistButton}
                    onPress={() => handleShortlistCandidate(candidate)}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.shortlistButtonText}>Shortlist</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.viewProfileButton}
                    onPress={() => handleViewProfile(candidate)}
                  >
                    <Text style={styles.viewProfileText}>View Profile</Text>
                    <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No Candidates Found' : 'No Candidates Yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? `No candidates match "${searchQuery}". Try different keywords.`
                : 'Candidates will appear here once they register on the platform.'
              }
            </Text>
            {searchQuery && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Job Selection Modal */}
      <Modal
        visible={showJobSelection}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowJobSelection(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Job</Text>
            <Text style={styles.modalSubtitle}>
              Choose the job you want to shortlist {selectedCandidate?.firstName} {selectedCandidate?.lastName} for
            </Text>
            
            <ScrollView style={styles.jobsList}>
              {jobs?.map(job => (
                <TouchableOpacity 
                  key={job._id} 
                  style={styles.jobItem}
                  onPress={() => handleJobSelection(job)}
                >
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.applicationDate}>{job.department} • {job.type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowJobSelection(false)}
            >
              <Text style={styles.cancelModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ... (keep all your existing styles the same)

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
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  candidateAvatar: {
    width: 56,

    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  candidateInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    marginBottom: 8,
  },
  candidateMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  candidateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resumeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  educationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  educationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  candidateSummary: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  skillsSection: {
    marginBottom: 16,
  },
  skillsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  skillsContainer: {
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
  moreSkillsTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moreSkillsText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  candidateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  shortlistButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shortlistButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 8,
  },
  socialButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewProfileText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginRight: 4,
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
    marginBottom: 24,
  },
  clearSearchButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  jobsList: {
    maxHeight: 300,
  },
  jobItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelModalButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelModalButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  jobTitle: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
    marginBottom: 4,
  },
  applicationDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  resumeLink: {
    fontSize: 14,
    color: '#3B82F6',
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
});