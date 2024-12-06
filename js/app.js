import { Demo } from './demo.js';
import { createChart } from './charts.js';
import { DataHandlers } from './data-handlers.js';

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize demo features
    Demo.initialize();

    // Show default category
    Demo.showCategory('operations');

    // Add window resize handler
    window.addEventListener('resize', handleResize);
});

// Handle window resizing
function handleResize() {
    const state = Demo.getState();
    Object.values(state.charts).forEach(chart => {
        if (chart) {
            chart.resize();
        }
    });
}

// Export necessary functions for global access
window.FarmFit = {
    Demo,
    createChart,
    DataHandlers
};
