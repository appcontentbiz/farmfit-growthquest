// Configuration for the FarmFit demo application
export const DemoConfig = {
    updateInterval: 3000, // 3 seconds
    
    categories: {
        operations: {
            label: 'Operations',
            icon: 'fa-cogs',
            features: ['equipment', 'workforce', 'irrigation', 'harvesting', 'inventory', 'realFarming', 'voiceSearch', 'smartAlerts', 'livestock']
        },
        monitoring: {
            label: 'Monitoring',
            icon: 'fa-chart-line',
            features: ['gene', 'climate', 'soil', 'nutrient', 'pest', 'farmPlanner', 'organicFarming', 'hydroponics']
        },
        analytics: {
            label: 'Analytics',
            icon: 'fa-brain',
            features: ['yield', 'efficiency', 'forecast', 'optimization', 'sustainability', 'financial', 'permaculture', 'aquaponics']
        },
        automation: {
            label: 'Automation',
            icon: 'fa-robot',
            features: ['drones', 'robotics', 'scheduling', 'integration', 'ai', 'verticalFarming', 'precisionAg', 'interactiveViews']
        }
    },
    
    features: {
        // Operations Category
        equipment: {
            title: 'Equipment Management',
            description: 'Monitor and manage farm equipment status and maintenance',
            metrics: [
                { id: 'operational', label: 'Operational', value: '92%', icon: 'fa-cogs', editable: true },
                { id: 'maintenance', label: 'Maintenance', value: '5', icon: 'fa-tools', editable: true }
            ],
            chartType: 'bar',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Operational Status (%)' }
                    }
                }
            }
        },
        workforce: {
            title: 'Workforce Management',
            description: 'Track team performance and resource allocation',
            metrics: [
                { id: 'efficiency', label: 'Efficiency', value: '85%', icon: 'fa-chart-line', editable: true },
                { id: 'teams', label: 'Active Teams', value: '12', icon: 'fa-users', editable: true }
            ],
            chartType: 'line',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Efficiency (%)' }
                    }
                }
            }
        },
        irrigation: {
            title: 'Irrigation Control',
            description: 'Smart irrigation system management',
            metrics: [
                { id: 'waterUsage', label: 'Water Usage', value: '450L', icon: 'fa-tint', editable: true },
                { id: 'efficiency', label: 'System Efficiency', value: '94%', icon: 'fa-tachometer-alt', editable: true }
            ],
            chartType: 'line',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Water Usage (L)' }
                    }
                }
            }
        },
        harvesting: {
            title: 'Harvest Planning',
            description: 'Optimize harvest timing and resource allocation',
            metrics: [
                { id: 'readiness', label: 'Crop Readiness', value: '78%', icon: 'fa-seedling', editable: true },
                { id: 'estimated', label: 'Est. Yield', value: '12.5t', icon: 'fa-weight', editable: true }
            ],
            chartType: 'bar',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Readiness (%)' }
                    }
                }
            }
        },
        inventory: {
            title: 'Smart Inventory',
            description: 'AI-powered inventory tracking and management',
            metrics: [
                { id: 'stock', label: 'Stock Level', value: '89%', icon: 'fa-boxes', editable: true },
                { id: 'turnover', label: 'Turnover Rate', value: '12.5/mo', icon: 'fa-sync', editable: true }
            ],
            chartType: 'bar',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Stock Level (%)' }
                    }
                }
            }
        },
        realFarming: {
            title: 'Real Farming Data',
            description: 'Live data integration from actual farming operations',
            metrics: [
                { id: 'dataPoints', label: 'Active Sensors', value: '1,247', icon: 'fa-database', editable: true },
                { id: 'updateFreq', label: 'Update Frequency', value: '30s', icon: 'fa-clock', editable: true }
            ],
            chartType: 'line',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Data Points' }
                    }
                }
            }
        },
        voiceSearch: {
            title: 'Voice Search & Control',
            description: 'Voice-activated farm management commands',
            metrics: [
                { id: 'accuracy', label: 'Recognition Rate', value: '95%', icon: 'fa-microphone', editable: true },
                { id: 'commands', label: 'Available Commands', value: '156', icon: 'fa-list', editable: true }
            ],
            chartType: 'bar',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Usage Count' }
                    }
                }
            }
        },
        smartAlerts: {
            title: 'Smart Alerts System',
            description: 'AI-powered predictive alerting system',
            metrics: [
                { id: 'activeAlerts', label: 'Active Alerts', value: '3', icon: 'fa-bell', editable: true },
                { id: 'accuracy', label: 'Prediction Accuracy', value: '94%', icon: 'fa-bullseye', editable: true }
            ],
            chartType: 'doughnut',
            chartOptions: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        },
        livestock: {
            title: 'Livestock Management',
            description: 'Comprehensive livestock tracking and health monitoring system',
            metrics: [
                { id: 'health', label: 'Herd Health', value: '98%', icon: 'fa-heartbeat', editable: true },
                { id: 'feed', label: 'Feed Efficiency', value: '94%', icon: 'fa-wheat', editable: true },
                { id: 'count', label: 'Total Head', value: '2,450', icon: 'fa-cow', editable: true },
                { id: 'growth', label: 'Growth Rate', value: '+2.8%', icon: 'fa-chart-line', editable: true }
            ],
            subFeatures: {
                breeding: {
                    label: 'Breeding Program',
                    metrics: [
                        { id: 'success', label: 'Success Rate', value: '92%' },
                        { id: 'genetics', label: 'Genetic Quality', value: 'A+' }
                    ]
                },
                health: {
                    label: 'Health Monitoring',
                    metrics: [
                        { id: 'vaccinated', label: 'Vaccinated', value: '100%' },
                        { id: 'wellness', label: 'Wellness Score', value: '96%' }
                    ]
                },
                nutrition: {
                    label: 'Nutrition Management',
                    metrics: [
                        { id: 'feed_cost', label: 'Feed Cost', value: '$2.45/day' },
                        { id: 'conversion', label: 'Feed Conversion', value: '1.8:1' }
                    ]
                }
            },
            chartType: 'mixed',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Population & Health Metrics' }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        },

        // Monitoring Category
        gene: {
            title: 'Gene Expression',
            description: 'Monitor genetic markers and expression levels',
            metrics: [
                { id: 'accuracy', label: 'Accuracy', value: '98%', icon: 'fa-dna', editable: true },
                { id: 'markers', label: 'Active Markers', value: '3', icon: 'fa-microscope', editable: true }
            ],
            chartType: 'line',
            chartOptions: {
                elements: { line: { tension: 0.4 } },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Expression Level (%)' }
                    }
                }
            }
        },
        climate: {
            title: 'Climate Modeling',
            description: 'Track and predict environmental conditions',
            metrics: [
                { id: 'forecast', label: 'Forecast Accuracy', value: '95%', icon: 'fa-cloud-sun', editable: true },
                { id: 'range', label: 'Forecast Range', value: '7 days', icon: 'fa-calendar-alt', editable: true }
            ],
            chartType: 'line',
            chartOptions: {
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: { display: true, text: 'Temperature (°C)' }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        title: { display: true, text: 'Rainfall (mm)' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        },
        soil: {
            title: 'Soil Analysis',
            description: 'Monitor soil health and composition',
            metrics: [
                { id: 'moisture', label: 'Moisture', value: '42%', icon: 'fa-water', editable: true },
                { id: 'ph', label: 'pH Level', value: '6.8', icon: 'fa-flask', editable: true }
            ],
            chartType: 'line',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Moisture (%)' }
                    }
                }
            }
        },
        nutrient: {
            title: 'Nutrient Tracking',
            description: 'Monitor and optimize nutrient levels',
            metrics: [
                { id: 'nitrogen', label: 'Nitrogen', value: '85%', icon: 'fa-leaf', editable: true },
                { id: 'phosphorus', label: 'Phosphorus', value: '78%', icon: 'fa-atom', editable: true }
            ],
            chartType: 'radar',
            chartOptions: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        },
        pest: {
            title: 'Pest Detection',
            description: 'ML-based pest detection and management',
            metrics: [
                { id: 'detection', label: 'Detection Rate', value: '96%', icon: 'fa-bug', editable: true },
                { id: 'risk', label: 'Risk Level', value: 'Low', icon: 'fa-shield-alt', editable: true }
            ],
            chartType: 'line',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Detection Rate (%)' }
                    }
                }
            }
        },
        farmPlanner: {
            title: 'Farm Planner',
            description: 'Interactive crop planning and rotation tool',
            metrics: [
                { id: 'activePlans', label: 'Active Plans', value: '8', icon: 'fa-calendar', editable: true },
                { id: 'efficiency', label: 'Space Utilization', value: '92%', icon: 'fa-chart-pie', editable: true }
            ],
            chartType: 'radar',
            chartOptions: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        },
        organicFarming: {
            title: 'Organic Farming',
            description: 'Organic certification and compliance tracking',
            metrics: [
                { id: 'certified', label: 'Certified Area', value: '85%', icon: 'fa-certificate', editable: true },
                { id: 'yield', label: 'Organic Yield', value: '28t/ha', icon: 'fa-leaf', editable: true }
            ],
            chartType: 'line',
            chartOptions: {
                tension: 0.4
            }
        },
        hydroponics: {
            title: 'Hydroponics System',
            description: 'Soilless growing system management',
            metrics: [
                { id: 'nutrients', label: 'Nutrient Balance', value: '98%', icon: 'fa-tint', editable: true },
                { id: 'growth', label: 'Growth Rate', value: '+24%', icon: 'fa-arrow-up', editable: true }
            ],
            chartType: 'bar'
        },
        verticalFarming: {
            title: 'Vertical Farming',
            description: 'Multi-level indoor farming system',
            metrics: [
                { id: 'layers', label: 'Active Layers', value: '12', icon: 'fa-layer-group', editable: true },
                { id: 'density', label: 'Plant Density', value: '850/m²', icon: 'fa-seedling', editable: true }
            ],
            chartType: 'bar'
        },
        aquaponics: {
            title: 'Aquaponics System',
            description: 'Fish and plant integrated farming',
            metrics: [
                { id: 'fishHealth', label: 'Fish Health', value: '96%', icon: 'fa-fish', editable: true },
                { id: 'waterQuality', label: 'Water Quality', value: '94%', icon: 'fa-water', editable: true }
            ],
            chartType: 'line'
        },
        permaculture: {
            title: 'Permaculture Design',
            description: 'Sustainable ecosystem management',
            metrics: [
                { id: 'diversity', label: 'Species Diversity', value: '145', icon: 'fa-tree', editable: true },
                { id: 'sustainability', label: 'Sustainability Score', value: '98%', icon: 'fa-infinity', editable: true }
            ],
            chartType: 'radar'
        },

        // Analytics Category
        yield: {
            title: 'Yield Analytics',
            description: 'Analyze and predict crop yields',
            metrics: [
                { id: 'current', label: 'Current Yield', value: '14.2t', icon: 'fa-chart-bar', editable: true },
                { id: 'predicted', label: 'Predicted', value: '15.8t', icon: 'fa-chart-line', editable: true }
            ],
            chartType: 'bar',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Yield (tons)' }
                    }
                }
            }
        },
        efficiency: {
            title: 'Resource Efficiency',
            description: 'Track and optimize resource utilization',
            metrics: [
                { id: 'water', label: 'Water Usage', value: '92%', icon: 'fa-tint', editable: true },
                { id: 'energy', label: 'Energy', value: '88%', icon: 'fa-bolt', editable: true }
            ],
            chartType: 'doughnut',
            chartOptions: {
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        },
        forecast: {
            title: 'Yield Forecasting',
            description: 'AI-powered yield predictions',
            metrics: [
                { id: 'accuracy', label: 'Model Accuracy', value: '94%', icon: 'fa-bullseye', editable: true },
                { id: 'confidence', label: 'Confidence', value: '89%', icon: 'fa-check-circle', editable: true }
            ],
            chartType: 'line',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Predicted Yield' }
                    }
                }
            }
        },
        optimization: {
            title: 'Process Optimization',
            description: 'ML-driven process optimization',
            metrics: [
                { id: 'savings', label: 'Cost Savings', value: '15%', icon: 'fa-piggy-bank', editable: true },
                { id: 'efficiency', label: 'Process Efficiency', value: '91%', icon: 'fa-cog', editable: true }
            ],
            chartType: 'bar',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Optimization Score' }
                    }
                }
            }
        },
        sustainability: {
            title: 'Sustainability Metrics',
            description: 'Environmental impact and sustainability tracking',
            metrics: [
                { id: 'carbon', label: 'Carbon Offset', value: '45t', icon: 'fa-leaf', editable: true },
                { id: 'waste', label: 'Waste Reduction', value: '78%', icon: 'fa-recycle', editable: true }
            ],
            chartType: 'radar',
            chartOptions: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        },
        financial: {
            title: 'Financial Analytics',
            description: 'Comprehensive financial tracking and forecasting',
            metrics: [
                { id: 'roi', label: 'Current ROI', value: '24%', icon: 'fa-chart-line', editable: true },
                { id: 'margin', label: 'Profit Margin', value: '32%', icon: 'fa-percentage', editable: true }
            ],
            chartType: 'line',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        },
        precisionAg: {
            title: 'Precision Agriculture',
            description: 'GPS-guided precision farming system',
            metrics: [
                { id: 'accuracy', label: 'Position Accuracy', value: '±2cm', icon: 'fa-crosshairs', editable: true },
                { id: 'coverage', label: 'Field Coverage', value: '99.8%', icon: 'fa-map-marked', editable: true }
            ],
            chartType: 'scatter'
        },
        interactiveViews: {
            title: 'Interactive Features',
            description: '3D visualization and interaction tools',
            metrics: [
                { id: 'views', label: 'Available Views', value: '12', icon: 'fa-cube', editable: true },
                { id: 'interactions', label: 'Daily Interactions', value: '847', icon: 'fa-hand-pointer', editable: true }
            ],
            chartType: 'bubble'
        },

        // Automation Category
        drones: {
            title: 'Drone Operations',
            description: 'Autonomous drone monitoring system',
            metrics: [
                { id: 'coverage', label: 'Area Coverage', value: '85%', icon: 'fa-drone', editable: true },
                { id: 'battery', label: 'Battery Life', value: '4.2h', icon: 'fa-battery-three-quarters', editable: true }
            ],
            chartType: 'line',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Coverage (%)' }
                    }
                }
            }
        },
        robotics: {
            title: 'Robotic Systems',
            description: 'Automated farming robots',
            metrics: [
                { id: 'active', label: 'Active Units', value: '8', icon: 'fa-robot', editable: true },
                { id: 'efficiency', label: 'Task Completion', value: '94%', icon: 'fa-tasks', editable: true }
            ],
            chartType: 'bar',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Efficiency (%)' }
                    }
                }
            }
        },
        scheduling: {
            title: 'Smart Scheduling',
            description: 'AI-powered task scheduling',
            metrics: [
                { id: 'optimization', label: 'Schedule Opt.', value: '92%', icon: 'fa-calendar-check', editable: true },
                { id: 'tasks', label: 'Active Tasks', value: '24', icon: 'fa-list-check', editable: true }
            ],
            chartType: 'line',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Optimization Level' }
                    }
                }
            }
        },
        integration: {
            title: 'System Integration',
            description: 'IoT and system interconnectivity',
            metrics: [
                { id: 'devices', label: 'Connected Devices', value: '156', icon: 'fa-network-wired', editable: true },
                { id: 'uptime', label: 'System Uptime', value: '99.9%', icon: 'fa-server', editable: true }
            ],
            chartType: 'bubble',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Integration Score' }
                    }
                }
            }
        },
        ai: {
            title: 'AI Decision Support',
            description: 'Advanced AI-powered decision making system',
            metrics: [
                { id: 'accuracy', label: 'Decision Accuracy', value: '92%', icon: 'fa-brain', editable: true },
                { id: 'insights', label: 'Daily Insights', value: '24', icon: 'fa-lightbulb', editable: true }
            ],
            chartType: 'bubble',
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Confidence Level' }
                    }
                }
            }
        }
    },
    
    chartDefaults: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 750, easing: 'easeInOutQuart' },
        plugins: {
            legend: { position: 'top' },
            tooltip: { mode: 'index', intersect: false }
        }
    }
};

