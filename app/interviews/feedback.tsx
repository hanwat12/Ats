import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';

export default function InterviewFeedback() {
  const { interviewId } = useLocalSearchParams();

  const [overallRating, setOverallRating] = useState(0);
  const [technicalSkills, setTechnicalSkills] = useState(0);
  const [communicationSkills, setCommunicationSkills] = useState(0);
  const [problemSolving, setProblemSolving] = useState(0);
  const [culturalFit, setCulturalFit] = useState(0);
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [rounds, setRounds] = useState('1');

  const interviewWithDetails = useQuery(api.interviews.getInterviewsWithApplicationDetails);
  const submitFeedback = useMutation(api.feedback.submitFeedback);
  const updateInterviewStatus = useMutation(api.interviews.updateInterviewStatus);
  const updateApplicationStatus = useMutation(api.applications.updateApplicationStatus);
  const createNotification = useMutation(api.notifications.createNotification);

  const currentInterview = interviewWithDetails?.find((int) => int._id === interviewId);

  const renderStarRating = (rating: number, setRating: (rating: number) => void) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={24}
              color={star <= rating ? '#F59E0B' : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleSubmitFeedback = async () => {
    if (!overallRating || !recommendation) {
      Alert.alert('Error', 'Please provide overall rating and recommendation');
      return;
    }

    try {
      await submitFeedback({
        interviewId: interviewId as string,
        candidateId: currentInterview?.candidate?._id || '',
        jobId: currentInterview?.job?._id || '',
        interviewerName: currentInterview?.interviewerName || '',
        overallRating,
        technicalSkills,
        communicationSkills,
        problemSolving,
        culturalFit,
        strengths,
        weaknesses,
        recommendation,
        additionalComments: `${additionalComments}\n\nInterview Rounds: ${rounds}`,
      });

      // Update interview status to completed
      await updateInterviewStatus({
        interviewId: interviewId as string,
        status: 'completed',
        notes: `Feedback submitted. Overall rating: ${overallRating}/5. Recommendation: ${recommendation}`,
      });

      // Update application status based on recommendation
      let newStatus = 'interviewed';
      if (recommendation === 'hire') {
        newStatus = 'selected';
      } else if (recommendation === 'no-hire') {
        newStatus = 'rejected';
      } else if (recommendation === 'maybe') {
        newStatus = 'on-hold';
      }

      await updateApplicationStatus({
        applicationId: currentInterview?.application?._id || '',
        status: newStatus as any,
        notes: `Interview completed. ${recommendation.toUpperCase()} recommendation.`,
      });

      // Create notification for candidate
      await createNotification({
        userId: currentInterview?.candidate?.userId || '',
        title: 'Interview Completed',
        message: `Your interview for ${currentInterview?.job?.title} has been completed. We'll get back to you soon.`,
        type: 'application_status',
        relatedId: currentInterview?.application?._id || '',
      });

      Alert.alert('Success', 'Feedback submitted successfully!');
      router.replace('/dashboard/hr');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  if (!currentInterview) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Interview Feedback" showBack={true} />

      <ScrollView style={styles.scrollView}>
        {/* Candidate Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Candidate Information</Text>
          <View style={styles.candidateCard}>
            <Text style={styles.candidateName}>
              {currentInterview.candidate?.firstName} {currentInterview.candidate?.lastName}
            </Text>
            <Text style={styles.jobTitle}>{currentInterview.job?.title}</Text>
            <Text style={styles.interviewDate}>
              Interview Date: {new Date(currentInterview.scheduledDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Rating Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Rating</Text>
          {renderStarRating(overallRating, setOverallRating)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Skills</Text>
          {renderStarRating(technicalSkills, setTechnicalSkills)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication Skills</Text>
          {renderStarRating(communicationSkills, setCommunicationSkills)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Problem Solving</Text>
          {renderStarRating(problemSolving, setProblemSolving)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cultural Fit</Text>
          {renderStarRating(culturalFit, setCulturalFit)}
        </View>

        {/* Interview Rounds */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of Interview Rounds</Text>
          <TextInput
            style={styles.roundsInput}
            value={rounds}
            onChangeText={setRounds}
            keyboardType="numeric"
            placeholder="Enter number of rounds"
          />
        </View>

        {/* Text Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strengths</Text>
          <TextInput
            style={styles.textInput}
            value={strengths}
            onChangeText={setStrengths}
            placeholder="What are the candidate's key strengths?"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Areas for Improvement</Text>
          <TextInput
            style={styles.textInput}
            value={weaknesses}
            onChangeText={setWeaknesses}
            placeholder="What areas could the candidate improve?"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Recommendation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendation</Text>
          <View style={styles.recommendationContainer}>
            {['hire', 'maybe', 'no-hire'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.recommendationButton,
                  recommendation === option && styles.selectedRecommendation,
                ]}
                onPress={() => setRecommendation(option)}
              >
                <Text
                  style={[
                    styles.recommendationText,
                    recommendation === option && styles.selectedRecommendationText,
                  ]}
                >
                  {option === 'hire' ? 'Hire' : option === 'maybe' ? 'On Hold' : 'Reject'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Comments</Text>
          <TextInput
            style={styles.textInput}
            value={additionalComments}
            onChangeText={setAdditionalComments}
            placeholder="Any additional feedback or notes..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFeedback}>
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  candidateCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 4,
  },
  interviewDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roundsInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  recommendationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendationButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  selectedRecommendation: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedRecommendationText: {
    color: '#3B82F6',
  },
  buttonContainer: {
    padding: 20,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
