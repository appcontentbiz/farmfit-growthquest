import { DemoConfig, DemoRanges } from './config.js';

export class DemoState {
    constructor() {
        this.charts = new Map();
        this.intervals = new Map();
        this.metrics = new Map();
        this.isRunning = false;
        this.updateInterval = DemoConfig.updateInterval;
    }

    registerChart(type, chart) {
        this.charts.set(type, chart);
        this.initializeMetrics(type);
    }

    unregisterChart(type) {
        this.stopRealTimeUpdates(type);
        this.charts.delete(type);
        this.metrics.delete(type);
    }

    initializeMetrics(type) {
        const feature = DemoConfig.features[type];
        if (!feature) return;

        const metricState = {};
        feature.metrics.forEach(metric => {
            metricState[metric.id] = {
                value: metric.value,
                element: document.getElementById(`${type}${metric.id}`)
            };
        });
        this.metrics.set(type, metricState);
    }

    startRealTimeUpdates(type) {
        if (this.intervals.has(type)) return;

        const interval = setInterval(() => {
            try {
                this.updateChartData(type);
                this.updateMetrics(type);
            } catch (error) {
                console.error(`Error updating ${type}:`, error);
                this.stopRealTimeUpdates(type);
            }
        }, this.updateInterval);

        this.intervals.set(type, interval);
        this.isRunning = true;
    }

    stopRealTimeUpdates(type) {
        const interval = this.intervals.get(type);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(type);
        }
        this.isRunning = this.intervals.size > 0;
    }

    stopAllUpdates() {
        this.intervals.forEach((interval, type) => {
            this.stopRealTimeUpdates(type);
        });
        this.isRunning = false;
    }

    updateChartData(type) {
        const chart = this.charts.get(type);
        if (!chart) return;

        const ranges = DemoRanges[type];
        if (!ranges) return;

        switch(type) {
            case 'equipment':
                this.updateEquipmentData(chart, ranges);
                break;
            case 'workforce':
                this.updateWorkforceData(chart, ranges);
                break;
            case 'gene':
                this.updateGeneData(chart, ranges);
                break;
            case 'climate':
                this.updateClimateData(chart, ranges);
                break;
        }
    }

    updateEquipmentData(chart, ranges) {
        const newData = chart.data.datasets[0].data.map(() => 
            this.generateRandomValue(ranges.operational.min, ranges.operational.max)
        );
        
        chart.data.datasets[0].data = newData;
        chart.update('none');

        // Update metrics
        const metrics = this.metrics.get('equipment');
        if (metrics) {
            const avgOperational = Math.round(newData.reduce((a, b) => a + b, 0) / newData.length);
            const maintenanceCount = newData.filter(val => val < 85).length;
            
            this.updateMetricValue('equipment', 'operational', `${avgOperational}%`);
            this.updateMetricValue('equipment', 'maintenance', maintenanceCount.toString());
        }
    }

    updateWorkforceData(chart, ranges) {
        const lastValue = chart.data.datasets[0].data.slice(-1)[0] || 85;
        const newValue = this.smoothValue(lastValue, ranges.efficiency.min, ranges.efficiency.max);
        
        chart.data.datasets[0].data.push(newValue);
        if (chart.data.datasets[0].data.length > 10) {
            chart.data.datasets[0].data.shift();
        }
        
        chart.update('none');

        // Update metrics
        this.updateMetricValue('workforce', 'efficiency', `${Math.round(newValue)}%`);
        this.updateMetricValue('workforce', 'teams', 
            this.generateRandomValue(ranges.teams.min, ranges.teams.max).toString()
        );
    }

    updateGeneData(chart, ranges) {
        const newData = chart.data.datasets[0].data.map(() =>
            this.generateRandomValue(ranges.accuracy.min, ranges.accuracy.max)
        );
        
        chart.data.datasets[0].data = newData;
        chart.update('none');

        // Update metrics
        const accuracy = Math.round(this.generateRandomValue(ranges.accuracy.min, ranges.accuracy.max));
        const markers = Math.floor(this.generateRandomValue(ranges.markers.min, ranges.markers.max));
        
        this.updateMetricValue('gene', 'accuracy', `${accuracy}%`);
        this.updateMetricValue('gene', 'markers', markers.toString());
    }

    updateClimateData(chart, ranges) {
        const temperature = chart.data.datasets[0].data.map(() =>
            this.generateRandomValue(ranges.temperature.min, ranges.temperature.max)
        );
        const rainfall = chart.data.datasets[1].data.map(() =>
            this.generateRandomValue(ranges.rainfall.min, ranges.rainfall.max)
        );
        
        chart.data.datasets[0].data = temperature;
        chart.data.datasets[1].data = rainfall;
        chart.update('none');

        // Update metrics
        const forecastAccuracy = Math.round(95 + Math.random() * 4);
        this.updateMetricValue('climate', 'forecast', `${forecastAccuracy}%`);
        this.updateMetricValue('climate', 'range', '7 days');
    }

    updateMetricValue(type, metricId, value) {
        const metrics = this.metrics.get(type);
        if (metrics && metrics[metricId] && metrics[metricId].element) {
            metrics[metricId].element.textContent = value;
        }
    }

    generateRandomValue(min, max) {
        return min + Math.random() * (max - min);
    }

    smoothValue(currentValue, min, max) {
        const change = (Math.random() - 0.5) * 5;
        return Math.min(max, Math.max(min, currentValue + change));
    }
}

// Create global state instance
export const demoState = new DemoState();
