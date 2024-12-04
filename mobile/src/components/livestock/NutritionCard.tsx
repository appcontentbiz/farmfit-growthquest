import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Text, Button, useTheme, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NutritionPlan, HealthMetric } from '../../types/livestock';

interface Props {
  nutritionPlan: NutritionPlan;
  recentMetrics: HealthMetric[];
  onEditPlan: () => void;
}

const NutritionCard: React.FC<Props> = ({
  nutritionPlan,
  recentMetrics,
  onEditPlan,
}) => {
  const theme = useTheme();

  // Calculate daily intake progress
  const latestMetric = recentMetrics[recentMetrics.length - 1];
  const feedProgress = latestMetric ? 
    (latestMetric.feedIntake || 0) / nutritionPlan.dailyAmount : 0;
  const waterProgress = latestMetric ? 
    (latestMetric.waterIntake || 0) / (nutritionPlan.dailyAmount * 2) : 0; // Assuming water intake should be ~2x feed

  const getProgressColor = (progress: number) => {
    if (progress < 0.6) return theme.colors.error;
    if (progress < 0.8) return theme.colors.warning;
    if (progress <= 1.2) return theme.colors.primary;
    return theme.colors.error;
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon name="food-apple" size={24} color={theme.colors.primary} />
            <Title style={styles.title}>Nutrition Plan</Title>
          </View>
          <Button
            mode="contained"
            onPress={onEditPlan}
            style={styles.editButton}
          >
            Edit Plan
          </Button>
        </View>

        <View style={styles.planDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Feed Type:</Text>
            <Text style={styles.value}>{nutritionPlan.feedType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Daily Amount:</Text>
            <Text style={styles.value}>{nutritionPlan.dailyAmount} kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Frequency:</Text>
            <Text style={styles.value}>{nutritionPlan.frequency}x daily</Text>
          </View>
        </View>

        {nutritionPlan.supplements && nutritionPlan.supplements.length > 0 && (
          <View style={styles.supplements}>
            <Text style={styles.supplementsTitle}>Supplements:</Text>
            <View style={styles.supplementsList}>
              {nutritionPlan.supplements.map((supplement, index) => (
                <View key={index} style={styles.supplementItem}>
                  <Icon name="pill" size={16} color={theme.colors.primary} />
                  <Text style={styles.supplementText}>{supplement}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.intakeTracking}>
          <Text style={styles.trackingTitle}>Today's Intake</Text>
          
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Feed</Text>
              <Text style={[
                styles.progressValue,
                { color: getProgressColor(feedProgress) }
              ]}>
                {Math.round(feedProgress * 100)}%
              </Text>
            </View>
            <ProgressBar
              progress={feedProgress}
              color={getProgressColor(feedProgress)}
              style={styles.progressBar}
            />
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Water</Text>
              <Text style={[
                styles.progressValue,
                { color: getProgressColor(waterProgress) }
              ]}>
                {Math.round(waterProgress * 100)}%
              </Text>
            </View>
            <ProgressBar
              progress={waterProgress}
              color={getProgressColor(waterProgress)}
              style={styles.progressBar}
            />
          </View>
        </View>

        {nutritionPlan.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{nutritionPlan.notes}</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 8,
    fontSize: 18,
  },
  editButton: {
    borderRadius: 20,
  },
  planDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    opacity: 0.7,
  },
  value: {
    fontWeight: 'bold',
  },
  supplements: {
    marginBottom: 16,
  },
  supplementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  supplementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  supplementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  supplementText: {
    marginLeft: 4,
  },
  intakeTracking: {
    marginBottom: 16,
  },
  trackingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    opacity: 0.7,
  },
  progressValue: {
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  notes: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    opacity: 0.7,
  },
});

export default NutritionCard;
