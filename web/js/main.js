import { DemoConfig, DemoRanges } from './config.js';
import { DemoState } from './state.js';
import { ChartManager } from './charts.js';

export class FarmFitDemo {
    constructor() {
        this.state = new DemoState();
        this.chartManager = new ChartManager();
        this.currentCategory = 'operations';
        this.isRunning = false;
        this.updateInterval = null;
        this.configName = 'default';
    }

    initialize() {
        this.setupCategoryNavigation();
        this.setupDemoControls();
        this.setupConfigControls();
        this.loadCategory('operations');
        this.setupGlobalEventListeners();
        this.loadSavedConfig();
    }

    setupCategoryNavigation() {
        const nav = document.getElementById('category-nav');
        nav.innerHTML = '';
        
        Object.entries(DemoConfig.categories).forEach(([key, category]) => {
            const button = document.createElement('button');
            button.className = 'category-btn' + (key === this.currentCategory ? ' active' : '');
            button.innerHTML = `<i class="fas ${category.icon}"></i> ${category.label}`;
            button.addEventListener('click', () => this.loadCategory(key));
            nav.appendChild(button);
        });
    }

    setupDemoControls() {
        const startBtn = document.getElementById('start-demo');
        startBtn.addEventListener('click', () => this.toggleDemo());
    }

    setupConfigControls() {
        const configControls = document.createElement('div');
        configControls.className = 'config-controls';
        configControls.innerHTML = `
            <div class="config-name">
                <input type="text" id="config-name" 
                       placeholder="Configuration Name" 
                       value="${this.configName}"
                       data-tooltip="Enter a name for your configuration">
            </div>
            <button id="save-config" class="config-btn" data-tooltip="Save current configuration">
                <i class="fas fa-save"></i> Save
            </button>
            <button id="load-config" class="config-btn" data-tooltip="Load saved configuration">
                <i class="fas fa-folder-open"></i> Load
            </button>
            <button id="export-config" class="config-btn" data-tooltip="Export configuration as JSON">
                <i class="fas fa-file-export"></i> Export
            </button>
            <button id="import-config" class="config-btn" data-tooltip="Import configuration from JSON">
                <i class="fas fa-file-import"></i> Import
            </button>
        `;

        document.querySelector('.container').insertBefore(
            configControls,
            document.getElementById('category-nav')
        );

        // Setup event listeners
        document.getElementById('config-name').addEventListener('change', (e) => {
            this.configName = e.target.value;
        });

        document.getElementById('save-config').addEventListener('click', () => {
            this.saveConfig();
        });

        document.getElementById('load-config').addEventListener('click', () => {
            this.showLoadDialog();
        });

        document.getElementById('export-config').addEventListener('click', () => {
            this.exportConfig();
        });

        document.getElementById('import-config').addEventListener('click', () => {
            this.showImportDialog();
        });
    }

    setupGlobalEventListeners() {
        // Listen for metric value changes
        document.addEventListener('metric-change', (e) => {
            const { featureId, metricId, value } = e.detail;
            this.state.updateMetric(featureId, metricId, value);
            this.chartManager.updateChart(featureId, this.state.getChartData(featureId));
        });
    }

    loadCategory(categoryId) {
        this.currentCategory = categoryId;
        this.updateCategoryUI();
        this.renderFeatures();
    }

