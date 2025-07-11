import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
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

export default function QueryDetailScreen() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const queries = useQuery(
    api.queries.getQueriesForUser,
    user ? { userId: user.userId as any } : 'skip'
  );
  const respondToQuery = useMutation(api.queries.respondToQuery);
  const updateQueryStatus = useMutation(api.queries.updateQueryStatus);
  const markResponseAsRead = useMutation(api.queries.markResponseAsRead);

  const query = queries?.find((q) => q._id === id);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (query && query.responses) {
      // Mark unread responses as read
      query.responses.forEach(async (response: any) => {
        if (!response.isRead && response.responderId !== user?.userId) {
          try {
            await markResponseAsRead({ responseId: response._id });
          } catch (error) {
            console.error('Error marking response as read:', error);
          }
        }
      });
    }
  }, [query, user]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSendResponse = async () => {
    if (!responseMessage.trim() || !query) {
      Alert.alert('Error', 'Please enter a response message');
      return;
    }

    try {
      await respondToQuery({
        queryId: query._id,
        responderId: user!.userId as any,
        message: responseMessage.trim(),
      });

      setResponseMessage('');
      Alert.alert('Success', 'Response sent successfully!');
    } catch (error) {
      console.error('Error sending response:', error);
      Alert.alert('Error', 'Failed to send response');
    }
  };

  const handleUpdateStatus = async (status: 'open' | 'in_progress' | 'resolved') => {
    if (!query) return;

    try {
      await updateQueryStatus({
        queryId: query._id,
        status,
      });
      Alert.alert('Success', `Query status updated to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#F59E0B';
      case 'in_progress':
        return '#3B82F6';
      case 'resolved':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'candidate_selection':
        return 'Candidate Selection';
      case 'interview_scheduling':
        return 'Interview Scheduling';
      case 'feedback_clarification':
        return 'Feedback Clarification';
      case 'general':
        return 'General';
      default:
        return category;
    }
  };

  if (!user || !query) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Query Details" showBack={true} onBackPress={() => router.back()} />
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canRespond = query.toUserId === user.userId || query.fromUserId === user.userId;
  const isOwner = query.fromUserId === user.userId;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Query Details" showBack={true} onBackPress={() => router.back()} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Query Header */}
        <View style={styles.queryHeader}>
          <View style={styles.queryMeta}>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(query.priority) },
                ]}
              >
                <Text style={styles.priorityText}>{query.priority.toUpperCase()}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(query.status) }]}>
                <Text style={styles.statusText}>
                  {query.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.categoryText}>{getCategoryLabel(query.category)}</Text>
          </View>

          <Text style={styles.querySubject}>{query.subject}</Text>

          <View style={styles.participantsRow}>
            <Text style={styles.participantText}>
              <Text style={styles.participantLabel}>From: </Text>
              {query.fromUserName}
            </Text>
            <Text style={styles.participantText}>
              <Text style={styles.participantLabel}>To: </Text>
              {query.toUserName}
            </Text>
          </View>

          <Text style={styles.queryDate}>
            Created: {new Date(query.createdAt).toLocaleDateString()} at{' '}
            {new Date(query.createdAt).toLocaleTimeString()}
          </Text>
        </View>

        {/* Original Message */}
        <View style={styles.messageContainer}>
          <View style={styles.messageHeader}>
            <Ionicons name="chatbubble" size={16} color="#3B82F6" />
            <Text style={styles.messageTitle}>Original Message</Text>
          </View>
          <Text style={styles.messageContent}>{query.message}</Text>
        </View>

        {/* Responses */}
        <View style={styles.responsesContainer}>
          <View style={styles.responsesHeader}>
            <Ionicons name="chatbubbles" size={16} color="#10B981" />
            <Text style={styles.responsesTitle}>Responses ({query.responses?.length || 0})</Text>
          </View>

          {query.responses?.map((response: any, index: number) => (
            <View key={response._id} style={styles.responseItem}>
              <View style={styles.responseHeader}>
                <Text style={styles.responderName}>
                  {response.responderId === user.userId
                    ? 'You'
                    : response.responderId === query.fromUserId
                      ? query.fromUserName
                      : query.toUserName}
                </Text>
                <Text style={styles.responseDate}>
                  {new Date(response.createdAt).toLocaleDateString()} at{' '}
                  {new Date(response.createdAt).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.responseContent}>{response.message}</Text>
              {!response.isRead && response.responderId !== user.userId && (
                <View style={styles.unreadIndicator}>
                  <Text style={styles.unreadText}>New</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Status Actions */}
        {canRespond && (
          <View style={styles.statusActions}>
            <Text style={styles.statusActionsTitle}>Update Status</Text>
            <View style={styles.statusButtonsRow}>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#F59E0B' }]}
                onPress={() => handleUpdateStatus('open')}
                disabled={query.status === 'open'}
              >
                <Text style={styles.statusButtonText}>Open</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#3B82F6' }]}
                onPress={() => handleUpdateStatus('in_progress')}
                disabled={query.status === 'in_progress'}
              >
                <Text style={styles.statusButtonText}>In Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#10B981' }]}
                onPress={() => handleUpdateStatus('resolved')}
                disabled={query.status === 'resolved'}
              >
                <Text style={styles.statusButtonText}>Resolved</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Response Input */}
        {canRespond && query.status !== 'resolved' && (
          <View style={styles.responseInput}>
            <Text style={styles.responseInputTitle}>Send Response</Text>
            <TextInput
              style={styles.textInput}
              value={responseMessage}
              onChangeText={setResponseMessage}
              placeholder="Type your response..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendResponse}>
              <Ionicons name="send" size={16} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Send Response</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  queryHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  queryMeta: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  querySubject: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  participantsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  participantText: {
    fontSize: 14,
    color: '#374151',
  },
  participantLabel: {
    fontWeight: '600',
  },
  queryDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  messageContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  responsesContainer: {
    margin: 16,
  },
  responsesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  responsesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  responseItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  responseDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  responseContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusActions: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  responseInput: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  responseInputTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
