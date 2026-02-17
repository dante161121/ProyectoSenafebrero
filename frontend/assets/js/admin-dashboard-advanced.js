/**
 * ADVANCED ADMIN DASHBOARD
 * IN OUT MANAGER - Advanced Administrative Dashboard Controller
 * Version: 2.0.0
 * Author: IN OUT MANAGER Team
 */

// Importar PathManager
import PathManager from './path-manager.js';

// Dashboard Main Controller
class AdvancedDashboardController {
    constructor() {
        console.log('🚀 Advanced Dashboard: Inicializando controlador...');
        
        // Verificar autenticación antes de inicializar
        this.verifyAuthentication();
        
        this.initializeComponents();
        this.setupEventListeners();
        this.loadInitialData();
        this.startRealTimeUpdates();
        
        console.log('✅ Advanced Dashboard: Controlador inicializado correctamente');
    }

    // Verificar autenticación del usuario
    verifyAuthentication() {
        console.log('🔐 Advanced Dashboard: Verificando autenticación...');
        
        const userData = SessionManager.getUserData();
        if (!userData || userData.tipo !== 'administrador') {
            console.warn('⚠️ Advanced Dashboard: Usuario no autenticado o sin permisos');
            PathManager.navigateToLogin('Acceso denegado. Debe ser administrador.');
            return;
        }
        
        console.log('✅ Advanced Dashboard: Usuario autenticado:', userData.nombre);
    }

    // Initialize all dashboard components
    initializeComponents() {
        this.chartsManager = new ChartsManager();
        this.realTimeManager = new RealTimeManager();
        this.employeeManager = new EmployeeManager();
        this.reportsManager = new ReportsManager();
        this.auditManager = new AuditManager();
        this.backupManager = new BackupManager();
        this.notificationSystem = new NotificationSystem();
        
        console.log('📊 Advanced Dashboard Initialized');
    }

