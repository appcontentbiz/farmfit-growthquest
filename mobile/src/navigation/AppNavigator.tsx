import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import LivestockDashboard from '../screens/livestock/LivestockDashboard';
import LivestockDetail from '../screens/livestock/LivestockDetail';
import HealthMonitoring from '../screens/livestock/HealthMonitoring';
import ServicesDirectory from '../screens/services/ServicesDirectory';
import ServiceDetail from '../screens/services/ServiceDetail';
import LearningHub from '../screens/learning/LearningHub';
import CourseDetail from '../screens/learning/CourseDetail';
import Analytics from '../screens/analytics/Analytics';
import Profile from '../screens/profile/Profile';
import Settings from '../screens/settings/Settings';
import NotificationNavigator from './NotificationNavigator';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const LivestockStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="LivestockDashboard" 
      component={LivestockDashboard}
      options={{ title: 'Livestock Overview' }}
    />
    <Stack.Screen 
      name="LivestockDetail" 
      component={LivestockDetail}
      options={({ route }) => ({ title: route.params?.name || 'Livestock Detail' })}
    />
    <Stack.Screen 
      name="HealthMonitoring" 
      component={HealthMonitoring}
      options={{ title: 'Health Monitoring' }}
    />
  </Stack.Navigator>
);

const ServicesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ServicesDirectory" 
      component={ServicesDirectory}
      options={{ title: 'Services' }}
    />
    <Stack.Screen 
      name="ServiceDetail" 
      component={ServiceDetail}
      options={({ route }) => ({ title: route.params?.name || 'Service Detail' })}
    />
  </Stack.Navigator>
);

const LearningStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="LearningHub" 
      component={LearningHub}
      options={{ title: 'Learning' }}
    />
    <Stack.Screen 
      name="CourseDetail" 
      component={CourseDetail}
      options={({ route }) => ({ title: route.params?.name || 'Course Detail' })}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              switch (route.name) {
                case 'Livestock':
                  iconName = focused ? 'cow' : 'cow-outline';
                  break;
                case 'Services':
                  iconName = focused ? 'store' : 'store-outline';
                  break;
                case 'Learning':
                  iconName = focused ? 'school' : 'school-outline';
                  break;
                case 'Analytics':
                  iconName = focused ? 'chart-box' : 'chart-box-outline';
                  break;
                case 'Profile':
                  iconName = focused ? 'account' : 'account-outline';
                  break;
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
          })}
          tabBarOptions={{
            activeTintColor: '#2E7D32',
            inactiveTintColor: 'gray',
            style: {
              paddingBottom: 5,
              height: 60,
            },
          }}
        >
          <Tab.Screen name="Livestock" component={LivestockStack} />
          <Tab.Screen name="Services" component={ServicesStack} />
          <Tab.Screen name="Learning" component={LearningStack} />
          <Tab.Screen name="Analytics" component={Analytics} />
          <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationNavigator}
        options={{
          title: 'Notifications',
          headerRight: () => (
            <Icon.Button
              name="bell-badge"
              onPress={() => {}}
              size={24}
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
