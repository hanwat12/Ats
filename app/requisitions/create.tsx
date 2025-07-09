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
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Id } from '@/convex/_generated/dataModel';
import Header from '@/components/Header';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

interface User {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function CreateRequisitionScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    department: '',
    jobRole: '',
    experienceRequired: '',
    numberOfPositions: '',
    skillsRequired: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [jobRoles, setJobRoles] = useState<any[]>([]);

  const departments = useQuery(api.materData.getDepartments);
  const createRequisition = useMutation(api.requisitions.createRequisition);
  const initializeMasterData = useMutation(api.materData.initializeMasterData);
  const getJobRolesByDepartment = useQuery(
    api.materData.getJobRolesByDepartment,
    formData.department ? { department: formData.department } : 'skip'
  );

  useEffect(() => {
    loadUserData();
    initializeMasterData();
  }, []);

  useEffect(() => {
    if (getJobRolesByDepartment) {
      setJobRoles(getJobRolesByDepartment);
      if (
        formData.jobRole &&
        !getJobRolesByDepartment.find((role: { title: string }) => role.title === formData.jobRole)
      ) {
        setFormData((prev) => ({ ...prev, jobRole: '' }));
      }
    }
  }, [getJobRolesByDepartment]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin') {
          Alert.alert('Access Denied', 'Only admins can create requisitions');
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

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];

        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a PDF file smaller than 10MB');
          return;
        }

        setSelectedFile(file);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleCreateRequisition = async () => {
    const {
      department,
      jobRole,
      experienceRequired,
      numberOfPositions,
      skillsRequired,
      description,
    } = formData;

    if (!department || !jobRole || !experienceRequired || !numberOfPositions) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (parseInt(experienceRequired) < 0 || parseInt(numberOfPositions) < 1) {
      Alert.alert('Error', 'Please enter valid numbers for experience and positions');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    try {
      const skillsArray = skillsRequired
        .split(',')
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);

      let jdFileUrl = undefined;
      if (selectedFile) {
        // In a real implementation, you would upload the file to Object Storage
        // For now, we'll just store the file name
        jdFileUrl = selectedFile.name;
      }

      await createRequisition({
        department,
        jobRole,
        experienceRequired: parseInt(experienceRequired),
        numberOfPositions: parseInt(numberOfPositions),
        skillsRequired: skillsArray,
        jdFileUrl,
        description,
        createdBy: user.userId as Id<'users'>,
      });

      Alert.alert('Success', 'Requisition created successfully! HR will be notified.', [
        { text: 'OK', onPress: () => router.replace('/dashboard/hr') },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create requisition');
    } finally {
      setLoading(false);
    }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Header title="Create Requisition" showBack={true} />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Department *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.department}
                  onValueChange={(value) => updateFormData('department', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Department" value="" />
                  {departments?.map((dept: any) => (
                    <Picker.Item key={dept._id} label={dept.name} value={dept.name} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Job Role *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.jobRole}
                  onValueChange={(value) => updateFormData('jobRole', value)}
                  style={styles.picker}
                  enabled={!!formData.department}
                >
                  <Picker.Item label="Select Job Role" value="" />
                  {jobRoles.map((role: any) => (
                    <Picker.Item key={role._id} label={role.title} value={role.title} />
                  ))}
                </Picker>
              </View>
              {!formData.department && (
                <Text style={styles.helperText}>Please select a department first</Text>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Experience Required (years) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.experienceRequired}
                  onChangeText={(value) => updateFormData('experienceRequired', value)}
                  placeholder="0 (for fresher)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Number of Positions *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.numberOfPositions}
                  onChangeText={(value) => updateFormData('numberOfPositions', value)}
                  placeholder="1"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Required Skills</Text>
              <TextInput
                style={styles.input}
                value={formData.skillsRequired}
                onChangeText={(value) => updateFormData('skillsRequired', value)}
                placeholder="React, Node.js, TypeScript (comma separated)"
                placeholderTextColor="#9CA3AF"
                multiline
              />
              <Text style={styles.helperText}>Separate skills with commas</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Job Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
                placeholder="Describe the role, responsibilities, and requirements..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Job Description File (PDF)</Text>
              {selectedFile ? (
                <View style={styles.selectedFileCard}>
                  <View style={styles.fileInfo}>
                    <Ionicons name="document-text" size={24} color="#3B82F6" />
                    <Text style={styles.fileName}>{selectedFile.name}</Text>
                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                      <Ionicons name="close" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
                  <Ionicons name="cloud-upload" size={32} color="#9CA3AF" />
                  <Text style={styles.uploadText}>Upload JD File (Optional)</Text>
                  <Text style={styles.uploadSubtext}>PDF files only</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleCreateRequisition}
              disabled={loading}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Creating Requisition...' : 'Create Requisition'}
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
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
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
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    height: 50,
    color: '#1F2937',
  },
  textArea: {
    height: 120,
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
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
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
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  createButton: {
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
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
