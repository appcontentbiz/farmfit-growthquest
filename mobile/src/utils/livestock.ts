import { HealthMetric, HealthStatus, AlertSeverity } from '../types/livestock';

export const calculateHealthScore = (metrics: HealthMetric[]): number => {
  if (!metrics || metrics.length === 0) return 0;

  const latestMetrics = metrics[metrics.length - 1];
  
  // Define normal ranges for vital signs
  const normalRanges = {
    temperature: { min: 38.0, max: 39.5, weight: 0.3 },
    heartRate: { min: 60, max: 80, weight: 0.3 },
    respirationRate: { min: 12, max: 24, weight: 0.2 },
    feedIntake: { min: 0.8, max: 1.2, weight: 0.1 }, // Relative to normal
    waterIntake: { min: 0.8, max: 1.2, weight: 0.1 }, // Relative to normal
  };

  let score = 0;
  let totalWeight = 0;

  // Calculate score for each vital sign
  Object.entries(normalRanges).forEach(([metric, range]) => {
    const value = latestMetrics[metric as keyof HealthMetric];
    if (typeof value === 'number') {
      const normalized = calculateNormalizedScore(value, range.min, range.max);
      score += normalized * range.weight;
      totalWeight += range.weight;
    }
  });

  // Normalize final score to 0-100 range
  return Math.round((score / totalWeight) * 100);
};

const calculateNormalizedScore = (value: number, min: number, max: number): number => {
  if (value < min) {
    return 1 - Math.min(1, (min - value) / min);
  } else if (value > max) {
    return 1 - Math.min(1, (value - max) / max);
  }
  return 1;
};

export const determineHealthStatus = (score: number): HealthStatus => {
  if (score >= 80) return 'HEALTHY';
  if (score >= 60) return 'ATTENTION';
  return 'CRITICAL';
};

export const getAlertSeverity = (value: number, threshold: number): AlertSeverity => {
  const deviation = Math.abs((value - threshold) / threshold);
  if (deviation > 0.3) return 'CRITICAL';
  if (deviation > 0.2) return 'HIGH';
  if (deviation > 0.1) return 'MEDIUM';
  return 'LOW';
};

export const analyzeTrends = (metrics: HealthMetric[], days: number = 7) => {
  const recentMetrics = metrics.slice(-days);
  if (recentMetrics.length < 2) return null;

  const trends = {
    temperature: calculateTrend(recentMetrics.map(m => m.temperature)),
    heartRate: calculateTrend(recentMetrics.map(m => m.heartRate)),
    respirationRate: calculateTrend(recentMetrics.map(m => m.respirationRate)),
    feedIntake: calculateTrend(recentMetrics.map(m => m.feedIntake).filter(Boolean) as number[]),
    waterIntake: calculateTrend(recentMetrics.map(m => m.waterIntake).filter(Boolean) as number[]),
  };

  return trends;
};

const calculateTrend = (values: number[]): { trend: 'UP' | 'DOWN' | 'STABLE'; change: number } => {
  if (values.length < 2) return { trend: 'STABLE', change: 0 };

  const first = values[0];
  const last = values[values.length - 1];
  const change = ((last - first) / first) * 100;

  if (Math.abs(change) < 5) return { trend: 'STABLE', change };
  return { trend: change > 0 ? 'UP' : 'DOWN', change };
};

export const predictHealthMetrics = (
  metrics: HealthMetric[],
  daysToPredict: number = 7
): { value: number; confidence: number }[] => {
  // Simple linear regression for prediction
  const xValues = metrics.map((_, i) => i);
  const yValues = metrics.map(m => m.score);

  const { slope, intercept } = calculateLinearRegression(xValues, yValues);

  const predictions = [];
  for (let i = 1; i <= daysToPredict; i++) {
    const predictedValue = slope * (xValues.length + i) + intercept;
    const confidence = calculatePredictionConfidence(slope, metrics.length);
    predictions.push({
      value: Math.max(0, Math.min(100, predictedValue)),
      confidence,
    });
  }

  return predictions;
};

const calculateLinearRegression = (x: number[], y: number[]) => {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumXX = x.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

const calculatePredictionConfidence = (slope: number, sampleSize: number): number => {
  // Simple confidence calculation based on slope stability and sample size
  const slopeConfidence = Math.min(1, Math.abs(slope) < 0.1 ? 0.9 : 0.7);
  const sampleConfidence = Math.min(1, sampleSize / 30);
  return Math.round((slopeConfidence * 0.7 + sampleConfidence * 0.3) * 100) / 100;
};

export const formatHealthMetric = (value: number, metric: string): string => {
  switch (metric.toLowerCase()) {
    case 'temperature':
      return `${value.toFixed(1)}°C`;
    case 'heartrate':
      return `${Math.round(value)} bpm`;
    case 'respirationrate':
      return `${Math.round(value)} /min`;
    case 'feedintake':
    case 'waterintake':
      return `${value.toFixed(1)} kg`;
    default:
      return value.toString();
  }
};
