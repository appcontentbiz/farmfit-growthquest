// Global variables
let demoChart = null;
let autoUpdateInterval = null;

// Core features configuration
const features = [
    {
        id: 'analytics',
        title: 'Real-time Analytics',
        description: 'Live farm data analysis',
        icon: 'chart-line',
        chartType: 'line'
    },
    {
        id: 'predictions',
        title: 'AI Predictions',
        description: 'Smart crop yield forecasting',
        icon: 'brain',
        chartType: 'bar'
    },
    {
        id: 'monitoring',
        title: 'Crop Monitoring',
        description: 'Real-time crop health tracking',
        icon: 'leaf',
        chartType: 'line'
    }
];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadFeatures();
    setupChartDefaults();
});

// Load feature grid
function loadFeatures() {
    const grid = document.getElementById('feature-grid');
    if (!grid) return;

    features.forEach(feature => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        col.innerHTML = `
            <div class="card h-100" onclick="showDemo('${feature.id}')">
                <div class="card-body text-center">
                    <i class="fas fa-${feature.icon} fa-2x mb-3"></i>
                    <h5 class="card-title">${feature.title}</h5>
                    <p class="card-text">${feature.description}</p>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
}

// Chart configuration
function setupChartDefaults() {
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial';
    Chart.defaults.color = '#666';
    Chart.defaults.responsive = true;
}

// Show feature demo
function showDemo(featureId) {
    const feature = features.find(f => f.id === featureId);
    if (!feature) return;

    // Update UI
    document.getElementById('feature-grid').classList.add('d-none');
    document.getElementById('demo-content').classList.remove('d-none');
    document.getElementById('demo-title').textContent = feature.title;

    // Initialize chart
    initializeChart(feature);
    updateMetrics(feature);
}

// Initialize chart
function initializeChart(feature) {
    const ctx = document.getElementById('demoChart').getContext('2d');
    
    // Destroy existing chart if any
    if (demoChart) {
        demoChart.destroy();
    }

    const data = generateChartData();
    
    demoChart = new Chart(ctx, {
        type: feature.chartType,
        data: {
            labels: Array.from({length: 10}, (_, i) => `Day ${i + 1}`),
            datasets: [{
                label: feature.title,
                data: data,
                borderColor: '#007bff',
                backgroundColor: feature.chartType === 'bar' ? 
                    'rgba(0, 123, 255, 0.5)' : 
                    'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: feature.chartType === 'line',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Generate random data
function generateChartData() {
    return Array.from({length: 10}, () => 
        Math.round((Math.random() * 60 + 40) * 10) / 10
    );
}

// Update chart data
function updateData() {
    if (!demoChart) return;
    
    const newData = generateChartData();
    demoChart.data.datasets[0].data = newData;
    demoChart.update('active');
    
    updateMetrics();
}

// Toggle auto update
function toggleAutoUpdate() {
    const btn = document.getElementById('autoUpdateBtn');
    
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        autoUpdateInterval = null;
        btn.textContent = 'Start Auto Update';
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-outline-primary');
    } else {
        autoUpdateInterval = setInterval(updateData, 2000);
        btn.textContent = 'Stop Auto Update';
        btn.classList.remove('btn-outline-primary');
        btn.classList.add('btn-danger');
    }
}

// Update metrics
function updateMetrics() {
    const metrics = document.getElementById('metrics');
    if (!metrics || !demoChart) return;

    const data = demoChart.data.datasets[0].data;
    const average = data.reduce((a, b) => a + b, 0) / data.length;
    const max = Math.max(...data);
    const min = Math.min(...data);

    metrics.innerHTML = `
        <div class="col-md-4">
            <div class="card">
                <div class="card-body text-center">
                    <h6 class="card-subtitle mb-2 text-muted">Average</h6>
                    <h3 class="card-title">${average.toFixed(1)}</h3>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card">
                <div class="card-body text-center">
                    <h6 class="card-subtitle mb-2 text-muted">Maximum</h6>
                    <h3 class="card-title">${max.toFixed(1)}</h3>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card">
                <div class="card-body text-center">
                    <h6 class="card-subtitle mb-2 text-muted">Minimum</h6>
                    <h3 class="card-title">${min.toFixed(1)}</h3>
                </div>
            </div>
        </div>
    `;
}

// Close demo
function closeDemo() {
    // Stop auto update if running
    if (autoUpdateInterval) {
        toggleAutoUpdate();
    }
    
    // Reset UI
    document.getElementById('feature-grid').classList.remove('d-none');
    document.getElementById('demo-content').classList.add('d-none');
    
    // Cleanup
    if (demoChart) {
        demoChart.destroy();
        demoChart = null;
    }
}
