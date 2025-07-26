// Dashboard charts functionality

function initializeDashboardCharts(statsData, monthlyActivityData) {
    // Status Chart
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        new Chart(statusCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Active', 'Inactive'],
                datasets: [{
                    data: [statsData.active, statsData.inactive],
                    backgroundColor: ['#10b981', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Activity Chart with real data
    const activityCtx = document.getElementById('activityChart');
    if (activityCtx && monthlyActivityData) {
        new Chart(activityCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: monthlyActivityData.labels,
                datasets: [{
                    label: 'Borewells Registered',
                    data: monthlyActivityData.data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return Number.isInteger(value) ? value : null;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return context[0].label + ' 2024';
                            },
                            label: function(context) {
                                const count = context.parsed.y;
                                return count === 1 ? '1 borewell registered' : count + ' borewells registered';
                            }
                        }
                    }
                }
            }
        });
    }
}

// Export for use in templates
window.initializeDashboardCharts = initializeDashboardCharts;
