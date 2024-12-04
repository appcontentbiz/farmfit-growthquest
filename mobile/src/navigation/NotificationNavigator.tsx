import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from 'react-native-paper';
import NotificationHistory from '../screens/notifications/NotificationHistory';
import NotificationAnalytics from '../screens/notifications/NotificationAnalytics';
import NotificationSettings from '../screens/settings/NotificationSettings';

const Tab = createMaterialTopTabNavigator();

const NotificationNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: theme.colors.surface },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.disabled,
        tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
      }}
    >
      <Tab.Screen
        name="History"
        component={NotificationHistory}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => (
            <List.Icon icon="history" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={NotificationAnalytics}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color }) => (
            <List.Icon icon="chart-bar" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={NotificationSettings}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <List.Icon icon="cog" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default NotificationNavigator;