// Demo data ranges for simulation
export const DemoRanges = {
    equipment: {
        operational: { min: 85, max: 100 },
        maintenance: { min: 0, max: 8 }
    },
    workforce: {
        efficiency: { min: 80, max: 100 },
        teams: { min: 10, max: 15 }
    },
    irrigation: {
        waterUsage: { min: 400, max: 500 },
        efficiency: { min: 90, max: 98 }
    },
    harvesting: {
        readiness: { min: 70, max: 100 },
        estimated: { min: 10, max: 15 }
    },
    gene: {
        accuracy: { min: 95, max: 100 },
        markers: { min: 2, max: 5 }
    },
    climate: {
        temperature: { min: 15, max: 35 },
        rainfall: { min: 0, max: 100 }
    },
    soil: {
        moisture: { min: 35, max: 50 },
        ph: { min: 6.0, max: 7.5 }
    },
    nutrient: {
        nitrogen: { min: 75, max: 95 },
        phosphorus: { min: 70, max: 90 }
    },
    yield: {
        current: { min: 12, max: 16 },
        predicted: { min: 14, max: 18 }
    },
    efficiency: {
        water: { min: 85, max: 98 },
        energy: { min: 80, max: 95 }
    },
    forecast: {
        accuracy: { min: 90, max: 98 },
        confidence: { min: 85, max: 95 }
    },
    optimization: {
        savings: { min: 10, max: 20 },
        efficiency: { min: 85, max: 95 }
    },
    drones: {
        coverage: { min: 80, max: 95 },
        battery: { min: 3.5, max: 4.8 }
    },
    robotics: {
        active: { min: 6, max: 12 },
        efficiency: { min: 90, max: 98 }
    },
    scheduling: {
        optimization: { min: 88, max: 96 },
        tasks: { min: 20, max: 30 }
    },
    integration: {
        devices: { min: 140, max: 180 },
        uptime: { min: 99.5, max: 100 }
    },
    inventory: {
        stock: { min: 75, max: 100 },
        turnover: { min: 8, max: 15 }
    },
    pest: {
        detection: { min: 90, max: 100 },
        risk: { min: 1, max: 3, labels: ['Low', 'Medium', 'High'] }
    },
    sustainability: {
        carbon: { min: 30, max: 60 },
        waste: { min: 70, max: 90 }
    },
    ai: {
        accuracy: { min: 88, max: 98 },
        insights: { min: 15, max: 30 }
    },
    realFarming: {
        dataPoints: { min: 1000, max: 2000 },
        updateFreq: { min: 15, max: 60, suffix: 's' }
    },
    voiceSearch: {
        accuracy: { min: 90, max: 98, suffix: '%' },
        commands: { min: 100, max: 200 }
    },
    smartAlerts: {
        activeAlerts: { min: 0, max: 10 },
        accuracy: { min: 90, max: 98, suffix: '%' }
    },
    farmPlanner: {
        activePlans: { min: 5, max: 15 },
        efficiency: { min: 85, max: 98, suffix: '%' }
    },
    organicFarming: {
        certified: { min: 80, max: 100, suffix: '%' },
        yield: { min: 20, max: 35, suffix: 't/ha' }
    },
    hydroponics: {
        nutrients: { min: 90, max: 100, suffix: '%' },
        growth: { min: 15, max: 30, prefix: '+', suffix: '%' }
    },
    verticalFarming: {
        layers: { min: 8, max: 16 },
        density: { min: 700, max: 1000, suffix: '/m²' }
    },
    aquaponics: {
        fishHealth: { min: 90, max: 100, suffix: '%' },
        waterQuality: { min: 90, max: 100, suffix: '%' }
    },
    permaculture: {
        diversity: { min: 100, max: 200 },
        sustainability: { min: 90, max: 100, suffix: '%' }
    },
    financial: {
        roi: { min: 15, max: 35, suffix: '%' },
        margin: { min: 25, max: 40, suffix: '%' }
    },
    precisionAg: {
        accuracy: { min: 1, max: 5, prefix: '±', suffix: 'cm' },
        coverage: { min: 98, max: 100, suffix: '%' }
    },
    interactiveViews: {
        views: { min: 8, max: 16 },
        interactions: { min: 500, max: 1000 }
    },
    livestock: {
        health: { min: 90, max: 100, suffix: '%' },
        feed: { min: 85, max: 98, suffix: '%' },
        count: { min: 2000, max: 3000 },
        growth: { min: 1.5, max: 3.5, prefix: '+', suffix: '%' }
    }
};
