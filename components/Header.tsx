import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
  onMenuPress?: () => void;
  rightComponent?: React.ReactNode;
}

export default function Header({
  title,
  showBack = false,
  showMenu = false,
  onMenuPress,
  rightComponent,
}: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        )}
        {showMenu && (
          <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
            <Ionicons name="menu" size={24} color="#1F2937" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.rightSection}>
        {rightComponent || <View style={styles.placeholder} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
});
