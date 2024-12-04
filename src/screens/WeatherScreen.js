import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import * as Location from 'expo-location';

const WeatherScreen = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeatherData = async () => {
    try {
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Fetch weather data from OpenWeatherMap API
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=YOUR_API_KEY`
      );
      const data = await response.json();

      if (response.ok) {
        setWeather(data);
        setError(null);
      } else {
        setError('Failed to fetch weather data');
      }
    } catch (err) {
      setError('Error fetching weather data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchWeatherData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {weather && (
        <View style={styles.weatherContainer}>
          <View style={styles.mainInfo}>
            <Text style={styles.temperature}>
              {Math.round(weather.main.temp)}°C
            </Text>
            <Text style={styles.description}>
              {weather.weather[0].description}
            </Text>
          </View>

          <View style={styles.detailsContainer}>
            <WeatherDetail
              title="Humidity"
              value={`${weather.main.humidity}%`}
            />
            <WeatherDetail
              title="Wind Speed"
              value={`${weather.wind.speed} m/s`}
            />
            <WeatherDetail
              title="Pressure"
              value={`${weather.main.pressure} hPa`}
            />
            <WeatherDetail
              title="Feels Like"
              value={`${Math.round(weather.main.feels_like)}°C`}
            />
          </View>

          <View style={styles.forecastNote}>
            <Text style={styles.noteText}>
              Weather conditions are suitable for field work today.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const WeatherDetail = ({ title, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailTitle}>{title}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherContainer: {
    padding: 20,
  },
  mainInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  temperature: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 24,
    color: '#666',
    textTransform: 'capitalize',
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  detailItem: {
    width: '48%',
    padding: 10,
    marginVertical: 5,
  },
  detailTitle: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  forecastNote: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
  },
  noteText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
  },
});

export default WeatherScreen;
