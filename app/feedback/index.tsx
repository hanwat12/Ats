
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

export default function FeedbackScreen() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('submit');
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    message: '',
  });

  const allFeedback = useQuery(api.feedback.getAllFeedback);
  const submitFeedback = useMutation(api.feedback.submitFeedback);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData(prev => ({
          ...prev,
          name: `${parsedUser.firstName} ${parsedUser.lastName}`,
          role: parsedUser.role.toUpperCase(),
        }));
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/auth/login');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!formData.name || !formData.role || !formData.message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await submitFeedback({
        name: formData.name,
        role: formData.role,
        message: formData.message,
        submittedBy: user.userId as any,
      });

      Alert.alert('Success', 'Feedback submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setFormData(prev => ({ ...prev, message: '' }));
            setFeedbackModalVisible(false);
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  const renderSubmitTab = () => (
    <View style={styles.submitContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Submit Feedback</Text>
        <Text style={styles.cardDescription}>
          Share your thoughts about the application or suggest improvements
        </Text>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => setFeedbackModalVisible(true)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>Write Feedback</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#3B82F6" />
        <Text style={styles.infoText}>
          Your feedback helps us improve the application and provide better user experience.
        </Text>
      </View>
    </View>
  );

  const renderViewTab = () => (
    <ScrollView style={styles.viewContainer}>
      {allFeedback?.map((feedback) => (
        <View key={feedback._id} style={styles.feedbackCard}>
          <View style={styles.feedbackHeader}>
            <View>
              <Text style={styles.feedbackName}>{feedback.name}</Text>
              <Text style={styles.feedbackRole}>{feedback.role}</Text>
            </View>
            <Text style={styles.feedbackDate}>
              {new Date(feedback.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.feedbackMessage}>{feedback.message}</Text>
          <Text style={styles.feedbackSubmitter}>
            Submitted by: {feedback.submitterName}
          </Text>
        </View>
      ))}

      {!allFeedback?.length && (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No feedback submitted yet</Text>
        </View>
      )}
    </ScrollView>
  );

  if (!user) {
    return <View style={styles.loading}><Text>Loading...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'submit' && styles.activeTab]}
          onPress={() => setActiveTab('submit')}
        >
          <Text style={[styles.tabText, activeTab === 'submit' && styles.activeTabText]}>
            Submit
          </Text>
        </TouchableOpacity>
        {user.role === 'admin' && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'view' && styles.activeTab]}
            onPress={() => setActiveTab('view')}
          >
            <Text style={[styles.tabText, activeTab === 'view' && styles.activeTabText]}>
              View All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'submit' && renderSubmitTab()}
      {activeTab === 'view' && renderViewTab()}

      <Modal visible={feedbackModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Feedback</Text>
            <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.form}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Your name"
              />

              <Text style={styles.label}>Role</Text>
              <TextInput
                style={styles.input}
                value={formData.role}
                onChangeText={(text) => setFormData(prev => ({ ...prev, role: text }))}
                placeholder="Your role"
              />

              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={formData.message}
                onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
                placeholder="Share your feedback, suggestions, or report issues..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.modalSubmitButton} onPress={handleSubmitFeedback}>
                <Ionicons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.modalSubmitButtonText}>Submit Feedback</Text>
              </TouchableOpacity>
            </View>
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
  submitContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#EBF8FF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  viewContainer: {
    flex: 1,
    padding: 16,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feedbackName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  feedbackRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  feedbackDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  feedbackMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  feedbackSubmitter: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
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
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalSubmitButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
