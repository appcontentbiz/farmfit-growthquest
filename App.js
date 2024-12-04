import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import MarketScreen from './src/screens/MarketScreen';
import EducationScreen from './src/screens/EducationScreen';
import SpeechToTextScreen from './src/screens/SpeechToTextScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import ARScreen from './src/screens/ARScreen';
import IoTDashboardScreen from './src/screens/IoTDashboardScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <View style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'FarmFit!' }}
          />
          <Stack.Screen name="Weather" component={WeatherScreen} />
          <Stack.Screen name="Market" component={MarketScreen} />
          <Stack.Screen name="Education" component={EducationScreen} />
          <Stack.Screen name="SpeechToText" component={SpeechToTextScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="AR" component={ARScreen} />
          <Stack.Screen name="IoTDashboard" component={IoTDashboardScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
