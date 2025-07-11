import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Id } from '@/convex/_generated/dataModel';
import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

interface User {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function UploadResumeScreen() {
  const { requisitionId } = useLocalSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    skills: '',
    experience: '',
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const requisition = useQuery(
    api.requisitions.getRequisitionById,
    requisitionId ? { requisitionId: requisitionId as Id<'requisitions'> } : 'skip'
  );
  const uploadCandidate = useMutation(api.requisitions.uploadCandidateToRequisition);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        // Allow HR and Admin roles to access this screen
        if (
          parsedUser.role !== 'candidate' &&
          parsedUser.role !== 'hr' &&
          parsedUser.role !== 'admin'
        ) {
          Alert.alert('Access Denied', 'Only  HR can upload resumes');
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

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickDocument = async () => {
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

        // Check file size (limit to 10MB)
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
          return;
        }

        setSelectedFile(file);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }

    if (!formData.candidateName || !formData.candidateEmail) {
      Alert.alert('Error', 'Please fill in candidate name and email');
      return;
    }

    setLoading(true);
    try {
      await uploadCandidate({
        requisitionId: requisitionId as Id<'requisitions'>,
        candidateName: formData.candidateName,
        candidateEmail: formData.candidateEmail,
        candidatePhone: formData.candidatePhone,
        skills: formData.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        experience: parseInt(formData.experience) || 0,
        resumeFileName: selectedFile.name,
        resumeFileSize: selectedFile.size || 0,
        resumeFileUrl: selectedFile.uri,
        notes: formData.notes,
        uploadedBy: user!.userId as Id<'users'>,
        uploadedAt: Date.now(),
      });

      Alert.alert(
        'Success',
        'Candidate resume uploaded successfully! The requisition owner has been notified.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to upload resume');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !requisition) {
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Header title="Upload Resume" showBack={true} />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Requisition Info */}
          <View style={styles.requisitionCard}>
            <Text style={styles.requisitionTitle}>{requisition.jobRole}</Text>
            <Text style={styles.requisitionDepartment}>{requisition.department}</Text>
            <Text style={styles.requisitionExperience}>
              {requisition.experienceRequired} years experience required
            </Text>
            <Text style={styles.requisitionPositions}>
              {requisition.numberOfPositions} position(s) available
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Candidate Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.candidateName}
                onChangeText={(value) => updateFormData('candidateName', value)}
                placeholder="Enter candidate's full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.candidateEmail}
                onChangeText={(value) => updateFormData('candidateEmail', value)}
                placeholder="candidate@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.candidatePhone}
                onChangeText={(value) => updateFormData('candidatePhone', value)}
                placeholder="+91 9999999999"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Experience (years) *</Text>
              <TextInput
                style={styles.input}
                value={formData.experience}
                onChangeText={(value) => updateFormData('experience', value)}
                placeholder="0 (for fresher)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Skills *</Text>
              <TextInput
                style={styles.input}
                value={formData.skills}
                onChangeText={(value) => updateFormData('skills', value)}
                placeholder="React, Node.js, TypeScript (comma separated)"
                placeholderTextColor="#9CA3AF"
                multiline
              />
              <Text style={styles.helperText}>Separate skills with commas</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Resume File *</Text>
              {selectedFile ? (
                <View style={styles.selectedFileCard}>
                  <View style={styles.fileInfo}>
                    <Ionicons name="document-text" size={24} color="#3B82F6" />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName}>{selectedFile.name}</Text>
                      <Text style={styles.fileSize}>
                        {selectedFile.size
                          ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                          : 'Unknown size'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                      <Ionicons name="close" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  {/* Submit Button for selected file */}
                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleUpload}
                    disabled={loading}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>
                      {loading ? 'Uploading...' : 'Submit Resume'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
                  <Ionicons name="cloud-upload" size={32} color="#9CA3AF" />
                  <Text style={styles.uploadText}>Choose Resume File</Text>
                  <Text style={styles.uploadSubtext}>PDF, DOC, DOCX (max 5MB)</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => updateFormData('notes', value)}
                placeholder="Any additional notes about the candidate..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.uploadButton, loading && styles.uploadButtonDisabled]}
              onPress={handleUpload}
              disabled={loading}
            >
              <Text style={styles.uploadButtonText}>
                {loading ? 'Uploading...' : 'Upload Candidate Resume'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  requisitionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  requisitionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  requisitionDepartment: {
    fontSize: 16,
    color: '#3B82F6',
    marginBottom: 4,
  },
  requisitionExperience: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  requisitionPositions: {
    fontSize: 14,
    color: '#6B7280',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  uploadArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  selectedFileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  uploadButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
