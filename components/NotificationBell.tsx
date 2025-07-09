import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface NotificationBellProps {
  userId: string;
  onPress: () => void;
}

export default function NotificationBell({ userId, onPress }: NotificationBellProps) {
  const unreadCount = useQuery(api.notifications.getUnreadCount, {
    userId: userId as Id<'users'>,
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Ionicons name="notifications" size={24} color="#1F2937" />
      {unreadCount && unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount.toString()}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
