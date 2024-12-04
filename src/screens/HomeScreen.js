import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const MenuItem = ({ title, icon, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Image source={icon} style={styles.menuIcon} />
    <Text style={styles.menuText}>{title}</Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const navigation = useNavigation();

  const menuItems = [
    { title: 'Weather Forecast', screen: 'Weather', icon: require('../assets/icons/weather.png') },
    { title: 'Market Prices', screen: 'Market', icon: require('../assets/icons/market.png') },
    { title: 'Education Hub', screen: 'Education', icon: require('../assets/icons/education.png') },
    { title: 'Voice Notes', screen: 'SpeechToText', icon: require('../assets/icons/voice.png') },
    { title: 'Payments', screen: 'Payment', icon: require('../assets/icons/payment.png') },
    { title: 'Farm AR View', screen: 'AR', icon: require('../assets/icons/ar.png') },
    { title: 'IoT Dashboard', screen: 'IoTDashboard', icon: require('../assets/icons/iot.png') },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome to FarmFit!</Text>
        <Text style={styles.headerSubtitle}>Your Smart Farming Assistant</Text>
      </View>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            title={item.title}
            icon={item.icon}
            onPress={() => navigation.navigate(item.screen)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-around',
  },
  menuItem: {
    width: '45%',
    backgroundColor: '#fff',
    padding: 15,
    margin: 5,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuIcon: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
});
