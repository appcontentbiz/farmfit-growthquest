import { BehaviorSubject, Subject, interval, Observable } from 'rxjs';
import { filter, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import AdvancedStatisticsService from './AdvancedStatisticsService';
import OfflineStorageService from './OfflineStorageService';
import NotificationTemplateService from './NotificationTemplateService';

interface MonitoringMetric {
  id: string;
  name: string;
  value: number;
  timestamp: Date;
  type: MetricType;
  status: MetricStatus;
  threshold?: MetricThreshold;
  metadata?: Record<string, any>;
}

interface MetricThreshold {
  warning: number;
  critical: number;
  direction: 'above' | 'below';
}

interface Alert {
  id: string;
  metricId: string;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  status: AlertStatus;
  context?: Record<string, any>;
}

interface HealthCheck {
  id: string;
  component: string;
  status: HealthStatus;
  lastCheck: Date;
  nextCheck: Date;
  details?: Record<string, any>;
}

enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

enum MetricStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
}

enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

class RealTimeMonitoringService {
  private readonly UPDATE_INTERVAL = 5000; // 5 seconds
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly ALERT_DEBOUNCE_TIME = 1000; // 1 second
  private readonly MAX_HISTORY_SIZE = 1000;

  private metrics: BehaviorSubject<Map<string, MonitoringMetric>>;
  private alerts: Subject<Alert>;
  private healthChecks: Map<string, HealthCheck>;
  private metricHistory: Map<string, MonitoringMetric[]>;

  constructor() {
    this.metrics = new BehaviorSubject<Map<string, MonitoringMetric>>(new Map());
    this.alerts = new Subject<Alert>();
    this.healthChecks = new Map();
    this.metricHistory = new Map();

    this.initializeMonitoring();
  }

  async initializeMonitoring(): Promise<void> {
    try {
      // Start periodic metric collection
      interval(this.UPDATE_INTERVAL).subscribe(() => {
        this.collectMetrics();
      });

      // Start health checks
      interval(this.HEALTH_CHECK_INTERVAL).subscribe(() => {
        this.performHealthChecks();
      });

      // Initialize alert processing
      this.processAlerts();

      console.log('Real-time monitoring initialized successfully');
    } catch (error) {
      console.error('Error initializing monitoring:', error);
      throw error;
    }
  }

  registerMetric(
    name: string,
    type: MetricType,
    threshold?: MetricThreshold
  ): string {
    const id = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: MonitoringMetric = {
      id,
      name,
      value: 0,
      timestamp: new Date(),
      type,
      status: MetricStatus.UNKNOWN,
      threshold,
    };

    const currentMetrics = this.metrics.value;
    currentMetrics.set(id, metric);
    this.metrics.next(currentMetrics);

    return id;
  }

  updateMetric(id: string, value: number, metadata?: Record<string, any>): void {
    const currentMetrics = this.metrics.value;
    const metric = currentMetrics.get(id);

    if (!metric) {
      console.error(`Metric ${id} not found`);
      return;
    }

    const updatedMetric: MonitoringMetric = {
      ...metric,
      value,
      timestamp: new Date(),
      metadata: { ...metric.metadata, ...metadata },
      status: this.calculateMetricStatus(value, metric.threshold),
    };

    currentMetrics.set(id, updatedMetric);
    this.metrics.next(currentMetrics);

    this.updateMetricHistory(updatedMetric);
    this.checkThresholds(updatedMetric);
  }

  registerHealthCheck(
    component: string,
    checkFn: () => Promise<HealthStatus>
  ): void {
    const healthCheck: HealthCheck = {
      id: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      component,
      status: HealthStatus.UNHEALTHY,
      lastCheck: new Date(),
      nextCheck: new Date(Date.now() + this.HEALTH_CHECK_INTERVAL),
    };

    this.healthChecks.set(component, healthCheck);
  }

  getMetricUpdates(metricId: string): Observable<MonitoringMetric> {
    return this.metrics.pipe(
      map(metrics => metrics.get(metricId)),
      filter((metric): metric is MonitoringMetric => metric !== undefined),
      distinctUntilChanged((prev, curr) => prev.value === curr.value)
    );
  }

