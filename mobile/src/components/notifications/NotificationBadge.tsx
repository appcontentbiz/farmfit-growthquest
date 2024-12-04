import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { selectUnreadNotifications } from '../../store/slices/notificationSlice';

interface NotificationBadgeProps {
  size?: number;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ size = 18 }) => {
  const theme = useTheme();
  const unreadNotifications = useSelector(selectUnreadNotifications);
  
  if (unreadNotifications.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors.notification,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: theme.colors.surface,
            fontSize: size * 0.6,
          },
        ]}
      >
        {unreadNotifications.length > 99 ? '99+' : unreadNotifications.length}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
});

export default NotificationBadge;
