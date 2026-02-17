

class ChartsManagerModule {
    constructor() {
        this.charts = new Map();
        this.chartInstances = new Map();
        this.defaultOptions = this.getDefaultChartOptions();
        this.colorPalette = this.getColorPalette();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            await this.initializeAttendanceChart();
            await this.initializeProductivityChart();
            await this.initializeDepartmentChart();
            await this.initializeTimeAnalysisChart();
            
            this.initialized = true;
            console.log('📊 Charts Manager initialized successfully');
        } catch (error) {
            console.error('Error initializing charts:', error);
            throw error;
        }
    }

    async initializeAttendanceChart() {
        const canvas = document.getElementById('attendanceChart');
        if (!canvas) return;

        try {
            const data = await this.fetchChartData('attendance');
            const config = {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Asistencia (%)',
                        data: data.values,
                        borderColor: this.colorPalette.primary,
                        backgroundColor: this.colorPalette.primaryAlpha,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: this.colorPalette.primary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    ...this.defaultOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Tendencia de Asistencia (Últimos 30 días)',
                            font: { size: 16, weight: 'bold' }
                        },
                        legend: {
                            display: false
                        }
                    }
                }
            };

            const chart = new Chart(canvas.getContext('2d'), config);
            this.chartInstances.set('attendance', chart);
            
        } catch (error) {
            console.error('Error initializing attendance chart:', error);
        }
    }

    async initializeProductivityChart() {
        const canvas = document.getElementById('productivityChart');
        if (!canvas) return;

        try {
            const data = await this.fetchChartData('productivity');
            const config = {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Productividad',
                        data: data.values,
                        backgroundColor: data.values.map((_, index) => 
                            this.colorPalette.gradient[index % this.colorPalette.gradient.length]
                        ),
                        borderColor: data.values.map((_, index) => 
                            this.colorPalette.borders[index % this.colorPalette.borders.length]
                        ),
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    ...this.defaultOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Productividad por Departamento',
                            font: { size: 16, weight: 'bold' }
                        },
                        legend: {
                            display: false
                        }
                    }
                }
            };

            const chart = new Chart(canvas.getContext('2d'), config);
            this.chartInstances.set('productivity', chart);
            
        } catch (error) {
            console.error('Error initializing productivity chart:', error);
        }
    }
    async initializeDepartmentChart() {
        const canvas = document.getElementById('departmentChart');
        if (!canvas) return;

        try {
            const data = await this.fetchChartData('departments');
            const config = {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: this.colorPalette.pie,
                        borderColor: '#ffffff',
                        borderWidth: 3,
                        hoverBorderWidth: 4
                    }]
                },
                options: {
                    ...this.defaultOptions,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribución por Departamento',
                            font: { size: 16, weight: 'bold' }
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: { size: 12 }
                            }
                        }
                    },
                    cutout: '60%'
                }
            };

            const chart = new Chart(canvas.getContext('2d'), config);
            this.chartInstances.set('departments', chart);
            
        } catch (error) {
            console.error('Error initializing department chart:', error);
        }
    }
    async initializeTimeAnalysisChart() {
        const canvas = document.getElementById('timeAnalysisChart');
        if (!canvas) return;

        try {
            const data = await this.fetchChartData('timeAnalysis');
            const config = {
                type: 'radar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Esta Semana',
                        data: data.thisWeek,
                        borderColor: this.colorPalette.primary,
                        backgroundColor: this.colorPalette.primaryAlpha,
                        borderWidth: 2,
                        pointBackgroundColor: this.colorPalette.primary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    }, {
                        label: 'Semana Anterior',
                        data: data.lastWeek,
                        borderColor: this.colorPalette.secondary,
                        backgroundColor: this.colorPalette.secondaryAlpha,
                        borderWidth: 2,
                        pointBackgroundColor: this.colorPalette.secondary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    ...this.defaultOptions,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 20,
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Análisis Temporal de Actividad',
                            font: { size: 16, weight: 'bold' }
                        }
                    }
                }
            };

            const chart = new Chart(canvas.getContext('2d'), config);
            this.chartInstances.set('timeAnalysis', chart);
            
        } catch (error) {
            console.error('Error initializing time analysis chart:', error);
        }
    }
    async fetchChartData(chartType) {
        try {
            const response = await fetch(`/api/admin/charts/${chartType}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error fetching ${chartType} data:`, error);
            return this.getMockData(chartType);
        }
    }
    async updateChart(chartType) {
        const chart = this.chartInstances.get(chartType);
        if (!chart) return;

        try {
            const newData = await this.fetchChartData(chartType);
            if (chartType === 'timeAnalysis') {
                chart.data.datasets[0].data = newData.thisWeek;
                chart.data.datasets[1].data = newData.lastWeek;
            } else {
                chart.data.labels = newData.labels;
                chart.data.datasets[0].data = newData.values;
            }
            chart.update('active');
            
        } catch (error) {
            console.error(`Error updating ${chartType} chart:`, error);
        }
    }
    async updateAllCharts() {
        const updatePromises = Array.from(this.chartInstances.keys()).map(chartType => 
            this.updateChart(chartType)
        );
        
        try {
            await Promise.all(updatePromises);
            console.log('📊 All charts updated successfully');
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }
    resizeCharts() {
        this.chartInstances.forEach(chart => {
            chart.resize();
        });
    }
    destroyCharts() {
        this.chartInstances.forEach(chart => {
            chart.destroy();
        });
        this.chartInstances.clear();
        this.initialized = false;
    }
    getDefaultChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#2563eb',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        };
    }

    getColorPalette() {
        return {
            primary: '#2563eb',
            primaryAlpha: 'rgba(37, 99, 235, 0.1)',
            secondary: '#8b5cf6',
            secondaryAlpha: 'rgba(139, 92, 246, 0.1)',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#06b6d4',
            gradient: [
                '#2563eb',
                '#8b5cf6',
                '#10b981',
                '#f59e0b',
                '#ef4444',
                '#06b6d4'
            ],
            borders: [
                '#1d4ed8',
                '#7c3aed',
                '#059669',
                '#d97706',
                '#dc2626',
                '#0891b2'
            ],
            pie: [
                '#2563eb',
                '#8b5cf6',
                '#10b981',
                '#f59e0b',
                '#ef4444',
                '#06b6d4',
                '#84cc16',
                '#f97316'
            ]
        };
    }

    getMockData(chartType) {
        const mockData = {
            attendance: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                values: [95, 87, 92, 88, 90, 85, 78]
            },
            productivity: {
                labels: ['Desarrollo', 'Marketing', 'Ventas', 'RRHH', 'Soporte'],
                values: [92, 88, 85, 90, 87]
            },
            departments: {
                labels: ['Desarrollo', 'Marketing', 'Ventas', 'RRHH', 'Soporte', 'Finanzas'],
                values: [25, 15, 20, 12, 18, 10]
            },
            timeAnalysis: {
                labels: ['Mañana', 'Mediodía', 'Tarde', 'Noche'],
                thisWeek: [85, 92, 78, 65],
                lastWeek: [80, 88, 82, 70]
            }
        };

        return mockData[chartType] || {};
    }e
    exportChart(chartType, format = 'png') {
        const chart = this.chartInstances.get(chartType);
        if (!chart) return;

        const canvas = chart.canvas;
        const url = canvas.toDataURL(`image/${format}`);
        
        const link = document.createElement('a');
        link.download = `${chartType}-chart.${format}`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    getChartStats(chartType) {
        const chart = this.chartInstances.get(chartType);
        if (!chart) return null;

        const data = chart.data.datasets[0].data;
        const sum = data.reduce((a, b) => a + b, 0);
        const avg = sum / data.length;
        const max = Math.max(...data);
        const min = Math.min(...data);

        return {
            total: sum,
            average: Math.round(avg * 100) / 100,
            maximum: max,
            minimum: min,
            dataPoints: data.length
        };
    }
}
window.addEventListener('resize', () => {
    if (window.chartsManager) {
        window.chartsManager.resizeCharts();
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartsManagerModule;
} else {
    window.ChartsManagerModule = ChartsManagerModule;
}