  getAlerts(severity?: AlertSeverity): Observable<Alert> {
    return this.alerts.pipe(
      filter(alert => !severity || alert.severity === severity)
    );
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = await this.getAlert(alertId);
    if (alert && alert.status === AlertStatus.ACTIVE) {
      alert.status = AlertStatus.ACKNOWLEDGED;
      this.alerts.next(alert);
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = await this.getAlert(alertId);
    if (alert && alert.status !== AlertStatus.RESOLVED) {
      alert.status = AlertStatus.RESOLVED;
      this.alerts.next(alert);
    }
  }

  getMetricHistory(
    metricId: string,
    startTime?: Date,
    endTime?: Date
  ): MonitoringMetric[] {
    const history = this.metricHistory.get(metricId) || [];
    if (!startTime && !endTime) return history;

    return history.filter(metric => {
      const timestamp = metric.timestamp.getTime();
      return (
        (!startTime || timestamp >= startTime.getTime()) &&
        (!endTime || timestamp <= endTime.getTime())
      );
    });
  }

  async getSystemHealth(): Promise<Record<string, HealthCheck>> {
    const health: Record<string, HealthCheck> = {};
    for (const [component, check] of this.healthChecks) {
      health[component] = { ...check };
    }
    return health;
  }

  private async collectMetrics(): Promise<void> {
    try {
      const currentMetrics = this.metrics.value;
      const updatedMetrics = new Map<string, MonitoringMetric>();

      for (const [id, metric] of currentMetrics) {
        const updatedValue = await this.fetchMetricValue(metric);
        this.updateMetric(id, updatedValue);
      }

      this.metrics.next(updatedMetrics);
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  private async fetchMetricValue(metric: MonitoringMetric): Promise<number> {
    // Implementation would fetch actual metric values
    // This is a placeholder that returns random values
    return Math.random() * 100;
  }

  private async performHealthChecks(): Promise<void> {
    for (const [component, healthCheck] of this.healthChecks) {
      try {
        const status = await this.executeHealthCheck(component);
        const updatedCheck: HealthCheck = {
          ...healthCheck,
          status,
          lastCheck: new Date(),
          nextCheck: new Date(Date.now() + this.HEALTH_CHECK_INTERVAL),
        };

        this.healthChecks.set(component, updatedCheck);

        if (status === HealthStatus.UNHEALTHY) {
          this.createAlert({
            metricId: component,
            severity: AlertSeverity.CRITICAL,
            message: `Health check failed for ${component}`,
            context: { healthCheck: updatedCheck },
          });
        }
      } catch (error) {
        console.error(`Error performing health check for ${component}:`, error);
      }
    }
  }

  private async executeHealthCheck(component: string): Promise<HealthStatus> {
    // Implementation would perform actual health checks
    // This is a placeholder that returns random status
    return Math.random() > 0.9 ? HealthStatus.UNHEALTHY : HealthStatus.HEALTHY;
  }

  private calculateMetricStatus(
    value: number,
    threshold?: MetricThreshold
  ): MetricStatus {
    if (!threshold) return MetricStatus.UNKNOWN;

    const { warning, critical, direction } = threshold;
    if (direction === 'above') {
      if (value >= critical) return MetricStatus.CRITICAL;
      if (value >= warning) return MetricStatus.WARNING;
    } else {
      if (value <= critical) return MetricStatus.CRITICAL;
      if (value <= warning) return MetricStatus.WARNING;
    }

    return MetricStatus.HEALTHY;
  }

  private updateMetricHistory(metric: MonitoringMetric): void {
    const history = this.metricHistory.get(metric.id) || [];
    history.push({ ...metric });

    // Maintain history size limit
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.shift();
    }

    this.metricHistory.set(metric.id, history);
  }

  private checkThresholds(metric: MonitoringMetric): void {
    if (!metric.threshold) return;

    const { warning, critical, direction } = metric.threshold;
    const value = metric.value;

    if (
      (direction === 'above' && value >= critical) ||
      (direction === 'below' && value <= critical)
    ) {
      this.createAlert({
        metricId: metric.id,
        severity: AlertSeverity.CRITICAL,
        message: `Metric ${metric.name} has reached critical threshold: ${value}`,
        context: { metric },
      });
    } else if (
      (direction === 'above' && value >= warning) ||
      (direction === 'below' && value <= warning)
    ) {
      this.createAlert({
        metricId: metric.id,
        severity: AlertSeverity.WARNING,
        message: `Metric ${metric.name} has reached warning threshold: ${value}`,
        context: { metric },
      });
    }
  }

  private createAlert(params: {
    metricId: string;
    severity: AlertSeverity;
    message: string;
    context?: Record<string, any>;
  }): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: AlertStatus.ACTIVE,
      ...params,
    };

    this.alerts.next(alert);
  }

  private processAlerts(): void {
    this.alerts
      .pipe(debounceTime(this.ALERT_DEBOUNCE_TIME))
      .subscribe(async alert => {
        try {
          // Store alert
          await this.storeAlert(alert);

          // Send notification if needed
          if (alert.severity === AlertSeverity.CRITICAL) {
            await this.sendAlertNotification(alert);
          }
        } catch (error) {
          console.error('Error processing alert:', error);
        }
      });
  }

  private async storeAlert(alert: Alert): Promise<void> {
    try {
      const alerts = await OfflineStorageService.getHistoricalData();
      alerts.push(alert);
      await OfflineStorageService.saveHistoricalData(alerts);
    } catch (error) {
      console.error('Error storing alert:', error);
    }
  }

  private async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      const template = await NotificationTemplateService.generateNotification(
        'alert_template',
        {
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp,
        }
      );

      // Implementation would send actual notification
      console.log('Alert notification:', template);
    } catch (error) {
      console.error('Error sending alert notification:', error);
    }
  }

  private async getAlert(alertId: string): Promise<Alert | undefined> {
    try {
      const alerts = await OfflineStorageService.getHistoricalData();
      return alerts.find((alert: Alert) => alert.id === alertId);
    } catch (error) {
      console.error('Error getting alert:', error);
      return undefined;
    }
  }
}

export default new RealTimeMonitoringService();
