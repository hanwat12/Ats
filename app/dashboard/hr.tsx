import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import * as DocumentPicker from 'expo-document-picker';

interface User {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function HRDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [resumeUploadModal, setResumeUploadModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateExperience, setCandidateExperience] = useState('');
  const [candidateSkills, setCandidateSkills] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const stats = useQuery(api.applications.getDashboardStats);
  const jobs = useQuery(api.jobs.getAllJobs);
  const candidates = useQuery(api.candidate.getAllCandidates);
  const recentApplications = useQuery(api.applications.getAllApplicationsForHR);
  const pendingInterviews = useQuery(api.candidate.getPendingInterviewsForHR);
  const resumeUploads = useQuery(api.resumeUpload.getAllResumeUploads);
  const queries = useQuery(
    api.queries.getQueriesForUser,
    user ? { userId: user.userId as any } : 'skip'
  );
  const adminUsers = useQuery(api.queries.getUsersByRole, { role: 'admin' });

  const createCandidate = useMutation(api.candidate.createCandidateProfile);
  const uploadResume = useMutation(api.resumeUpload.uploadCandidateResume);
  const createQuery = useMutation(api.queries.createQuery);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'hr' && parsedUser.role !== 'admin') {
          Alert.alert('Access Denied', 'You do not have permission to access this dashboard');
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

  const handleResumeUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];

        if (!candidateName || !candidateEmail || !selectedJob) {
          Alert.alert('Error', 'Please fill all required fields and select a job');
          return;
        }

        setSelectedFile(file);
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to select resume file');
    }
  };

  const submitResumeUpload = async () => {
    if (!selectedFile || !candidateName || !candidateEmail || !selectedJob) {
      Alert.alert('Error', 'Please fill all required fields and select a file');
      return;
    }

    try {
      // Create candidate profile first
      const candidateId = await createCandidate({
        userId: user!.userId as any,
        skills: candidateSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        experience: parseInt(candidateExperience) || 0,
        education: '',
        location: '',
        summary: uploadNotes,
        firstName: candidateName.split(' ')[0],
        lastName: candidateName.split(' ').slice(1).join(' ') || '',
        email: candidateEmail,
        phone: candidatePhone,
      });

      // Upload resume with current timestamp
      await uploadResume({
        candidateId,
        fileName: selectedFile.name,
        fileUrl: selectedFile.uri,
        fileSize: selectedFile.size || 0,
        uploadedBy: user!.userId as any,
        jobId: selectedJob._id,
        notes: uploadNotes,
        uploadedAt: Date.now(),
        status: 'uploaded',
      });

      Alert.alert(
        'Success',
        'Resume uploaded successfully! The information has been sent to the Admin dashboard for review.',
        [
          {
            text: 'OK',
            onPress: () => {
              setResumeUploadModal(false);
              resetUploadForm();
              setSelectedFile(null);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload resume');
    }
  };

  const resetUploadForm = () => {
    setCandidateName('');
    setCandidateEmail('');
    setCandidatePhone('');
    setCandidateExperience('');
    setCandidateSkills('');
    setSelectedJob(null);
    setUploadNotes('');
    setSelectedFile(null);
  };

  const sendQueryToAdmin = async () => {
    try {
      if (adminUsers && adminUsers.length > 0) {
        await createQuery({
          fromUserId: user!.userId as any,
          toUserId: adminUsers[0]._id,
          subject: 'Candidate Selection Query',
          message: 'I have a query regarding candidate selection process.',
          priority: 'medium' as const,
          category: 'candidate_selection' as const,
        });
        Alert.alert('Success', 'Query sent to Admin');
      } else {
        Alert.alert('Error', 'No admin users found');
      }
    } catch (error) {
      console.error('Query creation error:', error);
      Alert.alert('Error', 'Failed to send query');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded':
        return '#3B82F6';
      case 'reviewed':
        return '#F59E0B';
      case 'shortlisted':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const renderOverviewTab = () => (
    <>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.userRole}>HR DASHBOARD</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="document-text" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.statNumber}>{resumeUploads?.length || 0}</Text>
          <Text style={styles.statLabel}>Total Resumes</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="people" size={24} color="#10B981" />
          </View>
          <Text style={styles.statNumber}>
            {resumeUploads?.filter((r: any) => r.status === 'shortlisted')?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Shortlisted</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="calendar" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statNumber}>{pendingInterviews?.length || 0}</Text>
          <Text style={styles.statLabel}>Pending Interviews</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="chatbubble" size={24} color="#8B5CF6" />
          </View>
          <Text style={styles.statNumber}>
            {queries?.filter((q: any) => q.status === 'open')?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Open Queries</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => setResumeUploadModal(true)}>
            <Ionicons name="cloud-upload" size={32} color="#3B82F6" />
            <Text style={styles.actionText}>Upload Resume</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('interviews')}>
            <Ionicons name="calendar-outline" size={32} color="#10B981" />
            <Text style={styles.actionText}>Confirm Interviews</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('queries')}>
            <Ionicons name="chatbubble-outline" size={32} color="#F59E0B" />
            <Text style={styles.actionText}>View Queries</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={sendQueryToAdmin}>
            <Ionicons name="send-outline" size={32} color="#8B5CF6" />
            <Text style={styles.actionText}>Send Query</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderResumesTab = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Resume Management</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={() => setResumeUploadModal(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.uploadButtonText}>Upload New</Text>
        </TouchableOpacity>
      </View>

      {resumeUploads?.map((upload: any) => (
        <View key={upload._id} style={styles.resumeCard}>
          <View style={styles.resumeHeader}>
            <View style={styles.candidateInfo}>
              <Text style={styles.candidateName}>{upload.candidateName}</Text>
              <Text style={styles.candidateEmail}>{upload.candidateEmail}</Text>
              <Text style={styles.jobTitle}>{upload.jobTitle}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(upload.status) }]}>
              <Text style={styles.statusText}>{upload.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.resumeDetails}>
            <Text style={styles.detailText}>
              <Ionicons name="document" size={14} color="#6B7280" /> {upload.fileName}
            </Text>
            <Text style={styles.detailText}>
              <Ionicons name="time" size={14} color="#6B7280" />
              {new Date(upload.uploadedAt).toLocaleDateString()}
            </Text>
            <Text style={styles.detailText}>
              <Ionicons name="person" size={14} color="#6B7280" /> {upload.uploaderName}
            </Text>
          </View>

          {upload.notes && <Text style={styles.notesText}>Notes: {upload.notes}</Text>}
        </View>
      ))}
    </View>
  );

  const renderInterviewsTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Interview Confirmations</Text>

      {pendingInterviews?.map((interview: any) => (
        <View key={interview._id} style={styles.interviewCard}>
          <View style={styles.interviewHeader}>
            <Text style={styles.candidateName}>
              {interview.candidate?.firstName} {interview.candidate?.lastName}
            </Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending Confirmation</Text>
            </View>
          </View>

          <Text style={styles.jobTitle}>Position: {interview.job?.title}</Text>
          <Text style={styles.interviewDate}>
            Scheduled: {new Date(interview.scheduledDate).toLocaleDateString()}
          </Text>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() =>
              router.push(`/interviews/confirmation?interviewId=${interview._id}` as any)
            }
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>Confirm Interview</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderQueriesTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Communication Hub</Text>

      <TouchableOpacity
        style={styles.newQueryButton}
        onPress={() => router.push('/queries/create' as any)}
      >
        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
        <Text style={styles.newQueryButtonText}>New Query</Text>
      </TouchableOpacity>

      {queries?.map((query: any) => (
        <TouchableOpacity
          key={query._id}
          style={styles.queryCard}
          onPress={() => router.push(`/queries/${query._id}` as any)}
        >
          <View style={styles.queryHeader}>
            <Text style={styles.querySubject}>{query.subject}</Text>
            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor:
                    query.priority === 'urgent'
                      ? '#EF4444'
                      : query.priority === 'high'
                        ? '#F59E0B'
                        : '#6B7280',
                },
              ]}
            >
              <Text style={styles.priorityText}>{query.priority.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.queryMessage} numberOfLines={2}>
            {query.message}
          </Text>

          <View style={styles.queryFooter}>
            <Text style={styles.queryUser}>
              {query.isOwner ? `To: ${query.toUserName}` : `From: ${query.fromUserName}`}
            </Text>
            <Text style={styles.queryDate}>{new Date(query.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.responseCount}>{query.responses?.length || 0} responses</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

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
      <Header
        title="HR Dashboard"
        showMenu={true}
        onMenuPress={() => setSidebarVisible(true)}
        rightComponent={
          <NotificationBell
            userId={user.userId}
            onPress={() => router.push('/notifications' as any)}
          />
        }
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resumes' && styles.activeTab]}
          onPress={() => setActiveTab('resumes')}
        >
          <Text style={[styles.tabText, activeTab === 'resumes' && styles.activeTabText]}>
            Resumes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'interviews' && styles.activeTab]}
          onPress={() => setActiveTab('interviews')}
        >
          <Text style={[styles.tabText, activeTab === 'interviews' && styles.activeTabText]}>
            Interviews
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'queries' && styles.activeTab]}
          onPress={() => setActiveTab('queries')}
        >
          <Text style={[styles.tabText, activeTab === 'queries' && styles.activeTabText]}>
            Queries
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'resumes' && renderResumesTab()}
        {activeTab === 'interviews' && renderInterviewsTab()}
        {activeTab === 'queries' && renderQueriesTab()}
      </ScrollView>

      {/* Resume Upload Modal */}
      <Modal visible={resumeUploadModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Candidate Resume</Text>
            <TouchableOpacity onPress={() => setResumeUploadModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Candidate Name *"
              value={candidateName}
              onChangeText={setCandidateName}
            />

            <TextInput
              style={styles.input}
              placeholder="Email Address *"
              value={candidateEmail}
              onChangeText={setCandidateEmail}
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={candidatePhone}
              onChangeText={setCandidatePhone}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Years of Experience *"
              value={candidateExperience}
              onChangeText={setCandidateExperience}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Skills (comma separated)"
              value={candidateSkills}
              onChangeText={setCandidateSkills}
              multiline
            />

            <TouchableOpacity
              style={styles.jobSelector}
              onPress={() => {
                Alert.alert(
                  'Select Job',
                  'Choose the job position',
                  jobs?.map((job) => ({
                    text: job.title,
                    onPress: () => setSelectedJob(job),
                  })) || []
                );
              }}
            >
              <Text style={styles.jobSelectorText}>
                {selectedJob ? selectedJob.title : 'Select Job Position *'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Additional Notes"
              value={uploadNotes}
              onChangeText={setUploadNotes}
              multiline
              numberOfLines={3}
            />

            {!selectedFile ? (
              <TouchableOpacity style={styles.uploadResumeButton} onPress={handleResumeUpload}>
                <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                <Text style={styles.uploadResumeButtonText}>Select Resume File</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.selectedFileContainer}>
                <View style={styles.selectedFileInfo}>
                  <Ionicons name="document" size={24} color="#3B82F6" />
                  <View style={styles.fileDetails}>
                    <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                    <Text style={styles.selectedFileSize}>
                      {selectedFile.size
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                        : 'Unknown size'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => setSelectedFile(null)}
                  >
                    <Ionicons name="close" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={submitResumeUpload}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Submit Resume</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} user={user} />
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#10B981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#10B981',
  },
  welcomeSection: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  userRole: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  resumeCard: {
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
  resumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  jobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
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
  resumeDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  interviewCard: {
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
  interviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  interviewDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  newQueryButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  newQueryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  queryCard: {
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
  queryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  querySubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  queryMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  queryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queryUser: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  queryDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  responseCount: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  jobSelector: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  jobSelectorText: {
    fontSize: 16,
    color: '#374151',
  },
  uploadResumeButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  uploadResumeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedFileContainer: {
    marginTop: 20,
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  selectedFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedFileSize: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  removeFileButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
