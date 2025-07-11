import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
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

export default function CreateQueryScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [category, setCategory] = useState<
    'candidate_selection' | 'interview_scheduling' | 'feedback_clarification' | 'general'
  >('general');
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [recipientModalVisible, setRecipientModalVisible] = useState(false);

  const adminUsers = useQuery(api.queries.getUsersByRole, { role: 'admin' });
  const hrUsers = useQuery(api.queries.getUsersByRole, { role: 'hr' });
  const createQuery = useMutation(api.queries.createQuery);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/auth/login');
    }
  };

  const getAvailableRecipients = () => {
    if (user?.role === 'hr') {
      return adminUsers || [];
    } else if (user?.role === 'admin') {
      return hrUsers || [];
    }
    return [];
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim() || !selectedRecipient) {
      Alert.alert('Error', 'Please fill in all required fields and select a recipient');
      return;
    }

    try {
      await createQuery({
        fromUserId: user!.userId as any,
        toUserId: selectedRecipient._id,
        subject: subject.trim(),
        message: message.trim(),
        priority,
        category,
      });

      Alert.alert('Success', 'Query sent successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error creating query:', error);
      Alert.alert('Error', 'Failed to send query');
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getCategoryLabel = (c: string) => {
    switch (c) {
      case 'candidate_selection':
        return 'Candidate Selection';
      case 'interview_scheduling':
        return 'Interview Scheduling';
      case 'feedback_clarification':
        return 'Feedback Clarification';
      case 'general':
        return 'General';
      default:
        return c;
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
      <Header title="Create Query" showBack={true} onBackPress={() => router.back()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>New Query</Text>
          <Text style={styles.formSubtitle}>
            Send a query to {user.role === 'hr' ? 'Admin' : 'HR'} team
          </Text>

          {/* Recipient Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Send To *</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setRecipientModalVisible(true)}
            >
              <Text style={[styles.selectorText, !selectedRecipient && styles.placeholderText]}>
                {selectedRecipient
                  ? `${selectedRecipient.firstName} ${selectedRecipient.lastName}`
                  : 'Select recipient'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Subject */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={styles.textInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Enter query subject"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Priority */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priority</Text>
            <TouchableOpacity style={styles.selector} onPress={() => setPriorityModalVisible(true)}>
              <View style={styles.priorityContainer}>
                <View
                  style={[styles.priorityDot, { backgroundColor: getPriorityColor(priority) }]}
                />
                <Text style={styles.selectorText}>{priority.toUpperCase()}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity style={styles.selector} onPress={() => setCategoryModalVisible(true)}>
              <Text style={styles.selectorText}>{getCategoryLabel(category)}</Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Message */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.textInput, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Enter your query message..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="send" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Send Query</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Recipient Modal */}
      <Modal
        visible={recipientModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRecipientModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Recipient</Text>
            <ScrollView style={styles.modalList}>
              {getAvailableRecipients().map((recipient: any) => (
                <TouchableOpacity
                  key={recipient._id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedRecipient(recipient);
                    setRecipientModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {recipient.firstName} {recipient.lastName}
                  </Text>
                  <Text style={styles.modalItemSubtext}>{recipient.email}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setRecipientModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Priority Modal */}
      <Modal
        visible={priorityModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPriorityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Priority</Text>
            {(['urgent', 'high', 'medium', 'low'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={styles.modalItem}
                onPress={() => {
                  setPriority(p);
                  setPriorityModalVisible(false);
                }}
              >
                <View style={styles.priorityContainer}>
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(p) }]} />
                  <Text style={styles.modalItemText}>{p.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setPriorityModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {(
              [
                'candidate_selection',
                'interview_scheduling',
                'feedback_clarification',
                'general',
              ] as const
            ).map((c) => (
              <TouchableOpacity
                key={c}
                style={styles.modalItem}
                onPress={() => {
                  setCategory(c);
                  setCategoryModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{getCategoryLabel(c)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCategoryModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  selector: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
});
