import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import {
  Card,
  Text,
  useTheme,
  Button,
  Portal,
  Modal,
  Divider,
  Menu,
  IconButton,
  SegmentedButtons,
} from 'react-native-paper';
import {
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryBar,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryLegend,
  VictoryBoxPlot,
  VictoryArea,
  VictoryTheme,
  VictoryLabel,
  VictoryPie,
  VictoryHistogram,
  VictoryStack,
  createContainer,
} from 'victory-native';
import { format } from 'date-fns';

const VictoryZoomVoronoiContainer = createContainer("zoom", "voronoi");

interface AdvancedVisualizationProps {
  data: any;
  type: 'timeSeries' | 'distribution' | 'correlation' | 'comparison';
  config?: {
    title?: string;
    xLabel?: string;
    yLabel?: string;
    interactive?: boolean;
    showLegend?: boolean;
    theme?: 'light' | 'dark';
    annotations?: Array<{
      x: number;
      y: number;
      text: string;
    }>;
  };
}

const AdvancedVisualization: React.FC<AdvancedVisualizationProps> = ({
  data,
  type,
  config = {},
}) => {
  const theme = useTheme();
  const [selectedView, setSelectedView] = useState('chart');
  const [zoomDomain, setZoomDomain] = useState<any>(null);
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;
  const chartHeight = 300;

  const chartTheme = {
    ...VictoryTheme.material,
    axis: {
      ...VictoryTheme.material.axis,
      style: {
        ...VictoryTheme.material.axis.style,
        grid: {
          ...VictoryTheme.material.axis.style.grid,
          stroke: theme.colors.outlineVariant,
        },
      },
    },
  };

  const handleZoom = useCallback((domain) => {
    setZoomDomain(domain);
  }, []);

  const renderTimeSeriesChart = () => (
    <VictoryChart
      width={chartWidth}
      height={chartHeight}
      theme={chartTheme}
      containerComponent={
        <VictoryZoomVoronoiContainer
          zoomDimension="x"
          onZoomDomainChange={handleZoom}
          labels={({ datum }) => `
            ${format(new Date(datum.x), 'yyyy-MM-dd HH:mm')}
            ${datum.y.toFixed(2)}
          `}
          labelComponent={<VictoryTooltip />}
        />
      }
    >
      {config.showLegend && (
        <VictoryLegend
          x={50}
          y={0}
          orientation="horizontal"
          data={data.series.map((series: any) => ({
            name: series.name,
            symbol: { fill: series.color || theme.colors.primary },
          }))}
        />
      )}

      {data.series.map((series: any, index: number) => (
        <React.Fragment key={series.name}>
          <VictoryLine
            data={series.data}
            style={{
              data: {
                stroke: series.color || theme.colors.primary,
                strokeWidth: 2,
              },
            }}
          />
          <VictoryScatter
            data={series.data}
            size={4}
            style={{
              data: {
                fill: series.color || theme.colors.primary,
              },
            }}
            events={[
              {
                target: 'data',
                eventHandlers: {
                  onPress: () => ({
                    target: 'data',
                    mutation: (props) => {
                      setSelectedDataPoint(props.datum);
                      setShowDetails(true);
                    },
                  }),
                },
              },
            ]}
          />
          {series.confidence && (
            <VictoryArea
              data={series.confidence}
              style={{
                data: {
                  fill: series.color || theme.colors.primary,
                  fillOpacity: 0.1,
                },
              }}
            />
          )}
        </React.Fragment>
      ))}

      <VictoryAxis
        tickFormat={(x) => format(new Date(x), 'MM/dd')}
        label={config.xLabel}
        style={{
          axisLabel: { padding: 30 },
        }}
      />
      <VictoryAxis
        dependentAxis
        label={config.yLabel}
        style={{
          axisLabel: { padding: 40 },
        }}
      />

      {config.annotations?.map((annotation, index) => (
        <VictoryLabel
          key={index}
          x={annotation.x}
          y={annotation.y}
          text={annotation.text}
          style={{
            fontSize: 12,
            fill: theme.colors.primary,
          }}
        />
      ))}
    </VictoryChart>
  );

  const renderDistributionChart = () => (
    <VictoryChart
      width={chartWidth}
      height={chartHeight}
      theme={chartTheme}
      domainPadding={20}
    >
      <VictoryHistogram
        data={data.values}
        style={{
          data: {
            fill: theme.colors.primary,
            fillOpacity: 0.7,
          },
        }}
        bins={20}
      />
      <VictoryAxis
        label={config.xLabel}
        style={{
          axisLabel: { padding: 30 },
        }}
      />
      <VictoryAxis
        dependentAxis
        label="Frequency"
        style={{
          axisLabel: { padding: 40 },
        }}
      />
    </VictoryChart>
  );

  const renderCorrelationChart = () => (
    <VictoryChart
      width={chartWidth}
      height={chartHeight}
      theme={chartTheme}
      domain={{ x: [-1, 1], y: [-1, 1] }}
    >
      <VictoryScatter
        data={data.correlations}
        style={{
          data: {
            fill: ({ datum }) =>
              datum.pValue < 0.05 ? theme.colors.primary : theme.colors.error,
            fillOpacity: ({ datum }) => Math.abs(datum.correlation),
          },
        }}
        size={({ datum }) => Math.abs(datum.correlation) * 10}
        labels={({ datum }) =>
          `${datum.pair}\nr = ${datum.correlation.toFixed(2)}\np = ${datum.pValue.toFixed(3)}`
        }
        labelComponent={<VictoryTooltip />}
      />
      <VictoryAxis
        label="Variable 1"
        style={{
          axisLabel: { padding: 30 },
        }}
      />
      <VictoryAxis
        dependentAxis
        label="Variable 2"
        style={{
          axisLabel: { padding: 40 },
        }}
      />
    </VictoryChart>
  );

  const renderComparisonChart = () => (
    <VictoryChart
      width={chartWidth}
      height={chartHeight}
      theme={chartTheme}
      domainPadding={20}
    >
      <VictoryBoxPlot
        data={data.groups.map((group: any) => ({
          x: group.name,
          min: group.stats.min,
          q1: group.stats.quartiles[0],
          median: group.stats.quartiles[1],
          q3: group.stats.quartiles[2],
          max: group.stats.max,
          outliers: group.outliers,
        }))}
        style={{
          min: { stroke: theme.colors.error },
          max: { stroke: theme.colors.error },
          q1: { fill: theme.colors.primary },
          q3: { fill: theme.colors.primary },
          median: { stroke: theme.colors.accent },
          outliers: { fill: theme.colors.error, opacity: 0.5 },
        }}
      />
      <VictoryAxis
        label={config.xLabel}
        style={{
          axisLabel: { padding: 30 },
        }}
      />
      <VictoryAxis
        dependentAxis
        label={config.yLabel}
        style={{
          axisLabel: { padding: 40 },
        }}
      />
    </VictoryChart>
  );

  const renderChart = () => {
    switch (type) {
      case 'timeSeries':
        return renderTimeSeriesChart();
      case 'distribution':
        return renderDistributionChart();
      case 'correlation':
        return renderCorrelationChart();
      case 'comparison':
        return renderComparisonChart();
      default:
        return null;
    }
  };

  const renderDetails = () => (
    <Portal>
      <Modal
        visible={showDetails}
        onDismiss={() => setShowDetails(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.modalTitle}>Data Point Details</Text>
        {selectedDataPoint && (
          <ScrollView>
            <List.Section>
              <List.Subheader>Metrics</List.Subheader>
              {Object.entries(selectedDataPoint).map(([key, value]: [string, any]) => (
                <List.Item
                  key={key}
                  title={key}
                  description={String(value)}
                  left={(props) => <List.Icon {...props} icon="chart-line" />}
                />
              ))}
            </List.Section>
            {selectedDataPoint.statistics && (
              <List.Section>
                <List.Subheader>Statistical Analysis</List.Subheader>
                {Object.entries(selectedDataPoint.statistics).map(
                  ([key, value]: [string, any]) => (
                    <List.Item
                      key={key}
                      title={key}
                      description={String(value)}
                      left={(props) => <List.Icon {...props} icon="calculator" />}
                    />
                  )
                )}
              </List.Section>
            )}
          </ScrollView>
        )}
        <Button mode="contained" onPress={() => setShowDetails(false)}>
          Close
        </Button>
      </Modal>
    </Portal>
  );

  return (
    <Card style={styles.container}>
      <Card.Title title={config.title || 'Analysis Results'} />
      <Card.Content>
        <SegmentedButtons
          value={selectedView}
          onValueChange={setSelectedView}
          buttons={[
            { value: 'chart', label: 'Chart' },
            { value: 'stats', label: 'Statistics' },
            { value: 'insights', label: 'Insights' },
          ]}
          style={styles.viewSelector}
        />

        {selectedView === 'chart' && renderChart()}
        {selectedView === 'stats' && (
          <ScrollView>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Metric</DataTable.Title>
                <DataTable.Title numeric>Value</DataTable.Title>
                <DataTable.Title numeric>Change</DataTable.Title>
              </DataTable.Header>

              {data.statistics?.map((stat: any) => (
                <DataTable.Row key={stat.name}>
                  <DataTable.Cell>{stat.name}</DataTable.Cell>
                  <DataTable.Cell numeric>{stat.value}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text
                      style={{
                        color:
                          stat.change > 0
                            ? theme.colors.primary
                            : theme.colors.error,
                      }}
                    >
                      {stat.change > 0 ? '+' : ''}
                      {stat.change}%
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>
        )}
        {selectedView === 'insights' && (
          <ScrollView>
            {data.insights?.map((insight: string, index: number) => (
              <Card key={index} style={styles.insightCard}>
                <Card.Content>
                  <Text>{insight}</Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        )}
      </Card.Content>
      {renderDetails()}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 4,
  },
  viewSelector: {
    marginBottom: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  insightCard: {
    marginBottom: 8,
  },
});

export default AdvancedVisualization;