    // Setup event listeners
    setupEventListeners() {
        // Quick actions in header
        document.getElementById('quick-backup')?.addEventListener('click', () => {
            this.backupManager.performQuickBackup();
        });

        document.getElementById('quick-reports')?.addEventListener('click', () => {
            this.reportsManager.openReportsModal();
        });

        document.getElementById('quick-settings')?.addEventListener('click', () => {
            this.openSettingsModal();
        });

        document.getElementById('quick-notifications')?.addEventListener('click', () => {
            this.notificationSystem.showNotificationCenter();
        });

        // Panel controls
        document.querySelectorAll('.panel-control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handlePanelControl(e.target);
            });
        });

        // Refresh controls
        document.querySelectorAll('[data-action="refresh"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = btn.closest('.dashboard-panel');
                this.refreshPanel(panel);
            });
        });
    }

    // Load initial dashboard data
    async loadInitialData() {
        try {
            this.showLoadingState();
            
            // Load KPIs
            await this.loadKPIs();
            
            // Load employees data
            await this.employeeManager.loadEmployees();
            
            // Initialize charts
            await this.chartsManager.initializeCharts();
            
            // Load reports
            await this.reportsManager.loadRecentReports();
            
            // Load audit logs
            await this.auditManager.loadAuditLogs();
            
            this.hideLoadingState();
            this.notificationSystem.showToast('Dashboard cargado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.notificationSystem.showToast('Error al cargar el dashboard', 'error');
        }
    }

    // Load KPIs data
    async loadKPIs() {
        try {
            const response = await fetch('/api/admin/kpis');
            const kpis = await response.json();
            
            this.updateKPI('employees', kpis.totalEmployees, kpis.employeesTrend);
            this.updateKPI('attendance', kpis.attendanceRate, kpis.attendanceTrend);
            this.updateKPI('productivity', kpis.productivityScore, kpis.productivityTrend);
            this.updateKPI('alerts', kpis.activeAlerts, kpis.alertsTrend);
            
        } catch (error) {
            console.error('Error loading KPIs:', error);
        }
    }

    // Update KPI display
    updateKPI(type, value, trend) {
        const card = document.querySelector(`[data-kpi="${type}"]`);
        if (!card) return;

        const valueElement = card.querySelector('.kpi-value');
        const trendElement = card.querySelector('.kpi-trend');

        if (valueElement) {
            this.animateNumber(valueElement, value);
        }

        if (trendElement && trend) {
            trendElement.innerHTML = `
                <i class="fas fa-${trend.direction === 'up' ? 'arrow-up' : trend.direction === 'down' ? 'arrow-down' : 'minus'}"></i>
                ${trend.percentage}% ${trend.period}
            `;
            trendElement.className = `kpi-trend ${trend.direction === 'up' ? 'positive' : trend.direction === 'down' ? 'negative' : 'neutral'}`;
        }
    }

    // Animate number changes
    animateNumber(element, targetValue) {
        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutQuart);
            
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Start real-time updates
    startRealTimeUpdates() {
        // Update KPIs every 30 seconds
        setInterval(() => {
            this.loadKPIs();
        }, 30000);

        // Update real-time panel every 5 seconds
        setInterval(() => {
            this.realTimeManager.updateRealTimeData();
        }, 5000);

        // Update employee status every 15 seconds
        setInterval(() => {
            this.employeeManager.updateEmployeeStatuses();
        }, 15000);
    }

    // Handle panel controls
    handlePanelControl(button) {
        const action = button.dataset.action;
        const panel = button.closest('.dashboard-panel');
        
        switch (action) {
            case 'refresh':
                this.refreshPanel(panel);
                break;
            case 'fullscreen':
                this.toggleFullscreen(panel);
                break;
            case 'export':
                this.exportPanel(panel);
                break;
            case 'settings':
                this.showPanelSettings(panel);
                break;
        }
    }

    // Refresh panel data
    async refreshPanel(panel) {
        const panelType = panel.classList[1]; // Get second class which should be panel type
        
        panel.classList.add('loading');
        
        try {
            switch (panelType) {
                case 'realtime-panel':
                    await this.realTimeManager.refresh();
                    break;
                case 'employees-panel':
                    await this.employeeManager.refresh();
                    break;
                case 'analytics-panel':
                    await this.chartsManager.refresh();
                    break;
                case 'reports-panel':
                    await this.reportsManager.refresh();
                    break;
                case 'audit-panel':
                    await this.auditManager.refresh();
                    break;
            }
            this.notificationSystem.showToast('Panel actualizado', 'success');
        } catch (error) {
            console.error('Error refreshing panel:', error);
            this.notificationSystem.showToast('Error al actualizar panel', 'error');
        } finally {
            panel.classList.remove('loading');
        }
    }

    // Toggle fullscreen for panel
    toggleFullscreen(panel) {
        panel.classList.toggle('fullscreen');
        
        if (panel.classList.contains('fullscreen')) {
            // Add fullscreen styles
            panel.style.position = 'fixed';
            panel.style.top = '0';
            panel.style.left = '0';
            panel.style.width = '100vw';
            panel.style.height = '100vh';
            panel.style.zIndex = '9999';
            panel.style.margin = '0';
            
            // Add escape key listener
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.toggleFullscreen(panel);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
            
        } else {
            // Remove fullscreen styles
            panel.style.position = '';
            panel.style.top = '';
            panel.style.left = '';
            panel.style.width = '';
            panel.style.height = '';
            panel.style.zIndex = '';
            panel.style.margin = '';
        }
    }

    // Export panel data
    async exportPanel(panel) {
        const panelType = panel.classList[1];
        
        try {
            const response = await fetch(`/api/admin/export/${panelType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${panelType}-export-${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.notificationSystem.showToast('Datos exportados exitosamente', 'success');
            }
        } catch (error) {
            console.error('Error exporting panel:', error);
            this.notificationSystem.showToast('Error al exportar datos', 'error');
        }
    }

    // Show/hide loading state
    showLoadingState() {
        document.querySelector('main').classList.add('loading');
    }

    hideLoadingState() {
        document.querySelector('main').classList.remove('loading');
    }

    // Open settings modal
    openSettingsModal() {
        const modal = document.getElementById('settingsModal') || this.createSettingsModal();
        modal.classList.add('active');
    }

    // Create settings modal
    createSettingsModal() {
        const modalHTML = `
            <div id="settingsModal" class="modal-overlay">
                <div class="modal" style="width: 600px;">
                    <div class="modal-header">
                        <h3 class="modal-title">Configuración del Dashboard</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="settings-categories">
                            <div class="setting-category">
                                <h4><i class="fas fa-chart-line"></i> Visualización</h4>
                                <div class="setting-item">
                                    <span>Tema oscuro</span>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="darkMode">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="setting-item">
                                    <span>Animaciones</span>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="animations" checked>
                                        <span class="slider"></span>
                                    </label>
                                </div>
                            </div>
                            <div class="setting-category">
                                <h4><i class="fas fa-bell"></i> Notificaciones</h4>
                                <div class="setting-item">
                                    <span>Notificaciones push</span>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="pushNotifications" checked>
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="setting-item">
                                    <span>Sonidos</span>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="sounds">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="panel-control-btn" id="saveSettings">Guardar</button>
                        <button class="panel-control-btn" id="cancelSettings">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('settingsModal');
        
        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.querySelector('#cancelSettings').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.querySelector('#saveSettings').addEventListener('click', () => {
            this.saveSettings();
            modal.classList.remove('active');
        });
        
        return modal;
    }

    // Save settings
    saveSettings() {
        const settings = {
            darkMode: document.getElementById('darkMode').checked,
            animations: document.getElementById('animations').checked,
            pushNotifications: document.getElementById('pushNotifications').checked,
            sounds: document.getElementById('sounds').checked
        };
        
        localStorage.setItem('dashboardSettings', JSON.stringify(settings));
        this.applySettings(settings);
        this.notificationSystem.showToast('Configuración guardada', 'success');
    }

    // Apply settings
    applySettings(settings) {
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        if (!settings.animations) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }
    }

    // Load saved settings
    loadSettings() {
        const savedSettings = localStorage.getItem('dashboardSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.applySettings(settings);
        }
    }
}

// Charts Manager
class ChartsManager {
    constructor() {
        this.charts = {};
        this.chartConfigs = {
            attendance: {
                type: 'line',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Asistencia por Día'
                        }
                    }
                }
            },
            productivity: {
                type: 'bar',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Productividad por Departamento'
                        }
                    }
                }
            }
        };
    }

    async initializeCharts() {
        try {
            // Initialize attendance chart
            await this.createChart('attendance');
            
            // Initialize productivity chart
            await this.createChart('productivity');
            
            console.log('📈 Charts initialized successfully');
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    async createChart(type) {
        const canvas = document.getElementById(`${type}Chart`);
        if (!canvas) return;

        const response = await fetch(`/api/admin/charts/${type}`);
        const data = await response.json();

        const ctx = canvas.getContext('2d');
        this.charts[type] = new Chart(ctx, {
            type: this.chartConfigs[type].type,
            data: data,
            options: this.chartConfigs[type].options
        });
    }

    async refresh() {
        for (const [type, chart] of Object.entries(this.charts)) {
            try {
                const response = await fetch(`/api/admin/charts/${type}`);
                const data = await response.json();
                
                chart.data = data;
                chart.update();
            } catch (error) {
                console.error(`Error refreshing ${type} chart:`, error);
            }
        }
    }

    destroy() {
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
    }
}

// Real-Time Manager
class RealTimeManager {
    constructor() {
        this.updateInterval = null;
    }

    async updateRealTimeData() {
        try {
            const response = await fetch('/api/admin/realtime');
            const data = await response.json();
            
            this.updateRealTimeStats(data.stats);
            this.updateActivityFeed(data.feed);
            
        } catch (error) {
            console.error('Error updating real-time data:', error);
        }
    }

    updateRealTimeStats(stats) {
        const elements = {
            present: document.getElementById('presentEmployees'),
            absent: document.getElementById('absentEmployees')
        };

        if (elements.present) elements.present.textContent = stats.present;
        if (elements.absent) elements.absent.textContent = stats.absent;
    }

    updateActivityFeed(feedData) {
        const feedContainer = document.querySelector('.realtime-feed');
        if (!feedContainer) return;

        feedContainer.innerHTML = feedData.map(item => `
            <div class="feed-item">
                <div class="feed-icon ${item.type}">
                    <i class="fas fa-${item.type === 'entry' ? 'sign-in-alt' : 'sign-out-alt'}"></i>
                </div>
                <div class="feed-content">
                    <div class="feed-text">${item.message}</div>
                    <div class="feed-time">${this.formatTime(item.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async refresh() {
        await this.updateRealTimeData();
    }
}

// Employee Manager
class EmployeeManager {
    constructor() {
        this.employees = [];
        this.filteredEmployees = [];
        this.setupFilters();
    }

    setupFilters() {
        const searchInput = document.getElementById('employeeSearch');
        const statusFilter = document.getElementById('statusFilter');
        const departmentFilter = document.getElementById('departmentFilter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (departmentFilter) {
            departmentFilter.addEventListener('change', () => this.applyFilters());
        }
    }

    async loadEmployees() {
        try {
            const response = await fetch('/api/admin/employees');
            this.employees = await response.json();
            this.filteredEmployees = [...this.employees];
            this.renderEmployees();
        } catch (error) {
            console.error('Error loading employees:', error);
        }
    }

    applyFilters() {
        const searchTerm = document.getElementById('employeeSearch')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const departmentFilter = document.getElementById('departmentFilter')?.value || '';

        this.filteredEmployees = this.employees.filter(employee => {
            const matchesSearch = employee.nombre.toLowerCase().includes(searchTerm) ||
                                employee.email.toLowerCase().includes(searchTerm);
            const matchesStatus = !statusFilter || employee.estado === statusFilter;
            const matchesDepartment = !departmentFilter || employee.departamento === departmentFilter;

            return matchesSearch && matchesStatus && matchesDepartment;
        });

        this.renderEmployees();
    }

    renderEmployees() {
        const tbody = document.querySelector('.employees-table tbody');
        if (!tbody) return;

        tbody.innerHTML = this.filteredEmployees.map(employee => `
            <tr>
                <td>
                    <div class="employee-info">
                        <img src="${employee.avatar || '/assets/images/default-avatar.png'}" 
                             alt="${employee.nombre}" class="employee-avatar">
                        <div class="employee-details">
                            <h4>${employee.nombre}</h4>
                            <p>${employee.email}</p>
                        </div>
                    </div>
                </td>
                <td>${employee.departamento}</td>
                <td>${employee.cargo}</td>
                <td>
                    <span class="status-badge ${employee.estado}">${this.getStatusText(employee.estado)}</span>
                </td>
                <td>${this.formatTime(employee.ultimaActividad)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editEmployee('${employee.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteEmployee('${employee.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'Activo',
            'inactive': 'Inactivo',
            'working': 'Trabajando'
        };
        return statusMap[status] || status;
    }

    formatTime(timestamp) {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString('es-ES');
    }

    async updateEmployeeStatuses() {
        try {
            const response = await fetch('/api/admin/employees/status');
            const statusUpdates = await response.json();
            
            statusUpdates.forEach(update => {
                const employee = this.employees.find(emp => emp.id === update.id);
                if (employee) {
                    employee.estado = update.estado;
                    employee.ultimaActividad = update.ultimaActividad;
                }
            });
            
            this.applyFilters(); // Re-render with updated data
        } catch (error) {
            console.error('Error updating employee statuses:', error);
        }
    }

    async refresh() {
        await this.loadEmployees();
    }
}

// Reports Manager
class ReportsManager {
    constructor() {
        this.reports = [];
        this.setupReportFilters();
    }

    setupReportFilters() {
        const applyBtn = document.getElementById('applyFilters');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.generateReport());
        }
    }

    async loadRecentReports() {
        try {
            const response = await fetch('/api/admin/reports/recent');
            this.reports = await response.json();
            this.renderReports();
        } catch (error) {
            console.error('Error loading reports:', error);
        }
    }

    renderReports() {
        const container = document.querySelector('.reports-list');
        if (!container) return;

        container.innerHTML = this.reports.map(report => `
            <div class="report-item">
                <div class="report-info">
                    <h4>${report.nombre}</h4>
                    <p>Generado: ${this.formatDate(report.fechaGeneracion)}</p>
                </div>
                <div class="report-actions">
                    <button class="report-action-btn" onclick="downloadReport('${report.id}')">
                        <i class="fas fa-download"></i> Descargar
                    </button>
                    <button class="report-action-btn" onclick="viewReport('${report.id}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </div>
            </div>
        `).join('');
    }

    async generateReport() {
        const reportType = document.getElementById('reportType')?.value;
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;

        if (!reportType || !startDate || !endDate) {
            window.notificationSystem.showToast('Complete todos los campos', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/admin/reports/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    tipo: reportType,
                    fechaInicio: startDate,
                    fechaFin: endDate
                })
            });

            if (response.ok) {
                const result = await response.json();
                window.notificationSystem.showToast('Reporte generado exitosamente', 'success');
                await this.loadRecentReports();
            }
        } catch (error) {
            console.error('Error generating report:', error);
            window.notificationSystem.showToast('Error al generar reporte', 'error');
        }
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('es-ES');
    }

    async refresh() {
        await this.loadRecentReports();
    }

    openReportsModal() {
        // Implementation for reports modal
        console.log('Opening reports modal...');
    }
}

