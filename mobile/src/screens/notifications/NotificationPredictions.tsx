import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Card,
  Text,
  List,
  useTheme,
  Button,
  Portal,
  Dialog,
  Chip,
  IconButton,
  ProgressBar,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { format, addDays } from 'date-fns';
import NotificationPredictionService from '../../services/NotificationPredictionService';
import NotificationCategoryService, {
  NotificationCategory,
} from '../../services/NotificationCategoryService';
import { selectNotifications } from '../../store/slices/notificationSlice';
import { TreatmentPriority } from '../../types/therapeutic';
import WeatherAwarePredictionService from '../../services/WeatherAwarePredictionService';
import MLPredictionService from '../../services/MLPredictionService';

const NotificationPredictions = () => {
  const theme = useTheme();
  const notifications = useSelector(selectNotifications);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | null>(null);
  const [categoryStatsVisible, setCategoryStatsVisible] = useState(false);
  const [trendAnalysis, setTrendAnalysis] = useState<any>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [weatherAwarePredictions, setWeatherAwarePredictions] = useState<any[]>([]);
  const [mlPredictions, setMLPredictions] = useState<any[]>([]);

  useEffect(() => {
    loadPredictions();
    analyzeTrends();
    getCurrentLocation();
  }, [notifications]);

  const getCurrentLocation = async () => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadPredictions = async () => {
    const basePredictions = NotificationPredictionService.predictUpcomingNotifications(7);

    if (location) {
      // Get weather-aware predictions
      const weatherPredictions = await WeatherAwarePredictionService.getWeatherAwarePredictions(
        basePredictions,
        location.latitude,
        location.longitude
      );
      setWeatherAwarePredictions(weatherPredictions);

      // Get ML-enhanced predictions
      const mlResults = await Promise.all(
        weatherPredictions.map(async (prediction) => {
          const mlResult = await MLPredictionService.predictSuccess(prediction);
          return {
            ...prediction,
            mlProbability: mlResult.probability,
            mlConfidence: mlResult.confidence,
            suggestedTime: mlResult.suggestedTime,
            impactFactors: mlResult.factors,
          };
        })
      );
      setMLPredictions(mlResults);
    }
  };

  const analyzeTrends = () => {
    const analysis = NotificationPredictionService.analyzeTrends(notifications);
    setTrendAnalysis(analysis);
  };

  const handleCategorySelect = (category: NotificationCategory) => {
    setSelectedCategory(category);
    setCategoryStatsVisible(true);
  };

  const renderPredictionCard = (prediction: any) => {
    const category = NotificationCategoryService.getCategoryById(prediction.category);
    const mlPrediction = mlPredictions.find(
      (p) => p.predictedDate === prediction.predictedDate && p.category === prediction.category
    );
    
    return (
      <Card style={styles.predictionCard} key={`${prediction.predictedDate}-${prediction.category}`}>
        <Card.Content>
          <View style={styles.predictionHeader}>
            <List.Icon icon={category?.icon || 'bell'} color={category?.color} />
            <View style={styles.predictionInfo}>
              <Text style={styles.predictionTitle}>{category?.name || 'Notification'}</Text>
              <Text style={styles.predictionDate}>
                {format(new Date(prediction.predictedDate), 'EEEE, MMMM d')}
              </Text>
              <Text style={styles.predictionTime}>{prediction.timeOfDay}</Text>
            </View>
          </View>

          {prediction.weatherImpacts && (
            <View style={styles.weatherContainer}>
              <Text style={styles.weatherTitle}>Weather Impact</Text>
              {prediction.weatherImpacts.map((impact: any, index: number) => (
                <Chip
                  key={index}
                  style={[
                    styles.impactChip,
                    {
                      backgroundColor:
                        impact.impact === 'high'
                          ? '#FF6B6B'
                          : impact.impact === 'medium'
                          ? '#FFB366'
                          : '#66CC66',
                    },
                  ]}
                  textStyle={{ color: 'white' }}
                >
                  {impact.recommendation}
                </Chip>
              ))}
            </View>
          )}

          {mlPrediction && (
            <View style={styles.mlContainer}>
              <Text style={styles.mlTitle}>ML Insights</Text>
              <View style={styles.mlStats}>
                <View style={styles.mlStat}>
                  <Text style={styles.mlStatLabel}>Success Probability</Text>
                  <Text style={styles.mlStatValue}>
                    {(mlPrediction.mlProbability * 100).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.mlStat}>
                  <Text style={styles.mlStatLabel}>Suggested Time</Text>
                  <Text style={styles.mlStatValue}>{mlPrediction.suggestedTime}</Text>
                </View>
              </View>
              <View style={styles.factorsContainer}>
                <Text style={styles.factorsTitle}>Key Factors</Text>
                {mlPrediction.impactFactors.slice(0, 3).map((factor: any, index: number) => (
                  <View key={index} style={styles.factor}>
                    <Text style={styles.factorName}>{factor.name}</Text>
                    <ProgressBar
                      progress={factor.impact}
                      color={theme.colors.primary}
                      style={styles.factorBar}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Overall Confidence</Text>
            <ProgressBar
              progress={
                (prediction.adjustedConfidence * (mlPrediction?.mlConfidence || 100)) / 10000
              }
              color={theme.colors.primary}
              style={styles.confidenceBar}
            />
            <Text style={styles.confidenceValue}>
              {Math.round((prediction.adjustedConfidence * (mlPrediction?.mlConfidence || 100)) / 100)}%
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderCategoryStats = () => {
    if (!selectedCategory) return null;

    const stats = NotificationCategoryService.getCategoryStats(selectedCategory.id);
    const optimalTimes = NotificationPredictionService.suggestOptimalTimes(selectedCategory.id);

    return (
      <Portal>
        <Dialog visible={categoryStatsVisible} onDismiss={() => setCategoryStatsVisible(false)}>
          <Dialog.Title>{selectedCategory.name} Statistics</Dialog.Title>
          <Dialog.Content>
            <List.Item
              title="Total Notifications"
              description={stats.totalNotifications.toString()}
              left={props => <List.Icon {...props} icon="bell-outline" />}
            />
            <List.Item
              title="Read Rate"
              description={`${(stats.readRate * 100).toFixed(1)}%`}
              left={props => <List.Icon {...props} icon="check" />}
            />
            <List.Item
              title="Average Response Time"
              description={`${(stats.averageResponseTime / (1000 * 60)).toFixed(1)} minutes`}
              left={props => <List.Icon {...props} icon="clock-outline" />}
            />
            <Text style={styles.sectionTitle}>Optimal Times</Text>
            <View style={styles.timeChips}>
              {optimalTimes.map((time, index) => (
                <Chip key={index} style={styles.timeChip}>
                  {time}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCategoryStatsVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };

  const renderTrendAnalysis = () => {
    if (!trendAnalysis) return null;

    return (
      <Card style={styles.trendCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Notification Patterns</Text>
          <View style={styles.patternContainer}>
            <List.Item
              title="Peak Days"
              description={trendAnalysis.peakDays.join(', ')}
              left={props => <List.Icon {...props} icon="calendar" />}
            />
            <List.Item
              title="Peak Times"
              description={trendAnalysis.peakTimes.join(', ')}
              left={props => <List.Icon {...props} icon="clock" />}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.headerTitle}>Notification Predictions</Text>
          <Text style={styles.headerSubtitle}>
            Next 7 days based on your notification patterns
          </Text>
        </Card.Content>
      </Card>

      {renderTrendAnalysis()}

      <Text style={[styles.sectionTitle, styles.categoryTitle]}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {NotificationCategoryService.getCategories().map((category) => (
          <Chip
            key={category.id}
            style={[styles.categoryChip, { backgroundColor: category.color }]}
            textStyle={{ color: 'white' }}
            icon={category.icon}
            onPress={() => handleCategorySelect(category)}
          >
            {category.name}
          </Chip>
        ))}
      </ScrollView>

      <Text style={[styles.sectionTitle, styles.predictionsTitle]}>Upcoming Predictions</Text>
      {weatherAwarePredictions.map(renderPredictionCard)}

      {renderCategoryStats()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  categoryTitle: {
    marginTop: 16,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
    height: 36,
  },
  predictionsTitle: {
    marginTop: 8,
  },
  predictionCard: {
    marginBottom: 12,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictionInfo: {
    flex: 1,
    marginLeft: 8,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  predictionDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  predictionTime: {
    fontSize: 12,
    opacity: 0.5,
  },
  confidenceContainer: {
    marginTop: 12,
  },
  confidenceLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  confidenceBar: {
    height: 6,
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 12,
    opacity: 0.7,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  trendCard: {
    marginVertical: 16,
  },
  patternContainer: {
    marginTop: 8,
  },
  timeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  timeChip: {
    margin: 4,
  },
  weatherContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  weatherTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  impactChip: {
    marginVertical: 4,
  },
  mlContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  mlTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mlStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mlStat: {
    flex: 1,
  },
  mlStatLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  mlStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  factorsContainer: {
    marginTop: 8,
  },
  factorsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  factor: {
    marginVertical: 2,
  },
  factorName: {
    fontSize: 12,
    opacity: 0.7,
  },
  factorBar: {
    height: 4,
    borderRadius: 2,
  },
});

export default NotificationPredictions;
