import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import {
  Card,
  Text,
  useTheme,
  Button,
  SegmentedButtons,
  Portal,
  Modal,
  Checkbox,
  List,
} from 'react-native-paper';
import {
  VictoryChart,
  VictoryScatter,
  VictoryHeatMap,
  VictoryBoxPlot,
  VictoryArea,
  VictoryAxis,
  VictoryTheme,
  VictoryLabel,
  VictoryVoronoiContainer,
  VictoryTooltip,
  VictoryLegend,
} from 'victory-native';
import { format } from 'date-fns';

interface DataPoint {
  x: number | Date;
  y: number;
  category?: string;
  value?: number;
  label?: string;
}

interface AdvancedVisualizationsProps {
  data: {
    timeSeriesData: DataPoint[];
    correlationData: DataPoint[];
    distributionData: DataPoint[];
    heatmapData: { x: number; y: number; heat: number }[];
    categoryData: { [key: string]: DataPoint[] };
  };
  onFilterChange?: (filters: string[]) => void;
}

const AdvancedVisualizations: React.FC<AdvancedVisualizationsProps> = ({
  data,
  onFilterChange,
}) => {
  const theme = useTheme();
  const [selectedView, setSelectedView] = useState('timeSeries');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState('1W');

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32; // Accounting for padding

  const viewOptions = [
    { label: 'Time Series', value: 'timeSeries' },
    { label: 'Correlation', value: 'correlation' },
    { label: 'Distribution', value: 'distribution' },
    { label: 'Heat Map', value: 'heatmap' },
  ];

  const filterOptions = useMemo(
    () => [
      { label: 'Health Metrics', value: 'health' },
      { label: 'Nutrition', value: 'nutrition' },
      { label: 'Activity', value: 'activity' },
      { label: 'Environment', value: 'environment' },
      { label: 'Treatments', value: 'treatments' },
    ],
    []
  );

  const handleFilterChange = useCallback(
    (filters: string[]) => {
      setSelectedFilters(filters);
      onFilterChange?.(filters);
    },
    [onFilterChange]
  );

  const renderTimeSeriesChart = () => (
    <Card style={styles.chartCard}>
      <Card.Title title="Performance Over Time" />
      <Card.Content>
        <VictoryChart
          theme={VictoryTheme.material}
          width={chartWidth}
          height={300}
          containerComponent={
            <VictoryVoronoiContainer
              labels={({ datum }) =>
                `${format(datum.x, 'PP')}\n${datum.y.toFixed(1)}%`
              }
              labelComponent={<VictoryTooltip />}
            />
          }
        >
          <VictoryAxis
            tickFormat={(date) => format(new Date(date), 'MM/dd')}
            style={{
              tickLabels: { fontSize: 10, padding: 5 },
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(value) => `${value}%`}
            style={{
              tickLabels: { fontSize: 10, padding: 5 },
            }}
          />
          <VictoryArea
            data={data.timeSeriesData}
            style={{
              data: {
                fill: theme.colors.primary,
                fillOpacity: 0.3,
                stroke: theme.colors.primary,
              },
            }}
          />
        </VictoryChart>
      </Card.Content>
    </Card>
  );

  const renderCorrelationChart = () => (
    <Card style={styles.chartCard}>
      <Card.Title title="Metric Correlations" />
      <Card.Content>
        <VictoryChart
          theme={VictoryTheme.material}
          width={chartWidth}
          height={300}
          containerComponent={
            <VictoryVoronoiContainer
              labels={({ datum }) =>
                `X: ${datum.x.toFixed(1)}\nY: ${datum.y.toFixed(1)}`
              }
              labelComponent={<VictoryTooltip />}
            />
          }
        >
          <VictoryScatter
            data={data.correlationData}
            style={{
              data: {
                fill: theme.colors.primary,
                fillOpacity: 0.6,
              },
            }}
            size={5}
          />
          <VictoryAxis
            label="Metric A"
            style={{
              axisLabel: { padding: 30 },
            }}
          />
          <VictoryAxis
            dependentAxis
            label="Metric B"
            style={{
              axisLabel: { padding: 40 },
            }}
          />
        </VictoryChart>
      </Card.Content>
    </Card>
  );

  const renderDistributionChart = () => (
    <Card style={styles.chartCard}>
      <Card.Title title="Metric Distribution" />
      <Card.Content>
        <VictoryChart
          theme={VictoryTheme.material}
          width={chartWidth}
          height={300}
          domainPadding={50}
        >
          <VictoryBoxPlot
            data={[
              { x: 1, y: data.distributionData.map((d) => d.y) },
            ]}
            style={{
              min: { stroke: theme.colors.error },
              max: { stroke: theme.colors.success },
              q1: { fill: theme.colors.primary },
              q3: { fill: theme.colors.primary },
              median: { stroke: theme.colors.secondary },
            }}
          />
          <VictoryAxis
            tickFormat={['Metric Distribution']}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(value) => `${value}%`}
          />
        </VictoryChart>
      </Card.Content>
    </Card>
  );

  const renderHeatMapChart = () => (
    <Card style={styles.chartCard}>
      <Card.Title title="Performance Heatmap" />
      <Card.Content>
        <VictoryChart
          theme={VictoryTheme.material}
          width={chartWidth}
          height={300}
          containerComponent={
            <VictoryVoronoiContainer
              labels={({ datum }) =>
                `Value: ${datum.heat.toFixed(1)}`
              }
              labelComponent={<VictoryTooltip />}
            />
          }
        >
          <VictoryHeatMap
            data={data.heatmapData}
            style={{
              data: {
                fill: ({ datum }) => {
                  const intensity = datum.heat;
                  return `rgba(33, 150, 243, ${intensity})`;
                },
              },
            }}
          />
          <VictoryAxis
            tickFormat={(value) => `Day ${value}`}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(value) => `Hour ${value}`}
          />
        </VictoryChart>
      </Card.Content>
    </Card>
  );

  const renderFilterModal = () => (
    <Portal>
      <Modal
        visible={filterModalVisible}
        onDismiss={() => setFilterModalVisible(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.modalTitle}>Filter Metrics</Text>
        <ScrollView>
          {filterOptions.map((option) => (
            <List.Item
              key={option.value}
              title={option.label}
              right={() => (
                <Checkbox
                  status={
                    selectedFilters.includes(option.value)
                      ? 'checked'
                      : 'unchecked'
                  }
                  onPress={() => {
                    const newFilters = selectedFilters.includes(option.value)
                      ? selectedFilters.filter((f) => f !== option.value)
                      : [...selectedFilters, option.value];
                    handleFilterChange(newFilters);
                  }}
                />
              )}
            />
          ))}
        </ScrollView>
        <Button
          mode="contained"
          onPress={() => setFilterModalVisible(false)}
          style={styles.modalButton}
        >
          Apply Filters
        </Button>
      </Modal>
    </Portal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={selectedView}
          onValueChange={setSelectedView}
          buttons={viewOptions}
        />
        <Button
          mode="outlined"
          onPress={() => setFilterModalVisible(true)}
          style={styles.filterButton}
        >
          Filters
        </Button>
      </View>

      <ScrollView style={styles.content}>
        {selectedView === 'timeSeries' && renderTimeSeriesChart()}
        {selectedView === 'correlation' && renderCorrelationChart()}
        {selectedView === 'distribution' && renderDistributionChart()}
        {selectedView === 'heatmap' && renderHeatMapChart()}
      </ScrollView>

      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    gap: 8,
  },
  content: {
    flex: 1,
  },
  chartCard: {
    margin: 16,
    elevation: 4,
  },
  filterButton: {
    marginTop: 8,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalButton: {
    marginTop: 16,
  },
});

export default AdvancedVisualizations;