    updateCategoryUI() {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.includes(DemoConfig.categories[this.currentCategory].label)) {
                btn.classList.add('active');
            }
        });
    }

    renderFeatures() {
        const container = document.getElementById('feature-container');
        container.innerHTML = '';
        
        const features = DemoConfig.categories[this.currentCategory].features;
        features.forEach(featureId => {
            const feature = DemoConfig.features[featureId];
            const card = this.createFeatureCard(featureId, feature);
            container.appendChild(card);
        });
    }

    createFeatureCard(featureId, feature) {
        const card = document.createElement('div');
        card.className = 'feature-card';
        card.innerHTML = `
            <div class="card-header">
                <h3>${feature.title}</h3>
                <button class="sync-btn" data-feature="${featureId}" 
                        data-tooltip="Toggle real-time updates for this feature">
                    <i class="fas fa-sync"></i>
                </button>
            </div>
            <p class="description">${feature.description}</p>
            <div class="metrics">
                ${feature.metrics.map(metric => this.createMetricHTML(featureId, metric)).join('')}
            </div>
            <div class="chart-container">
                <canvas id="chart-${featureId}"></canvas>
            </div>
        `;

        // Setup chart
        const chartCanvas = card.querySelector(`#chart-${featureId}`);
        this.chartManager.createChart(featureId, chartCanvas, feature.chartType, feature.chartOptions);
        
        // Setup sync button
        const syncBtn = card.querySelector('.sync-btn');
        syncBtn.addEventListener('click', () => this.toggleFeatureSync(featureId, syncBtn));

        // Setup metric input handlers
        card.querySelectorAll('.metric-value').forEach(input => {
            input.addEventListener('change', (e) => {
                const metricId = e.target.dataset.metric;
                const value = e.target.value;
                document.dispatchEvent(new CustomEvent('metric-change', {
                    detail: { featureId, metricId, value }
                }));
            });
        });

        return card;
    }

    createMetricHTML(featureId, metric) {
        const isEditable = metric.editable ? 'contenteditable="true"' : '';
        const editTooltip = metric.editable ? 'data-tooltip="Click to edit this value"' : '';
        return `
            <div class="metric">
                <i class="fas ${metric.icon}" data-tooltip="${metric.label}"></i>
                <span class="metric-label">${metric.label}</span>
                <span class="metric-value" 
                      data-feature="${featureId}" 
                      data-metric="${metric.id}"
                      ${isEditable}
                      ${editTooltip}>${metric.value}</span>
            </div>
        `;
    }

    toggleFeatureSync(featureId, button) {
        const isActive = button.classList.toggle('active');
        this.state.toggleFeatureSync(featureId, isActive);
        
        if (isActive && this.isRunning) {
            this.updateFeature(featureId);
        }
    }

    toggleDemo() {
        this.isRunning = !this.isRunning;
        const startBtn = document.getElementById('start-demo');
        startBtn.textContent = this.isRunning ? 'Stop Demo' : 'Start Demo';
        startBtn.classList.toggle('active', this.isRunning);

        if (this.isRunning) {
            this.startUpdates();
        } else {
            this.stopUpdates();
        }
    }

    startUpdates() {
        this.updateInterval = setInterval(() => {
            Object.keys(DemoConfig.features).forEach(featureId => {
                if (this.state.isFeatureActive(featureId)) {
                    this.updateFeature(featureId);
                }
            });
        }, DemoConfig.updateInterval);
    }

    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateFeature(featureId) {
        const newData = this.state.generateFeatureData(featureId);
        this.chartManager.updateChart(featureId, newData);
        
        // Update metrics
        const feature = DemoConfig.features[featureId];
        feature.metrics.forEach(metric => {
            const range = DemoRanges[featureId]?.[metric.id];
            if (range) {
                const value = this.state.generateMetricValue(range.min, range.max, metric.value);
                const element = document.querySelector(
                    `.metric-value[data-feature="${featureId}"][data-metric="${metric.id}"]`
                );
                if (element) {
                    element.textContent = this.formatMetricValue(value, metric.value);
                }
            }
        });
    }

    formatMetricValue(value, originalValue) {
        // Preserve the original format (e.g., '92%' or '5' or '4.2h')
        if (typeof originalValue === 'string') {
            if (originalValue.endsWith('%')) return `${Math.round(value)}%`;
            if (originalValue.endsWith('h')) return `${value.toFixed(1)}h`;
            if (originalValue.endsWith('t')) return `${value.toFixed(1)}t`;
            if (originalValue.endsWith('L')) return `${Math.round(value)}L`;
        }
        return value.toString();
    }

    saveConfig() {
        const config = {
            name: this.configName,
            timestamp: new Date().toISOString(),
            state: this.state.getState(),
            activeFeatures: this.state.getActiveFeatures(),
            customMetrics: this.gatherCustomMetrics()
        };

        // Save to localStorage
        let savedConfigs = JSON.parse(localStorage.getItem('farmfitConfigs') || '{}');
        savedConfigs[this.configName] = config;
        localStorage.setItem('farmfitConfigs', JSON.stringify(savedConfigs));

        this.showNotification('Configuration saved successfully!');
    }

    showLoadDialog() {
        const savedConfigs = JSON.parse(localStorage.getItem('farmfitConfigs') || '{}');
        
        if (Object.keys(savedConfigs).length === 0) {
            this.showNotification('No saved configurations found.', 'warning');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal config-modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Load Configuration</h3>
                <div class="config-list">
                    ${Object.entries(savedConfigs).map(([name, config]) => `
                        <div class="config-item" data-name="${name}">
                            <div class="config-info">
                                <h4>${name}</h4>
                                <p>Saved: ${new Date(config.timestamp).toLocaleString()}</p>
                            </div>
                            <button class="load-btn">Load</button>
                            <button class="delete-btn">Delete</button>
                        </div>
                    `).join('')}
                </div>
                <button class="close-modal">&times;</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('load-btn')) {
                const name = e.target.closest('.config-item').dataset.name;
                this.loadConfig(name);
                modal.remove();
            } else if (e.target.classList.contains('delete-btn')) {
                const name = e.target.closest('.config-item').dataset.name;
                this.deleteConfig(name);
                e.target.closest('.config-item').remove();
                if (modal.querySelectorAll('.config-item').length === 0) {
                    modal.remove();
                }
            } else if (e.target.classList.contains('close-modal') || e.target === modal) {
                modal.remove();
            }
        });
    }

    loadConfig(name) {
        const savedConfigs = JSON.parse(localStorage.getItem('farmfitConfigs') || '{}');
        const config = savedConfigs[name];
        
        if (!config) {
            this.showNotification('Configuration not found.', 'error');
            return;
        }

        this.configName = name;
        document.getElementById('config-name').value = name;
        
        // Restore state
        this.state.setState(config.state);
        
        // Restore active features
        config.activeFeatures.forEach(featureId => {
            this.state.toggleFeatureSync(featureId, true);
            const btn = document.querySelector(`.sync-btn[data-feature="${featureId}"]`);
            if (btn) btn.classList.add('active');
        });

        // Restore custom metrics
        this.restoreCustomMetrics(config.customMetrics);

        this.showNotification('Configuration loaded successfully!');
    }

    deleteConfig(name) {
        let savedConfigs = JSON.parse(localStorage.getItem('farmfitConfigs') || '{}');
        delete savedConfigs[name];
        localStorage.setItem('farmfitConfigs', JSON.stringify(savedConfigs));
        this.showNotification('Configuration deleted.');
    }

    exportConfig() {
        const config = {
            name: this.configName,
            timestamp: new Date().toISOString(),
            state: this.state.getState(),
            activeFeatures: this.state.getActiveFeatures(),
            customMetrics: this.gatherCustomMetrics()
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `farmfit-config-${this.configName}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    this.importConfig(config);
                } catch (err) {
                    this.showNotification('Invalid configuration file.', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    importConfig(config) {
        if (!this.validateConfig(config)) {
            this.showNotification('Invalid configuration format.', 'error');
            return;
        }

        this.configName = config.name;
        document.getElementById('config-name').value = config.name;
        
        // Import state
        this.state.setState(config.state);
        
        // Import active features
        config.activeFeatures.forEach(featureId => {
            this.state.toggleFeatureSync(featureId, true);
            const btn = document.querySelector(`.sync-btn[data-feature="${featureId}"]`);
            if (btn) btn.classList.add('active');
        });

        // Import custom metrics
        this.restoreCustomMetrics(config.customMetrics);

        this.showNotification('Configuration imported successfully!');
    }

    validateConfig(config) {
        return config 
            && typeof config.name === 'string'
            && config.timestamp
            && config.state
            && Array.isArray(config.activeFeatures)
            && config.customMetrics;
    }

    gatherCustomMetrics() {
        const metrics = {};
        document.querySelectorAll('.metric-value[contenteditable="true"]').forEach(elem => {
            const featureId = elem.dataset.feature;
            const metricId = elem.dataset.metric;
            if (!metrics[featureId]) metrics[featureId] = {};
            metrics[featureId][metricId] = elem.textContent;
        });
        return metrics;
    }

    restoreCustomMetrics(metrics) {
        Object.entries(metrics).forEach(([featureId, featureMetrics]) => {
            Object.entries(featureMetrics).forEach(([metricId, value]) => {
                const elem = document.querySelector(
                    `.metric-value[data-feature="${featureId}"][data-metric="${metricId}"]`
                );
                if (elem) elem.textContent = value;
            });
        });
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }, 100);
    }

    loadSavedConfig() {
        const lastConfig = localStorage.getItem('lastUsedConfig');
        if (lastConfig) {
            this.loadConfig(lastConfig);
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const demo = new FarmFitDemo();
    demo.initialize();
});
