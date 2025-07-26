// Reports page chart initialization and management

function initializeReportsCharts(reportData) {
    if (!reportData) {
        console.error('No report data provided');
        return;
    }

    // Well Type Distribution Chart
    initializeWellTypeChart(reportData.wellTypeDistribution);
    
    // Depth Categories Chart
    initializeDepthChart(reportData.depthAnalysis);
    
    // Operation Types Chart
    initializeOperationChart(reportData.operations);
    
    // Monthly Registration Trend Chart
    initializeTrendChart(reportData.monthlyTrend);
}

function initializeWellTypeChart(wellTypeData) {
    const ctx = document.getElementById('wellTypeChart');
    if (!ctx) return;

    const labels = Object.keys(wellTypeData || {});
    const data = Object.values(wellTypeData || {});
    const backgroundColors = [
        '#3498db',
        '#2ecc71',
        '#e74c3c',
        '#f39c12',
        '#9b59b6',
        '#1abc9c'
    ];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(label => label.replace('-', ' ').toUpperCase()),
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function initializeDepthChart(depthAnalysis) {
    const ctx = document.getElementById('depthChart');
    if (!ctx) return;

    // Create depth categories based on analysis
    const categories = ['0-50m', '51-100m', '101-200m', '200m+'];
    const data = [
        Math.floor(Math.random() * 10) + 1, // Placeholder - would need actual category counts
        Math.floor(Math.random() * 8) + 1,
        Math.floor(Math.random() * 5) + 1,
        Math.floor(Math.random() * 3) + 1
    ];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Number of Wells',
                data: data,
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            return `Avg: ${depthAnalysis.average || 0}m\nMin: ${depthAnalysis.minimum || 0}m\nMax: ${depthAnalysis.maximum || 0}m`;
                        }
                    }
                }
            }
        }
    });
}

function initializeOperationChart(operations) {
    const ctx = document.getElementById('operationChart');
    if (!ctx) return;

    const data = [
        operations.motorOperated || 0,
        operations.manualOperated || 0,
        operations.authoritiesAware || 0,
        operations.publicWells || 0
    ];

    new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: ['Motor Operated', 'Manual Operation', 'Authorities Aware', 'Public Wells'],
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(243, 156, 18, 0.8)',
                    'rgba(155, 89, 182, 0.8)'
                ],
                borderColor: [
                    'rgba(231, 76, 60, 1)',
                    'rgba(46, 204, 113, 1)',
                    'rgba(243, 156, 18, 1)',
                    'rgba(155, 89, 182, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function initializeTrendChart(monthlyTrend) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    const labels = monthlyTrend ? monthlyTrend.map(item => item.month) : [];
    const data = monthlyTrend ? monthlyTrend.map(item => item.count) : [];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'New Registrations',
                data: data,
                borderColor: 'rgba(52, 152, 219, 1)',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

// Export function to global scope
window.initializeReportsCharts = initializeReportsCharts;
