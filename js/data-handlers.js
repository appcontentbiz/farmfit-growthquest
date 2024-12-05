// Data update handlers for each feature
export const DataHandlers = {
    equipment: {
        update: (chart) => {
            const newData = chart.data.datasets[0].data.map(() => 
                Math.floor(80 + Math.random() * 20)
            );
            chart.data.datasets[0].data = newData;
            chart.update('none');

            // Update metrics
            updateMetric('equipmentOperational', Math.floor(85 + Math.random() * 15) + '%');
            updateMetric('equipmentMaintenance', Math.floor(Math.random() * 8));
        },

        handleForm: (formData) => {
            const equipmentId = formData.get('equipmentId');
            if (!equipmentId) {
                showAlert('equipmentAlert', 'Please enter an Equipment ID', 'warning');
                return;
            }
            
            const operational = Math.floor(85 + Math.random() * 15);
            updateMetric('equipmentOperational', operational + '%');
            showAlert('equipmentAlert', `Equipment ${equipmentId} status updated successfully`, 'success');
        }
    },

    workforce: {
        update: (chart) => {
            chart.data.datasets.forEach(dataset => {
                dataset.data = dataset.data.map(() => 
                    Math.floor(60 + Math.random() * 30)
                );
            });
            chart.update('none');

            // Update metrics
            updateMetric('workforceEfficiency', Math.floor(80 + Math.random() * 20) + '%');
            updateMetric('activeTeams', 10 + Math.floor(Math.random() * 5));
        },

        handleForm: (formData) => {
            const team = formData.get('team');
            const size = formData.get('teamSize');
            
            if (!team || !size) {
                showAlert('workforceAlert', 'Please fill in all fields', 'warning');
                return;
            }
            
            const efficiency = Math.floor(80 + Math.random() * 20);
            updateMetric('workforceEfficiency', efficiency + '%');
            showAlert('workforceAlert', `Team ${team} updated with ${size} members`, 'success');
        }
    },

    gene: {
        update: (chart) => {
            const timeLabels = Array.from({length: 24}, (_, i) => `${i}h`);
            chart.data.datasets.forEach((dataset, index) => {
                dataset.data = generateWaveData(
                    40 + index * 10,
                    1 + index * 0.5,
                    Math.random() * Math.PI,
                    timeLabels.length
                );
            });
            chart.update('none');

            // Update metrics
            updateMetric('activeMarkers', 2 + Math.floor(Math.random() * 3));
            updateMetric('geneAccuracy', Math.floor(95 + Math.random() * 5) + '%');
        },

        handleForm: (formData) => {
            const gene = formData.get('gene');
            const level = formData.get('expressionLevel');
            
            if (!gene || !level) {
                showAlert('geneAlert', 'Please fill in all fields', 'warning');
                return;
            }
            
            const accuracy = Math.floor(95 + Math.random() * 5);
            updateMetric('geneAccuracy', accuracy + '%');
            showAlert('geneAlert', `Gene ${gene} expression level updated to ${level}`, 'success');
        }
    },

    climate: {
        update: (chart) => {
            const tempData = chart.data.datasets[0].data;
            const rainData = chart.data.datasets[1].data;
            
            tempData.shift();
            rainData.shift();
            tempData.push(15 + Math.random() * 20);
            rainData.push(Math.random() * 100);
            chart.update('none');

            // Update metrics
            updateMetric('forecastAccuracy', Math.floor(90 + Math.random() * 10) + '%');
        },

        handleForm: (formData) => {
            const temperature = formData.get('temperature');
            const rainfall = formData.get('rainfall');
            
            if (!temperature || !rainfall) {
                showAlert('climateAlert', 'Please fill in all fields', 'warning');
                return;
            }
            
            const accuracy = Math.floor(90 + Math.random() * 10);
            updateMetric('forecastAccuracy', accuracy + '%');
            showAlert('climateAlert', 'Climate data updated successfully', 'success');
        }
    }
};

// Utility functions
function updateMetric(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function showAlert(elementId, message, type) {
    const alert = document.getElementById(elementId);
    if (alert) {
        alert.textContent = message;
        alert.className = `alert alert-${type} mt-2`;
        alert.style.display = 'block';
        
        setTimeout(() => {
            alert.style.display = 'none';
        }, 3000);
    }
}

function generateWaveData(amplitude, frequency, phase, length) {
    return Array.from({length}, (_, i) => 
        amplitude * Math.sin(frequency * i * Math.PI / 12 + phase) + amplitude
    );
}
