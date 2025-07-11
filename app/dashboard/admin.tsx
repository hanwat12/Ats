import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
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

interface User {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const stats = useQuery(api.applications.getDashboardStats);
  const jobs = useQuery(api.jobs.getAllJobs);
  const candidates = useQuery(api.candidate.getAllCandidates);
  const recentApplications = useQuery(api.applications.getAllApplicationsForHR);
  const pendingInterviews = useQuery(api.candidate.getPendingInterviewsForHR);
  const allFeedback = useQuery(api.feedback.getAllFeedback);
  const resumeUploads = useQuery(api.resumeUpload.getResumeUploadsForAdmin);
  const shortlistCandidate = useMutation(api.resumeUpload.shortlistCandidateForInterview);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin') {
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

  const formatSalary = (min: number, max: number, currency: string = 'INR') => {
    const symbol = currency === 'INR' ? '₹' : '$';
    if (currency === 'INR') {
      const minLakhs =
        min >= 100000 ? `${(min / 100000).toFixed(1)}L` : `${(min / 1000).toFixed(0)}K`;
      const maxLakhs =
        max >= 100000 ? `${(max / 100000).toFixed(1)}L` : `${(max / 1000).toFixed(0)}K`;
      return `${symbol}${minLakhs} - ${symbol}${maxLakhs}`;
    }
    return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return '#3B82F6';
      case 'screening':
        return '#F59E0B';
      case 'interview_scheduled':
        return '#8B5CF6';
      case 'interviewed':
        return '#6366F1';
      case 'selected':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'on-hold':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'applied':
        return 'Applied';
      case 'screening':
        return 'Screening';
      case 'interview_scheduled':
        return 'Interview Scheduled';
      case 'interviewed':
        return 'Interviewed';
      case 'selected':
        return 'Selected';
      case 'rejected':
        return 'Rejected';
      case 'on-hold':
        return 'On Hold';
      default:
        return status;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'hire':
        return '#10B981';
      case 'no-hire':
        return '#EF4444';
      case 'maybe':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const handleScheduleInterview = (candidateId: string, jobId: string) => {
    router.push(`/interviews/schedule?candidateId=${candidateId}&jobId=${jobId}`);
  };

  const renderOverviewTab = () => (
    <>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.userRole}>ADMIN DASHBOARD</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="briefcase" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.statNumber}>{stats?.totalJobs || 0}</Text>
          <Text style={styles.statLabel}>Total Jobs</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="people" size={24} color="#10B981" />
          </View>
          <Text style={styles.statNumber}>{candidates?.length || 0}</Text>
          <Text style={styles.statLabel}>Total Candidates</Text>
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
            <Ionicons name="clipboard" size={24} color="#8B5CF6" />
          </View>
          <Text style={styles.statNumber}>{allFeedback?.length || 0}</Text>
          <Text style={styles.statLabel}>Total Feedback</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/jobs/create' as any)}
          >
            <Ionicons name="add-circle" size={32} color="#3B82F6" />
            <Text style={styles.actionText}>Post New Job</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('candidates')}>
            <Ionicons name="people-outline" size={32} color="#10B981" />
            <Text style={styles.actionText}>View Candidates</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('interviews')}>
            <Ionicons name="calendar-outline" size={32} color="#F59E0B" />
            <Text style={styles.actionText}>Interview Management</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('feedback')}>
            <Ionicons name="clipboard-outline" size={32} color="#8B5CF6" />
            <Text style={styles.actionText}>View Feedback</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderCandidatesTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>All Candidates</Text>
      {candidates?.map((candidate: any) => (
        <View key={candidate._id} style={styles.candidateCard}>
          <View style={styles.candidateHeader}>
            <View style={styles.candidateAvatar}>
              <Text style={styles.candidateInitials}>
                {candidate.firstName?.[0] || 'U'}
                {candidate.lastName?.[0] || 'U'}
              </Text>
            </View>
            <View style={styles.candidateInfo}>
              <Text style={styles.candidateName}>
                {candidate.firstName} {candidate.lastName}
              </Text>
              <Text style={styles.candidateEmail}>{candidate.email}</Text>
              <Text style={styles.candidateExperience}>
                {candidate.experience || 0} years experience
              </Text>
              <Text style={styles.candidateLocation}>
                Location: {candidate.location || 'Not specified'}
              </Text>
            </View>
          </View>

          <View style={styles.candidateSkills}>
            {(candidate.skills || []).slice(0, 3).map((skill: string, index: number) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {(candidate.skills || []).length > 3 && (
              <Text style={styles.moreSkills}>+{(candidate.skills || []).length - 3}</Text>
            )}
          </View>

          <View style={styles.candidateActions}>
            <TouchableOpacity
              style={styles.shortlistButton}
              onPress={() => {
                // Show available jobs for shortlisting
                if (jobs && jobs.length > 0) {
                  Alert.alert(
                    'Select Job',
                    'Choose a job to shortlist this candidate for interview',
                    jobs
                      .map((job) => ({
                        text: job.title,
                        onPress: () => handleScheduleInterview(candidate.userId, job._id),
                      }))
                      .concat([{ text: 'Cancel', onPress: () => console.log('Cancel Pressed') }])
                  );
                } else {
                  Alert.alert('No Jobs', 'Please create a job first');
                }
              }}
            >
              <Ionicons name="calendar" size={16} color="#FFFFFF" />
              <Text style={styles.shortlistButtonText}>Schedule Interview</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderInterviewsTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Interview Management</Text>

      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => router.push('/interviews/shortlisted' as any)}
      >
        <Ionicons name="list" size={16} color="#FFFFFF" />
        <Text style={styles.viewAllButtonText}>View All Shortlisted Candidates</Text>
      </TouchableOpacity>

      {pendingInterviews?.map((interview: any) => (
        <View key={interview._id} style={styles.interviewCard}>
          <View style={styles.interviewHeader}>
            <Text style={styles.interviewCandidateName}>
              {interview.candidate?.firstName} {interview.candidate?.lastName}
            </Text>
            <View style={styles.interviewStatusBadge}>
              <Text style={styles.interviewStatusText}>Pending Confirmation</Text>
            </View>
          </View>

          <Text style={styles.interviewJobTitle}>
            Position: {interview.job?.title || 'Not specified'}
          </Text>
          <Text style={styles.interviewDate}>
            Scheduled:{' '}
            {interview.scheduledDate
              ? new Date(interview.scheduledDate).toLocaleDateString()
              : 'Not set'}
          </Text>
          <Text style={styles.interviewInterviewer}>
            Interviewer: {interview.interviewerName || 'Not assigned'}
          </Text>

          <TouchableOpacity
            style={styles.confirmInterviewButton}
            onPress={() =>
              router.push(`/interviews/confirmation?interviewId=${interview._id}` as any)
            }
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <Text style={styles.confirmInterviewButtonText}>Confirm Interview</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderResumesTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Resume Uploads for Review</Text>

      {resumeUploads?.map((upload: any) => (
        <View key={upload._id} style={styles.resumeUploadCard}>
          <View style={styles.resumeUploadHeader}>
            <View style={styles.candidateInfoSection}>
              <Text style={styles.candidateName}>
                {upload.candidate?.firstName} {upload.candidate?.lastName}
              </Text>
              <Text style={styles.candidateEmail}>{upload.candidate?.email}</Text>
              <Text style={styles.interviewJobTitle}>
                Position: {upload.job?.title || 'General Application'}
              </Text>
            </View>
            <View
              style={[
                styles.interviewStatusBadge,
                { backgroundColor: getStatusColor(upload.status) },
              ]}
            >
              <Text style={styles.interviewStatusText}>{upload.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.uploadDetails}>
            <Text style={styles.actionText}>
              <Ionicons name="document" size={14} color="#6B7280" /> {upload.fileName}
            </Text>
            <Text style={styles.actionText}>
              <Ionicons name="calendar" size={14} color="#6B7280" />
              Uploaded: {upload.uploadedDate} at {upload.uploadedTime}
            </Text>
            <Text style={styles.actionText}>
              <Ionicons name="person" size={14} color="#6B7280" />
              Uploaded by: {upload.uploaderName}
            </Text>
            {upload.candidateProfile?.experience && (
              <Text style={styles.actionText}>
                <Ionicons name="briefcase" size={14} color="#6B7280" />
                Experience: {upload.candidateProfile.experience} years
              </Text>
            )}
          </View>

          {upload.notes && <Text style={styles.actionText}>Notes: {upload.notes}</Text>}

          {upload.candidateProfile?.skills && upload.candidateProfile.skills.length > 0 && (
            <View style={styles.skillsContainer}>
              <Text style={styles.skillsLabel}>Skills:</Text>
              <View style={styles.skillsRow}>
                {upload.candidateProfile.skills.slice(0, 3).map((skill: string, index: number) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
                {upload.candidateProfile.skills.length > 3 && (
                  <Text style={styles.moreSkills}>
                    +{upload.candidateProfile.skills.length - 3}
                  </Text>
                )}
              </View>
            </View>
          )}

          {upload.status === 'uploaded' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.shortlistBtn}
                onPress={async () => {
                  try {
                    await shortlistCandidate({
                      uploadId: upload._id,
                      reviewedBy: user!.userId as any,
                      reviewNotes: 'Shortlisted for interview by admin',
                    });
                    Alert.alert(
                      'Success',
                      'Candidate shortlisted for interview! HR has been notified.'
                    );
                  } catch (error) {
                    Alert.alert('Error', 'Failed to shortlist candidate');
                  }
                }}
              >
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={styles.shortlistBtnText}>Shortlist for Interview</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderFeedbackTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Interview Feedback</Text>

      {allFeedback?.map((feedback: any) => (
        <View key={feedback._id} style={styles.feedbackCard}>
          <View style={styles.feedbackHeader}>
            <Text style={styles.feedbackCandidateName}>
              {feedback.candidate?.firstName} {feedback.candidate?.lastName}
            </Text>
            <View
              style={[
                styles.recommendationBadge,
                { backgroundColor: getRecommendationColor(feedback.recommendation) },
              ]}
            >
              <Text style={styles.recommendationText}>
                {feedback.recommendation?.toUpperCase() || 'PENDING'}
              </Text>
            </View>
          </View>

          <Text style={styles.feedbackJobTitle}>
            Position: {feedback.job?.title || 'Not specified'}
          </Text>
          <Text style={styles.feedbackInterviewer}>Interviewer: {feedback.interviewerName}</Text>

          <View style={styles.ratingsContainer}>
            <View style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>Overall:</Text>
              <Text style={styles.ratingValue}>{feedback.overallRating}/5</Text>
            </View>
            <View style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>Technical:</Text>
              <Text style={styles.ratingValue}>{feedback.technicalSkills}/5</Text>
            </View>
            <View style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>Communication:</Text>
              <Text style={styles.ratingValue}>{feedback.communicationSkills}/5</Text>
            </View>
          </View>

          {feedback.strengths && (
            <Text style={styles.feedbackText}>
              <Text style={styles.feedbackLabel}>Strengths: </Text>
              {feedback.strengths}
            </Text>
          )}

          {feedback.weaknesses && (
            <Text style={styles.feedbackText}>
              <Text style={styles.feedbackLabel}>Areas for Improvement: </Text>
              {feedback.weaknesses}
            </Text>
          )}

          <Text style={styles.feedbackDate}>
            Submitted:{' '}
            {feedback.submittedAt ? new Date(feedback.submittedAt).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>
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
        title="Admin Dashboard"
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
          style={[styles.tab, activeTab === 'candidates' && styles.activeTab]}
          onPress={() => setActiveTab('candidates')}
        >
          <Text style={[styles.tabText, activeTab === 'candidates' && styles.activeTabText]}>
            Candidates
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
          style={[styles.tab, activeTab === 'resumes' && styles.activeTab]}
          onPress={() => setActiveTab('resumes')}
        >
          <Text style={[styles.tabText, activeTab === 'resumes' && styles.activeTabText]}>
            Resumes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feedback' && styles.activeTab]}
          onPress={() => setActiveTab('feedback')}
        >
          <Text style={[styles.tabText, activeTab === 'feedback' && styles.activeTabText]}>
            Feedback
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'candidates' && renderCandidatesTab()}
        {activeTab === 'resumes' && renderResumesTab()}
        {activeTab === 'interviews' && renderInterviewsTab()}
        {activeTab === 'feedback' && renderFeedbackTab()}
      </ScrollView>

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
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
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
    color: '#EF4444',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
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
    marginBottom: 4,
  },
  candidateExperience: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  candidateLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  candidateSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    marginBottom: 16,
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
  },
  candidateActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  shortlistButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shortlistButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  viewAllButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  viewAllButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  interviewCandidateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  interviewStatusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  interviewStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  interviewJobTitle: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 4,
  },
  interviewDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  interviewInterviewer: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  confirmInterviewButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  confirmInterviewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  feedbackCard: {
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
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feedbackCandidateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  recommendationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recommendationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  feedbackJobTitle: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 4,
  },
  feedbackInterviewer: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  ratingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingItem: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  feedbackText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  feedbackLabel: {
    fontWeight: '600',
    color: '#1F2937',
  },
  feedbackDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  resumeUploadCard: {
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
  resumeUploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  candidateInfoSection: {
    flex: 1,
  },
  uploadDetails: {
    marginBottom: 12,
  },
  skillsContainer: {
    marginBottom: 12,
  },
  skillsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  shortlistBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shortlistBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
