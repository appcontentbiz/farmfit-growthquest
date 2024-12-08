class DashboardManager {
    constructor() {
        this.charts = {};
        this.dataIntervals = {};
        this.isSimulationRunning = false;
    }

    initializeCharts() {
        // Initialize all charts based on the current page
        const pathname = window.location.pathname;
        
        if (pathname.includes('operations.html')) {
            this.initializeOperationsCharts();
        } else if (pathname.includes('monitoring.html')) {
            this.initializeMonitoringCharts();
        } else if (pathname.includes('analytics.html')) {
            this.initializeAnalyticsCharts();
        } else if (pathname.includes('automation.html')) {
            this.initializeAutomationCharts();
        }

        // Add event listeners for editable values
        this.initializeEditableValues();
    }

    initializeEditableValues() {
        const editableElements = document.querySelectorAll('[contenteditable="true"]');
        editableElements.forEach(element => {
            element.addEventListener('blur', (e) => {
                const newValue = parseFloat(e.target.textContent);
                if (!isNaN(newValue)) {
                    const chartId = e.target.dataset.chart;
                    const dataIndex = parseInt(e.target.dataset.index);
                    this.updateChartData(chartId, dataIndex, newValue);
                }
            });
        });
    }

    updateChartData(chartId, dataIndex, newValue) {
        if (this.charts[chartId]) {
            const chart = this.charts[chartId];
            chart.data.datasets[0].data[dataIndex] = newValue;
            chart.update();
            this.triggerRelatedUpdates(chartId, newValue);
        }
    }

    triggerRelatedUpdates(sourceChartId, value) {
        // Update related metrics based on changes
        const relatedMetrics = {
            'taskCompletionChart': ['resourceUtilizationChart', 'laborDistributionChart'],
            'cropHealthChart': ['soilConditionsChart', 'pestPressureChart'],
            'yieldPredictionChart': ['profitMarginChart', 'resourceEfficiencyChart'],
            'systemPerformanceChart': ['energyConsumptionChart', 'automationROIChart']
        };

        if (relatedMetrics[sourceChartId]) {
            relatedMetrics[sourceChartId].forEach(relatedChartId => {
                if (this.charts[relatedChartId]) {
                    this.updateRelatedChart(relatedChartId, value);
                }
            });
        }
    }

    updateRelatedChart(chartId, sourceValue) {
        const chart = this.charts[chartId];
        if (!chart) return;

        // Apply a correlation effect
        const data = chart.data.datasets[0].data;
        const correlationFactor = 0.8; // 80% correlation
        
        const newData = data.map(value => {
            const change = (sourceValue - value) * correlationFactor;
            return value + change * Math.random();
        });

        chart.data.datasets[0].data = newData;
        chart.update();
    }

    startSimulation() {
        if (this.isSimulationRunning) return;
        this.isSimulationRunning = true;

        // Update each chart every few seconds
        Object.keys(this.charts).forEach(chartId => {
            this.dataIntervals[chartId] = setInterval(() => {
                this.simulateDataUpdate(chartId);
            }, 3000 + Math.random() * 2000); // Random interval between 3-5 seconds
        });
    }

    stopSimulation() {
        this.isSimulationRunning = false;
        Object.values(this.dataIntervals).forEach(interval => clearInterval(interval));
        this.dataIntervals = {};
    }

    simulateDataUpdate(chartId) {
        const chart = this.charts[chartId];
        if (!chart) return;

        const data = chart.data.datasets[0].data;
        const newData = data.map(value => {
            // Add random variation within ±5%
            const variation = value * 0.05 * (Math.random() * 2 - 1);
            return value + variation;
        });

        chart.data.datasets[0].data = newData;
        chart.update();

        // Update related metrics
        this.triggerRelatedUpdates(chartId, newData[newData.length - 1]);
    }

    // Initialize specific chart pages
    initializeOperationsCharts() {
        this.initializeChart('taskCompletionChart', {
            type: 'line',
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        this.initializeChart('resourceUtilizationChart', {
            type: 'bar',
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Add more operations charts initialization
    }

    initializeMonitoringCharts() {
        this.initializeChart('cropHealthChart', {
            type: 'line',
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        this.initializeChart('soilConditionsChart', {
            type: 'bar',
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Add more monitoring charts initialization
    }

    initializeAnalyticsCharts() {
        this.initializeChart('yieldPredictionChart', {
            type: 'line',
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        this.initializeChart('profitMarginChart', {
            type: 'line',
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Add more analytics charts initialization
    }

    initializeAutomationCharts() {
        this.initializeChart('systemPerformanceChart', {
            type: 'line',
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        this.initializeChart('energyConsumptionChart', {
            type: 'bar',
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Add more automation charts initialization
    }

    initializeChart(chartId, config) {
        const ctx = document.getElementById(chartId);
        if (!ctx) return;

        this.charts[chartId] = new Chart(ctx, {
            ...config,
            data: this.getInitialData(chartId)
        });
    }

    getInitialData(chartId) {
        // Return appropriate initial data based on chart type
        const baseData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: this.getChartLabel(chartId),
                data: this.generateRandomData(6, chartId),
                borderColor: '#4CAF50',
                backgroundColor: '#4CAF50'
            }]
        };

        return baseData;
    }

    getChartLabel(chartId) {
        const labels = {
            'taskCompletionChart': 'Task Completion Rate',
            'resourceUtilizationChart': 'Resource Usage',
            'cropHealthChart': 'Crop Health Index',
            'soilConditionsChart': 'Soil Quality',
            'yieldPredictionChart': 'Predicted Yield',
            'profitMarginChart': 'Profit Margin',
            'systemPerformanceChart': 'System Uptime',
            'energyConsumptionChart': 'Energy Usage'
        };

        return labels[chartId] || 'Value';
    }

    generateRandomData(count, chartId) {
        const ranges = {
            'taskCompletionChart': [80, 95],
            'resourceUtilizationChart': [60, 85],
            'cropHealthChart': [85, 98],
            'soilConditionsChart': [70, 90],
            'yieldPredictionChart': [100, 150],
            'profitMarginChart': [15, 25],
            'systemPerformanceChart': [95, 99],
            'energyConsumptionChart': [30, 50]
        };

        const range = ranges[chartId] || [0, 100];
        return Array.from({ length: count }, () => 
            range[0] + Math.random() * (range[1] - range[0])
        );
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
    window.dashboardManager.initializeCharts();

    // Add demo controls
    const demoControls = document.createElement('div');
    demoControls.className = 'demo-controls';
    demoControls.innerHTML = `
        <button id="startDemo" class="demo-button">
            Start Demo
        </button>
    `;
    document.body.appendChild(demoControls);

    const startDemoBtn = document.getElementById('startDemo');
    startDemoBtn.addEventListener('click', () => {
        if (window.dashboardManager.isSimulationRunning) {
            window.dashboardManager.stopSimulation();
            startDemoBtn.textContent = 'Start Demo';
            startDemoBtn.classList.remove('active');
        } else {
            window.dashboardManager.startSimulation();
            startDemoBtn.textContent = 'Stop Demo';
            startDemoBtn.classList.add('active');
        }
    });
});
