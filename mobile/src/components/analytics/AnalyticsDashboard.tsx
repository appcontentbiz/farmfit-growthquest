import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, useTheme, Button, FAB, Portal } from 'react-native-paper';
import AdvancedVisualization from './AdvancedVisualization';
import ExperimentManager from './ExperimentManager';
import StatisticalAnalysisService from '../../services/StatisticalAnalysisService';
import ExperimentManagementService from '../../services/ExperimentManagementService';

interface AnalyticsDashboardProps {
  modelId?: string;
  onInsightGenerated?: (insight: string) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  modelId,
  onInsightGenerated,
}) => {
  const theme = useTheme();
  const [activeExperiments, setActiveExperiments] = useState<any[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [modelId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load active experiments
      const experiments = await ExperimentManagementService.getActiveExperiments();
      setActiveExperiments(experiments);

      // Load and analyze results
      if (experiments.length > 0) {
        const results = await Promise.all(
          experiments.map(exp =>
            ExperimentManagementService.getExperimentResults(exp.id)
          )
        );

        const analysis = await StatisticalAnalysisService.analyzeResults({
          experiments,
          results,
        });

        setAnalysisResults(analysis);

        // Generate insights
        if (onInsightGenerated) {
          analysis.recommendations.forEach((insight: string) => {
            onInsightGenerated(insight);
          });
        }
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderPerformanceMetrics = () => (
    <Card style={styles.card}>
      <Card.Title title="Performance Metrics" />
      <Card.Content>
        {analysisResults?.metrics && (
          <AdvancedVisualization
            data={analysisResults.metrics}
            type="timeSeries"
            config={{
              title: 'Metric Trends',
              xLabel: 'Time',
              yLabel: 'Value',
              interactive: true,
              showLegend: true,
            }}
          />
        )}
      </Card.Content>
    </Card>
  );

  const renderDistributionAnalysis = () => (
    <Card style={styles.card}>
      <Card.Title title="Distribution Analysis" />
      <Card.Content>
        {analysisResults?.distributions && (
          <AdvancedVisualization
            data={analysisResults.distributions}
            type="distribution"
            config={{
              title: 'Metric Distributions',
              xLabel: 'Value',
              yLabel: 'Frequency',
            }}
          />
        )}
      </Card.Content>
    </Card>
  );

  const renderCorrelationAnalysis = () => (
    <Card style={styles.card}>
      <Card.Title title="Correlation Analysis" />
      <Card.Content>
        {analysisResults?.correlations && (
          <AdvancedVisualization
            data={analysisResults.correlations}
            type="correlation"
            config={{
              title: 'Metric Correlations',
              interactive: true,
            }}
          />
        )}
      </Card.Content>
    </Card>
  );

  const renderComparativeAnalysis = () => (
    <Card style={styles.card}>
      <Card.Title title="Comparative Analysis" />
      <Card.Content>
        {analysisResults?.comparisons && (
          <AdvancedVisualization
            data={analysisResults.comparisons}
            type="comparison"
            config={{
              title: 'Experiment Comparisons',
              xLabel: 'Experiment',
              yLabel: 'Value',
              showLegend: true,
            }}
          />
        )}
      </Card.Content>
    </Card>
  );

  const renderActiveExperiments = () => (
    <Card style={styles.card}>
      <Card.Title title="Active Experiments" />
      <Card.Content>
        <ExperimentManager
          modelId={modelId}
          onExperimentComplete={loadDashboardData}
        />
      </Card.Content>
    </Card>
  );

  const renderInsights = () => (
    <Card style={styles.card}>
      <Card.Title title="Key Insights" />
      <Card.Content>
        {analysisResults?.recommendations.map((insight: string, index: number) => (
          <Text key={index} style={styles.insight}>
            • {insight}
          </Text>
        ))}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Button mode="contained" onPress={loadDashboardData}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {renderPerformanceMetrics()}
        {renderDistributionAnalysis()}
        {renderCorrelationAnalysis()}
        {renderComparativeAnalysis()}
        {renderActiveExperiments()}
        {renderInsights()}
      </ScrollView>

      <Portal>
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'refresh',
              label: 'Refresh Data',
              onPress: loadDashboardData,
            },
            {
              icon: 'chart-bar',
              label: 'New Analysis',
              onPress: () => {
                // Handle new analysis
              },
            },
            {
              icon: 'flask',
              label: 'New Experiment',
              onPress: () => {
                // Handle new experiment
              },
            },
            {
              icon: 'export',
              label: 'Export Results',
              onPress: () => {
                // Handle export
              },
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
        />
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  insight: {
    marginBottom: 8,
  },
});

export default AnalyticsDashboard;