// Audit Manager
class AuditManager {
    constructor() {
        this.auditLogs = [];
    }

    async loadAuditLogs() {
        try {
            const response = await fetch('/api/admin/audit/logs');
            this.auditLogs = await response.json();
            this.renderAuditTimeline();
        } catch (error) {
            console.error('Error loading audit logs:', error);
        }
    }

    renderAuditTimeline() {
        const timeline = document.querySelector('.audit-timeline');
        if (!timeline) return;

        timeline.innerHTML = this.auditLogs.map(log => `
            <div class="timeline-item">
                <div class="timeline-icon ${log.nivel}">
                    <i class="fas fa-${this.getAuditIcon(log.tipo)}"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-title">${log.titulo}</div>
                    <div class="timeline-description">${log.descripcion}</div>
                    <div class="timeline-time">${this.formatTime(log.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    getAuditIcon(type) {
        const iconMap = {
            'login': 'sign-in-alt',
            'logout': 'sign-out-alt',
            'create': 'plus',
            'update': 'edit',
            'delete': 'trash',
            'export': 'download',
            'backup': 'database'
        };
        return iconMap[type] || 'info-circle';
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleString('es-ES');
    }

    async refresh() {
        await this.loadAuditLogs();
    }
}

// Backup Manager
class BackupManager {
    constructor() {
        this.backupStatus = null;
    }

    async performQuickBackup() {
        try {
            window.notificationSystem.showToast('Iniciando respaldo...', 'info');
            
            const response = await fetch('/api/admin/backup/quick', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                window.notificationSystem.showToast('Respaldo completado exitosamente', 'success');
                this.updateBackupStatus(result);
            }
        } catch (error) {
            console.error('Error performing backup:', error);
            window.notificationSystem.showToast('Error al realizar respaldo', 'error');
        }
    }

    updateBackupStatus(status) {
        const statusElement = document.querySelector('.backup-status');
        if (statusElement) {
            statusElement.textContent = `Último respaldo: ${this.formatTime(status.timestamp)}`;
        }
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleString('es-ES');
    }
}

// Notification System
class NotificationSystem {
    constructor() {
        this.createToastContainer();
    }

    createToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="toast-header">
                <div class="toast-title">${this.getToastTitle(type)}</div>
                <button class="toast-close">&times;</button>
            </div>
            <div class="toast-body">${message}</div>
        `;

        const container = document.querySelector('.toast-container');
        container.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => this.removeToast(toast), duration);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
    }

