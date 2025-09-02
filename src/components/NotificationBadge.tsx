import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNotifications } from '../services/NotificationContext';

interface NotificationBadgeProps {
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  onPress, 
  size = 'medium' 
}) => {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) {
    return null;
  }

  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 16, height: 16, fontSize: 10 };
      case 'large':
        return { width: 24, height: 24, fontSize: 14 };
      default:
        return { width: 20, height: 20, fontSize: 12 };
    }
  };

  const badgeStyle = getBadgeSize();

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={[styles.badge, { width: badgeStyle.width, height: badgeStyle.height }]}>
        <Text style={[styles.badgeText, { fontSize: badgeStyle.fontSize }]}>
          {unreadCount > 99 ? '99+' : unreadCount.toString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default NotificationBadge;
