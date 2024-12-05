// Demo state management
const DemoState = {
    charts: {},
    realTimeIntervals: {},
    currentCategory: null,
    isDemo: false
};

// Demo initialization
export function initializeDemo() {
    setupEventListeners();
    initializeCategories();
}

function setupEventListeners() {
    // Category navigation
    document.querySelectorAll('.category-nav button').forEach(button => {
        button.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            showCategory(category);
        });
    });

    // Real-time toggles
    document.querySelectorAll('[data-realtime]').forEach(button => {
        button.addEventListener('click', (e) => {
            const type = e.target.dataset.realtime;
            toggleRealTimeUpdates(type);
        });
    });

    // Form submissions
    setupFormHandlers();
}

function setupFormHandlers() {
    // Equipment form
    const equipmentForm = document.getElementById('equipmentForm');
    if (equipmentForm) {
        equipmentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleEquipmentUpdate(new FormData(equipmentForm));
        });
    }

    // Workforce form
    const workforceForm = document.getElementById('workforceForm');
    if (workforceForm) {
        workforceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleWorkforceUpdate(new FormData(workforceForm));
        });
    }

    // Gene expression form
    const geneForm = document.getElementById('geneForm');
    if (geneForm) {
        geneForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleGeneUpdate(new FormData(geneForm));
        });
    }
}

// Category management
function showCategory(category) {
    DemoState.currentCategory = category;
    
    // Hide all categories
    document.querySelectorAll('.feature-category').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show selected category
    document.querySelectorAll(`.feature-category.${category}`).forEach(el => {
        el.style.display = 'block';
    });
    
    // Update active button
    document.querySelectorAll('.category-nav button').forEach(button => {
        button.classList.toggle('active', button.dataset.category === category);
    });
    
    // Initialize charts for visible cards
    initializeVisibleCharts();
}

// Chart management
function initializeVisibleCharts() {
    document.querySelectorAll('.feature-card:visible').forEach(card => {
        const chartType = card.dataset.chartType;
        if (chartType && !DemoState.charts[chartType]) {
            initializeChart(chartType);
        }
    });
}

function initializeChart(type) {
    const ctx = document.querySelector(`#${type}Chart`)?.getContext('2d');
    if (!ctx) return;

    // Clear existing chart
    if (DemoState.charts[type]) {
        DemoState.charts[type].destroy();
    }

    // Initialize new chart based on type
    DemoState.charts[type] = createChart(type, ctx);
}

// Real-time updates
function toggleRealTimeUpdates(type) {
    if (DemoState.realTimeIntervals[type]) {
        clearInterval(DemoState.realTimeIntervals[type]);
        DemoState.realTimeIntervals[type] = null;
        document.querySelector(`[data-realtime="${type}"]`).classList.remove('active');
    } else {
        DemoState.realTimeIntervals[type] = setInterval(() => updateRealTimeData(type), 5000);
        document.querySelector(`[data-realtime="${type}"]`).classList.add('active');
    }
}

function updateRealTimeData(type) {
    const chart = DemoState.charts[type];
    if (!chart) return;

    switch(type) {
        case 'equipment':
            updateEquipmentData(chart);
            break;
        case 'workforce':
            updateWorkforceData(chart);
            break;
        case 'gene':
            updateGeneData(chart);
            break;
        case 'climate':
            updateClimateData(chart);
            break;
    }
}

// Export necessary functions
export const Demo = {
    initialize: initializeDemo,
    showCategory,
    toggleRealTimeUpdates,
    getState: () => DemoState
};
