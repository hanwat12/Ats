
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

export default function CandidateUploadScreen() {
  const [user, setUser] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateExperience, setCandidateExperience] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [jobModalVisible, setJobModalVisible] = useState(false);

  const jobs = useQuery(api.jobs.getAllJobs);
  const uploadCandidate = useMutation(api.candidates.uploadCandidate);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'hr') {
          Alert.alert('Access Denied', 'Only HR can upload candidates');
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

  const handleFileSelection = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const handleSubmit = async () => {
    if (!candidateName || !candidateEmail || !candidateExperience || !selectedJob || !selectedFile) {
      Alert.alert('Error', 'Please fill all fields and select a resume file');
      return;
    }

    try {
      await uploadCandidate({
        jobId: selectedJob._id,
        name: candidateName,
        email: candidateEmail,
        experience: parseInt(candidateExperience) || 0,
        resumeUrl: selectedFile.uri,
        fileName: selectedFile.name,
        uploadedBy: user.userId,
      });

      Alert.alert('Success', 'Candidate uploaded successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload candidate');
    }
  };

  if (!user) {
    return <View style={styles.loading}><Text>Loading...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Candidate</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <Text style={styles.label}>Candidate Name *</Text>
          <TextInput
            style={styles.input}
            value={candidateName}
            onChangeText={setCandidateName}
            placeholder="Enter candidate name"
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={candidateEmail}
            onChangeText={setCandidateEmail}
            placeholder="Enter email address"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Experience (years) *</Text>
          <TextInput
            style={styles.input}
            value={candidateExperience}
            onChangeText={setCandidateExperience}
            placeholder="Enter years of experience"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Select Job *</Text>
          <TouchableOpacity
            style={styles.jobSelector}
            onPress={() => setJobModalVisible(true)}
          >
            <Text style={styles.jobSelectorText}>
              {selectedJob ? selectedJob.title : 'Select a job position'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>

          <Text style={styles.label}>Resume File *</Text>
          {!selectedFile ? (
            <TouchableOpacity style={styles.fileButton} onPress={handleFileSelection}>
              <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
              <Text style={styles.fileButtonText}>Select Resume File</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.selectedFile}>
              <Ionicons name="document" size={24} color="#3B82F6" />
              <Text style={styles.fileName}>{selectedFile.name}</Text>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <Ionicons name="close" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Upload Candidate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={jobModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Job</Text>
            <TouchableOpacity onPress={() => setJobModalVisible(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {jobs?.map((job) => (
              <TouchableOpacity
                key={job._id}
                style={styles.jobOption}
                onPress={() => {
                  setSelectedJob(job);
                  setJobModalVisible(false);
                }}
              >
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobRole}>{job.role}</Text>
                <Text style={styles.jobLocation}>{job.location}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  content: {
    flex: 1,
    padding: 16,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  jobSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  jobSelectorText: {
    fontSize: 16,
    color: '#374151',
  },
  fileButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  fileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
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
    padding: 16,
  },
  jobOption: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  jobRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  jobLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
});
