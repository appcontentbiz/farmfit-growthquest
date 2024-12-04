import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  List,
  Divider,
  Button,
  Portal,
  Modal,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import {
  selectNotifications,
  selectNotificationsByType,
} from '../../store/slices/notificationSlice';
import {
  VictoryPie,
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryBar,
  VictoryTheme,
  VictoryLabel,
} from 'victory-native';
import { format, startOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import { groupBy } from 'lodash';
import AnimatedNumber from '../../components/common/AnimatedNumber';

const NotificationAnalytics = () => {
  const theme = useTheme();
  const notifications = useSelector(selectNotifications);
  const [selectedMetric, setSelectedMetric] = React.useState<string | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);

  // Calculate notification statistics
  const stats = useMemo(() => {
    const now = new Date();
    const lastWeek = subDays(now, 7);
    const lastMonth = subDays(now, 30);

    const treatmentNotifications = notifications.filter(
      (n) => n.type === 'TREATMENT'
    );
    const medicationNotifications = notifications.filter(
      (n) => n.type === 'MEDICATION'
    );
    const checkupNotifications = notifications.filter(
      (n) => n.type === 'CHECKUP'
    );

    const recentNotifications = notifications.filter(
      (n) => new Date(n.scheduledFor) >= lastWeek
    );

    const readRate =
      (notifications.filter((n) => n.read).length / notifications.length) * 100;

    const responseTime = notifications
      .filter((n) => n.read)
      .reduce((acc, n) => {
        const scheduleTime = new Date(n.scheduledFor).getTime();
        const readTime = new Date(n.readAt).getTime();
        return acc + (readTime - scheduleTime);
      }, 0) / notifications.filter((n) => n.read).length;

    return {
      total: notifications.length,
      treatments: treatmentNotifications.length,
      medications: medicationNotifications.length,
      checkups: checkupNotifications.length,
      recent: recentNotifications.length,
      readRate: readRate || 0,
      responseTime: responseTime || 0,
    };
  }, [notifications]);

  // Prepare data for charts
  const typeDistribution = [
    { x: 'Treatments', y: stats.treatments },
    { x: 'Medications', y: stats.medications },
    { x: 'Checkups', y: stats.checkups },
  ];

  const dailyTrends = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return last7Days.map((date) => ({
      x: format(date, 'EEE'),
      y: notifications.filter(
        (n) =>
          format(new Date(n.scheduledFor), 'yyyy-MM-dd') ===
          format(date, 'yyyy-MM-dd')
      ).length,
    }));
  }, [notifications]);

  const priorityDistribution = useMemo(() => {
    const grouped = groupBy(notifications, 'priority');
    return Object.entries(grouped).map(([priority, items]) => ({
      x: priority,
      y: items.length,
    }));
  }, [notifications]);

  const renderMetricCard = (
    title: string,
    value: number,
    icon: string,
    description: string
  ) => (
    <Card style={styles.metricCard} onPress={() => setSelectedMetric(title)}>
      <Card.Content>
        <View style={styles.metricHeader}>
          <List.Icon icon={icon} />
          <Text style={styles.metricTitle}>{title}</Text>
        </View>
        <AnimatedNumber
          value={value}
          formatter={(val) =>
            title.includes('Rate') || title.includes('Time')
              ? `${val.toFixed(1)}${title.includes('Rate') ? '%' : 'min'}`
              : val.toString()
          }
          style={styles.metricValue}
        />
        <Text style={styles.metricDescription}>{description}</Text>
      </Card.Content>
    </Card>
  );

  const renderDetailModal = () => (
    <Portal>
      <Modal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        contentContainerStyle={styles.modalContent}
      >
        <ScrollView>
          <Text style={styles.modalTitle}>Detailed Analytics</Text>
          <Divider style={styles.modalDivider} />

          <Text style={styles.sectionTitle}>Response Time Distribution</Text>
          <VictoryChart
            theme={VictoryTheme.material}
            height={200}
            padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
          >
            <VictoryBar
              data={[
                { x: '< 5min', y: 45 },
                { x: '5-15min', y: 30 },
                { x: '15-30min', y: 15 },
                { x: '> 30min', y: 10 },
              ]}
              style={{
                data: { fill: theme.colors.primary },
              }}
            />
          </VictoryChart>

          <Text style={styles.sectionTitle}>Priority Distribution</Text>
          <VictoryPie
            data={priorityDistribution}
            colorScale={['#FF6B6B', '#4ECDC4', '#45B7D1']}
            height={200}
            padding={40}
            labels={({ datum }) => `${datum.x}\n${datum.y}`}
          />

          <Button
            mode="outlined"
            onPress={() => setModalVisible(false)}
            style={styles.modalButton}
          >
            Close
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.metricsContainer}>
        {renderMetricCard(
          'Total Notifications',
          stats.total,
          'bell',
          'All notifications'
        )}
        {renderMetricCard(
          'Read Rate',
          stats.readRate,
          'check',
          'Notification read percentage'
        )}
        {renderMetricCard(
          'Avg Response Time',
          stats.responseTime / (1000 * 60), // Convert to minutes
          'clock',
          'Average time to respond'
        )}
        {renderMetricCard(
          'Recent Activity',
          stats.recent,
          'trending-up',
          'Last 7 days'
        )}
      </View>

      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Notification Types</Text>
          <VictoryPie
            data={typeDistribution}
            colorScale={['#FF6B6B', '#4ECDC4', '#45B7D1']}
            height={200}
            padding={40}
            labels={({ datum }) => `${datum.x}\n${datum.y}`}
          />
        </Card.Content>
      </Card>

      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Daily Trends</Text>
          <VictoryChart
            theme={VictoryTheme.material}
            height={200}
            padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
          >
            <VictoryLine
              data={dailyTrends}
              style={{
                data: { stroke: theme.colors.primary },
              }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(t) => Math.round(t)}
            />
            <VictoryAxis />
          </VictoryChart>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={() => setModalVisible(true)}
        style={styles.detailsButton}
      >
        View Detailed Analytics
      </Button>

      {renderDetailModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    marginBottom: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricDescription: {
    fontSize: 12,
    opacity: 0.5,
  },
  chartCard: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailsButton: {
    marginBottom: 24,
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
  modalDivider: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modalButton: {
    marginTop: 16,
  },
});

export default NotificationAnalytics;