    getToastTitle(type) {
        const titles = {
            'success': 'Éxito',
            'error': 'Error',
            'warning': 'Advertencia',
            'info': 'Información'
        };
        return titles[type] || 'Notificación';
    }

    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    showNotificationCenter() {
        // Implementation for notification center
        console.log('Opening notification center...');
    }
}

// Global functions for employee actions
window.editEmployee = function(employeeId) {
    console.log('Editing employee:', employeeId);
    // Implementation for edit employee modal
};

window.deleteEmployee = function(employeeId) {
    if (confirm('¿Está seguro de que desea eliminar este empleado?')) {
        console.log('Deleting employee:', employeeId);
        // Implementation for delete employee
    }
};

window.downloadReport = function(reportId) {
    console.log('Downloading report:', reportId);
    // Implementation for download report
};

window.viewReport = function(reportId) {
    console.log('Viewing report:', reportId);
    // Implementation for view report
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    const currentSession = JSON.parse(localStorage.getItem('currentSession') || '{}');
    
    if (!authToken && !currentSession.tipoUsuario) {
        window.location.href = '/frontend/components/auth/login.html';
        return;
    }
    
    // Verify admin role
    if (currentSession.tipoUsuario !== 'administrador') {
        alert('Acceso denegado. Solo administradores pueden acceder a este panel.');
        window.location.href = '/frontend/components/auth/login.html';
        return;
    }

    // Initialize advanced dashboard
    window.dashboardController = new AdvancedDashboardController();
    window.notificationSystem = window.dashboardController.notificationSystem;
    
    console.log('🚀 Advanced Admin Dashboard Loaded Successfully');
});

// Export for module use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AdvancedDashboardController,
        ChartsManager,
        RealTimeManager,
        EmployeeManager,
        ReportsManager,
        AuditManager,
        BackupManager,
        NotificationSystem
    };
}