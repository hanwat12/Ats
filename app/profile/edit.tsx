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
  Image,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Id } from '@/convex/_generated/dataModel';
import Header from '@/components/Header';
import * as ImagePicker from 'expo-image-picker';

interface User {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function EditProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    skills: '',
    experience: '',
    education: '',
    location: '',
    summary: '',
    linkedinUrl: '',
    githubUrl: '',
  });

  // const candidateProfile = useQuery(
  //   // api.candidates.getCandidateProfile,
  //   user ? { userId: user.userId as Id<"users"> } : "skip"
  // );

  const currentUser = useQuery(
    api.auth.getCurrentUser,
    user ? { userId: user.userId as Id<'users'> } : 'skip'
  );

  // const updateProfile = useMutation(api.candidates.updateCandidateProfile);
  const updateUser = useMutation(api.auth.updateUser);
  const uploadImage = useMutation(api.files.uploadProfileImage);

  useEffect(() => {
    loadUserData();
  }, []);

  // useEffect(() => {
  //   if (currentUser && candidateProfile) {
  //     setFormData({
  //       firstName: currentUser.firstName || '',
  //       lastName: currentUser.lastName || '',
  //       email: currentUser.email || '',
  //       phone: currentUser.phone || '',
  //       skills: candidateProfile.skills.join(', ') || '',
  //       experience: candidateProfile.experience?.toString() || '0',
  //       education: candidateProfile.education || '',
  //       location: candidateProfile.location || '',
  //       summary: candidateProfile.summary || '',
  //       linkedinUrl: candidateProfile.linkedinUrl || '',
  //       githubUrl: candidateProfile.githubUrl || '',
  //     });

  //     if (currentUser.profileImage) {
  //       // In a real app, you'd get the image URL from storage
  //       setProfileImage(currentUser.profileImage);
  //     }
  //   }
  // }, [currentUser, candidateProfile]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'candidate') {
          Alert.alert('Access Denied', 'This section is for candidates only');
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

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImagePicker = () => {
    Alert.alert('Profile Picture', 'Choose an option', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    const {
      firstName,
      lastName,
      email,
      phone,
      skills,
      experience,
      education,
      location,
      summary,
      linkedinUrl,
      githubUrl,
    } = formData;

    if (!firstName || !lastName || !email) {
      Alert.alert('Error', 'Please fill in all required fields (Name and Email)');
      return;
    }

    if (isNaN(Number(experience)) || Number(experience) < 0) {
      Alert.alert('Error', 'Please enter a valid experience value');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    try {
      // Update user basic info
      await updateUser({
        userId: user.userId as Id<'users'>,
        firstName,
        lastName,
        phone: phone || undefined,
      });

      // Update candidate profile
      const skillsArray = skills
        .split(',')
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);

      // await updateProfile({
      //   userId: user.userId as Id<"users">,
      //   skills: skillsArray,
      //   experience: Number(experience),
      //   education,
      //   location,
      //   summary: summary || undefined,
      //   linkedinUrl: linkedinUrl || undefined,
      //   githubUrl: githubUrl || undefined,
      // });

      // Update local storage
      const updatedUser = { ...user, firstName, lastName };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
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
        <Header title="Edit Profile" showBack={true} />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Profile Picture Section */}
          <View style={styles.profileImageSection}>
            <TouchableOpacity style={styles.profileImageContainer} onPress={showImagePicker}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={48} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.profileImageText}>Tap to change profile picture</Text>
          </View>

          <View style={styles.form}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.firstName}
                    onChangeText={(value) => updateFormData('firstName', value)}
                    placeholder="John"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.lastName}
                    onChangeText={(value) => updateFormData('lastName', value)}
                    placeholder="Doe"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={formData.email}
                  editable={false}
                  placeholder="john.doe@example.com"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.helperText}>Email cannot be changed</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Professional Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional Information</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Skills</Text>
                <TextInput
                  style={styles.input}
                  value={formData.skills}
                  onChangeText={(value) => updateFormData('skills', value)}
                  placeholder="React, Node.js, TypeScript, Python (comma separated)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
                <Text style={styles.helperText}>Separate skills with commas</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Years of Experience</Text>
                <TextInput
                  style={styles.input}
                  value={formData.experience}
                  onChangeText={(value) => updateFormData('experience', value)}
                  placeholder="3"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Education</Text>
                <TextInput
                  style={styles.input}
                  value={formData.education}
                  onChangeText={(value) => updateFormData('education', value)}
                  placeholder="Bachelor's in Computer Science"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(value) => updateFormData('location', value)}
                  placeholder="San Francisco, CA"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Professional Summary</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.summary}
                  onChangeText={(value) => updateFormData('summary', value)}
                  placeholder="Brief description of your professional background and goals..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Social Links */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Social Links</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>LinkedIn URL</Text>
                <TextInput
                  style={styles.input}
                  value={formData.linkedinUrl}
                  onChangeText={(value) => updateFormData('linkedinUrl', value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>GitHub URL</Text>
                <TextInput
                  style={styles.input}
                  value={formData.githubUrl}
                  onChangeText={(value) => updateFormData('githubUrl', value)}
                  placeholder="https://github.com/yourusername"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
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
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileImageText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
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
  disabledInput: {
    backgroundColor: '#F9FAFB',
    color: '#9CA3AF',
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
  saveButton: {
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
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
