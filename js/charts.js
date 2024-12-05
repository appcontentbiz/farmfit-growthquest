import { DemoConfig } from './config.js';

export class ChartManager {
    constructor() {
        this.charts = new Map();
    }

    createChart(type, ctx) {
        const config = this.getChartConfig(type);
        if (!config) return null;

        const chart = new Chart(ctx, config);
        this.charts.set(type, chart);
        return chart;
    }

    destroyChart(type) {
        const chart = this.charts.get(type);
        if (chart) {
            chart.destroy();
            this.charts.delete(type);
        }
    }

    destroyAllCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }

    getChartConfig(type) {
        const feature = DemoConfig.features[type];
        if (!feature) return null;

        const baseConfig = {
            type: feature.chartType,
            data: this.getInitialData(type),
            options: {
                ...DemoConfig.chartDefaults,
                ...feature.chartOptions,
                plugins: {
                    ...DemoConfig.chartDefaults.plugins,
                    title: {
                        display: true,
                        text: feature.title
                    }
                }
            }
        };

        return baseConfig;
    }

    getInitialData(type) {
        const labels = this.getLabels(type);
        
        switch(type) {
            case 'equipment':
                return {
                    labels: ['Tractors', 'Harvesters', 'Irrigation', 'Tools', 'Sensors'],
                    datasets: [{
                        label: 'Operational Status',
                        data: [92, 88, 95, 89, 91],
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2
                    }]
                };

            case 'workforce':
                return {
                    labels: labels,
                    datasets: [{
                        label: 'Team Efficiency',
                        data: Array(labels.length).fill(85),
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                };

            case 'gene':
                return {
                    labels: labels,
                    datasets: [{
                        label: 'Expression Level',
                        data: Array(labels.length).fill(95),
                        borderColor: 'rgba(153, 102, 255, 1)',
                        backgroundColor: 'rgba(153, 102, 255, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                };

            case 'climate':
                return {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [
                        {
                            label: 'Temperature',
                            data: [20, 22, 25, 28, 30, 32],
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Rainfall',
                            data: [45, 38, 65, 72, 55, 40],
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            yAxisID: 'y1'
                        }
                    ]
                };

            default:
                return null;
        }
    }

    getLabels(type) {
        switch(type) {
            case 'workforce':
                return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
            case 'gene':
                return Array.from({length: 12}, (_, i) => `${i*2}h`);
            case 'climate':
                return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            default:
                return [];
        }
    }
}

// Create global chart manager instance
export const chartManager = new ChartManager();
