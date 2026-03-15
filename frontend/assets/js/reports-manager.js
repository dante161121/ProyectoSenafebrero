
class ReportsManagerModule {
    constructor() {
        this.reports = [];
        this.reportTypes = this.getReportTypes();
        this.filters = {};
        this.generatingReports = new Set();
        this.templates = new Map();
        this.scheduledReports = [];
    }

    initialize() {
        this.setupEventListeners();
        this.loadRecentReports();
        this.loadReportTemplates();
        this.loadScheduledReports();
        
        console.log(' Reports Manager initialized successfully');
    }

    setupEventListeners() {

        const generateBtn = document.getElementById('generateReport');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateReport());
        }


        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        const reportTypeSelect = document.getElementById('reportType');
        if (reportTypeSelect) {
            reportTypeSelect.addEventListener('change', (e) => {
                this.onReportTypeChange(e.target.value);
            });
        }

        const exportFormatSelect = document.getElementById('exportFormat');
        if (exportFormatSelect) {
            exportFormatSelect.addEventListener('change', (e) => {
                this.onExportFormatChange(e.target.value);
            });
        }

        const scheduleBtn = document.getElementById('scheduleReport');
        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', () => this.showScheduleModal());
        }

        document.querySelectorAll('.quick-report-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reportType = btn.dataset.reportType;
                this.generateQuickReport(reportType);
            });
        });
    }

    async loadRecentReports() {
        try {
            const response = await fetch('/api/admin/reports/recent', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                this.reports = await response.json();
                this.renderReportsList();
            }
        } catch (error) {
            console.error('Error loading recent reports:', error);
        }
    }

    async loadReportTemplates() {
        try {
            const response = await fetch('/api/admin/reports/templates', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const templates = await response.json();
                templates.forEach(template => {
                    this.templates.set(template.id, template);
                });
                this.renderTemplateSelector();
            }
        } catch (error) {
            console.error('Error loading report templates:', error);
        }
    }

    async loadScheduledReports() {
        try {
            const response = await fetch('/api/admin/reports/scheduled', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                this.scheduledReports = await response.json();
                this.renderScheduledReports();
            }
        } catch (error) {
            console.error('Error loading scheduled reports:', error);
        }
    }

    async generateReport() {
        const formData = this.getReportFormData();
        
        if (!this.validateReportForm(formData)) {
            return;
        }

        const reportId = Date.now().toString();
        this.generatingReports.add(reportId);
        
        try {
            this.showGeneratingStatus(true);
            
            const response = await fetch('/api/admin/reports/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    ...formData,
                    reportId: reportId
                })
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.downloadUrl) {
                    this.downloadReport(result.downloadUrl, formData.fileName);
                }
                
                await this.loadRecentReports();
                this.showNotification('Reporte generado exitosamente', 'success');
                
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error generating report');
            }
            
        } catch (error) {
            console.error('Error generating report:', error);
            this.showNotification('Error al generar el reporte: ' + error.message, 'error');
        } finally {
            this.generatingReports.delete(reportId);
            this.showGeneratingStatus(false);
        }
    }

    async generateQuickReport(reportType) {
        const config = this.getQuickReportConfig(reportType);
        
        try {
            this.showNotification('Generando reporte rápido...', 'info');
            
            const response = await fetch('/api/admin/reports/quick', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                const blob = await response.blob();
                this.downloadBlob(blob, `${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`);
                this.showNotification('Reporte rápido generado', 'success');
            }
        } catch (error) {
            console.error('Error generating quick report:', error);
            this.showNotification('Error al generar reporte rápido', 'error');
        }
    }

    getReportFormData() {
        return {
            type: document.getElementById('reportType')?.value || '',
            startDate: document.getElementById('startDate')?.value || '',
            endDate: document.getElementById('endDate')?.value || '',
            departments: this.getSelectedDepartments(),
            employees: this.getSelectedEmployees(),
            format: document.getElementById('exportFormat')?.value || 'xlsx',
            includeCharts: document.getElementById('includeCharts')?.checked || false,
            includeSummary: document.getElementById('includeSummary')?.checked || true,
            groupBy: document.getElementById('groupBy')?.value || 'day',
            fileName: this.generateFileName()
        };
    }

    validateReportForm(formData) {
        const errors = [];

        if (!formData.type) {
            errors.push('Seleccione un tipo de reporte');
        }

        if (!formData.startDate) {
            errors.push('Seleccione una fecha de inicio');
        }

        if (!formData.endDate) {
            errors.push('Seleccione una fecha de fin');
        }

        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            
            if (start > end) {
                errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
            }

            const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
            if (daysDiff > 365) {
                errors.push('El período no puede ser mayor a 365 días');
            }
        }

        if (errors.length > 0) {
            this.showNotification('Errores en el formulario:\n' + errors.join('\n'), 'error');
            return false;
        }

        return true;
    }

    getSelectedDepartments() {
        const checkboxes = document.querySelectorAll('.department-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }
    getSelectedEmployees() {
        const checkboxes = document.querySelectorAll('.employee-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }
    generateFileName() {
        const reportType = document.getElementById('reportType')?.value || 'reporte';
        const startDate = document.getElementById('startDate')?.value || '';
        const endDate = document.getElementById('endDate')?.value || '';
        const format = document.getElementById('exportFormat')?.value || 'xlsx';
        
        let fileName = `${reportType}`;
        if (startDate && endDate) {
            fileName += `_${startDate}_${endDate}`;
        }
        fileName += `_${new Date().toISOString().split('T')[0]}.${format}`;
        
        return fileName;
    }
    downloadReport(url, fileName) {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        this.downloadReport(url, fileName);
        URL.revokeObjectURL(url);
    }
    renderReportsList() {
        const container = document.querySelector('.reports-list');
        if (!container) return;

        container.innerHTML = this.reports.map(report => `
            <div class="report-item" data-report-id="${report.id}">
                <div class="report-info">
                    <h4>${report.name}</h4>
                    <div class="report-meta">
                        <span class="report-type">${this.getReportTypeName(report.type)}</span>
                        <span class="report-date">Generado: ${this.formatDate(report.createdAt)}</span>
                    </div>
                    <div class="report-stats">
                        <span class="report-size">${this.formatFileSize(report.size)}</span>
                        <span class="report-format">${report.format.toUpperCase()}</span>
                    </div>
                </div>
                <div class="report-actions">
                    <button class="report-action-btn download" onclick="reportsManager.downloadReportById('${report.id}')">
                        <i class="fas fa-download"></i> Descargar
                    </button>
                    <button class="report-action-btn view" onclick="reportsManager.viewReport('${report.id}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="report-action-btn share" onclick="reportsManager.shareReport('${report.id}')">
                        <i class="fas fa-share"></i> Compartir
                    </button>
                    <button class="report-action-btn delete" onclick="reportsManager.deleteReport('${report.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderTemplateSelector() {
        const selector = document.getElementById('reportTemplate');
        if (!selector) return;

        selector.innerHTML = '<option value="">Seleccionar plantilla...</option>' +
            Array.from(this.templates.values()).map(template => `
                <option value="${template.id}">${template.name}</option>
            `).join('');
    }

    renderScheduledReports() {
        const container = document.querySelector('.scheduled-reports-list');
        if (!container) return;

        container.innerHTML = this.scheduledReports.map(report => `
            <div class="scheduled-report-item">
                <div class="scheduled-report-info">
                    <h5>${report.name}</h5>
                    <p>Frecuencia: ${this.getFrequencyText(report.frequency)}</p>
                    <p>Próxima ejecución: ${this.formatDateTime(report.nextRun)}</p>
                </div>
                <div class="scheduled-report-actions">
                    <button class="btn-sm edit" onclick="reportsManager.editScheduledReport('${report.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm delete" onclick="reportsManager.deleteScheduledReport('${report.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    onReportTypeChange(reportType) {
        this.updateAvailableFilters(reportType);
        this.updateFieldRequirements(reportType);
    }
    onExportFormatChange(format) {
        this.updateFormatOptions(format);
    }
    updateAvailableFilters(reportType) {
        const filtersContainer = document.querySelector('.advanced-filters');
        if (!filtersContainer) return;

        const reportConfig = this.reportTypes[reportType];
        if (!reportConfig) return;
        filtersContainer.querySelectorAll('.filter-section').forEach(section => {
            const sectionType = section.dataset.filterType;
            section.style.display = reportConfig.filters.includes(sectionType) ? 'block' : 'none';
        });
    }

    updateFieldRequirements(reportType) {
        const reportConfig = this.reportTypes[reportType];
        if (!reportConfig) return;

        document.querySelectorAll('.form-field').forEach(field => {
            const fieldName = field.dataset.field;
            const isRequired = reportConfig.requiredFields.includes(fieldName);
            
            field.classList.toggle('required', isRequired);
            const input = field.querySelector('input, select');
            if (input) {
                input.required = isRequired;
            }
        });
    }

    updateFormatOptions(format) {
        const optionsContainer = document.querySelector('.format-options');
        if (!optionsContainer) return;

        optionsContainer.querySelectorAll('.format-option').forEach(option => {
            const optionFormat = option.dataset.format;
            option.style.display = optionFormat === format ? 'block' : 'none';
        });
    }

    applyFilters() {
        this.filters = this.getReportFormData();
        this.updatePreview();
    }

    async updatePreview() {
        const previewContainer = document.querySelector('.report-preview');
        if (!previewContainer) return;

        try {
            const response = await fetch('/api/admin/reports/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(this.filters)
            });

            if (response.ok) {
                const preview = await response.json();
                this.renderPreview(preview);
            }
        } catch (error) {
            console.error('Error updating preview:', error);
        }
    }

    renderPreview(preview) {
        const container = document.querySelector('.report-preview');
        if (!container) return;

        container.innerHTML = `
            <div class="preview-summary">
                <h4>Vista previa del reporte</h4>
                <div class="preview-stats">
                    <div class="preview-stat">
                        <span class="stat-label">Registros:</span>
                        <span class="stat-value">${preview.recordCount}</span>
                    </div>
                    <div class="preview-stat">
                        <span class="stat-label">Período:</span>
                        <span class="stat-value">${preview.period}</span>
                    </div>
                    <div class="preview-stat">
                        <span class="stat-label">Tamaño estimado:</span>
                        <span class="stat-value">${preview.estimatedSize}</span>
                    </div>
                </div>
            </div>
            <div class="preview-data">
                ${preview.sampleData ? this.renderSampleData(preview.sampleData) : ''}
            </div>
        `;
    }

    renderSampleData(sampleData) {
        if (!sampleData || sampleData.length === 0) return '';

        const headers = Object.keys(sampleData[0]);
        
        return `
            <table class="preview-table">
                <thead>
                    <tr>
                        ${headers.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${sampleData.slice(0, 5).map(row => `
                        <tr>
                            ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${sampleData.length > 5 ? `<p class="preview-note">Mostrando 5 de ${sampleData.length} registros</p>` : ''}
        `;
    }

    showGeneratingStatus(generating) {
        const button = document.getElementById('generateReport');
        if (!button) return;

        if (generating) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
        } else {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-file-arrow-down"></i> Generar Reporte';
        }
    }


    showScheduleModal() {
        const modal = document.getElementById('scheduleReportModal') || this.createScheduleModal();
        modal.classList.add('active');
    }

    createScheduleModal() {
        const modalHTML = `
            <div id="scheduleReportModal" class="modal-overlay">
                <div class="modal" style="width: 600px;">
                    <div class="modal-header">
                        <h3 class="modal-title">Programar Reporte</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="scheduleReportForm">
                            <div class="form-group">
                                <label>Nombre del reporte programado:</label>
                                <input type="text" id="scheduleName" required>
                            </div>
                            <div class="form-group">
                                <label>Frecuencia:</label>
                                <select id="scheduleFrequency" required>
                                    <option value="daily">Diario</option>
                                    <option value="weekly">Semanal</option>
                                    <option value="monthly">Mensual</option>
                                    <option value="quarterly">Trimestral</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Día de ejecución:</label>
                                <select id="scheduleDay">
                                    <option value="1">Lunes</option>
                                    <option value="2">Martes</option>
                                    <option value="3">Miércoles</option>
                                    <option value="4">Jueves</option>
                                    <option value="5">Viernes</option>
                                    <option value="6">Sábado</option>
                                    <option value="0">Domingo</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Hora de ejecución:</label>
                                <input type="time" id="scheduleTime" value="09:00" required>
                            </div>
                            <div class="form-group">
                                <label>Destinatarios (emails separados por coma):</label>
                                <textarea id="scheduleRecipients" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="panel-control-btn" id="saveSchedule">Programar</button>
                        <button class="panel-control-btn" id="cancelSchedule">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('scheduleReportModal');

        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.querySelector('#cancelSchedule').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.querySelector('#saveSchedule').addEventListener('click', () => {
            this.saveScheduledReport();
        });
        
        return modal;
    }

    async saveScheduledReport() {
        const formData = {
            name: document.getElementById('scheduleName').value,
            frequency: document.getElementById('scheduleFrequency').value,
            day: document.getElementById('scheduleDay').value,
            time: document.getElementById('scheduleTime').value,
            recipients: document.getElementById('scheduleRecipients').value.split(',').map(email => email.trim()),
            reportConfig: this.getReportFormData()
        };

        try {
            const response = await fetch('/api/admin/reports/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showNotification('Reporte programado exitosamente', 'success');
                document.getElementById('scheduleReportModal').classList.remove('active');
                await this.loadScheduledReports();
            }
        } catch (error) {
            console.error('Error scheduling report:', error);
            this.showNotification('Error al programar el reporte', 'error');
        }
    }

    async downloadReportById(reportId) {
        try {
            const response = await fetch(`/api/admin/reports/${reportId}/download`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const report = this.reports.find(r => r.id === reportId);
                this.downloadBlob(blob, report.fileName);
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            this.showNotification('Error al descargar el reporte', 'error');
        }
    }

    viewReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (report && report.viewUrl) {
            window.open(report.viewUrl, '_blank');
        }
    }

    async shareReport(reportId) {
        try {
            const response = await fetch(`/api/admin/reports/${reportId}/share`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.showShareModal(result.shareUrl);
            }
        } catch (error) {
            console.error('Error sharing report:', error);
            this.showNotification('Error al compartir el reporte', 'error');
        }
    }

    async deleteReport(reportId) {
        if (!confirm('¿Está seguro de que desea eliminar este reporte?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/reports/${reportId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                this.showNotification('Reporte eliminado exitosamente', 'success');
                await this.loadRecentReports();
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            this.showNotification('Error al eliminar el reporte', 'error');
        }
    }

    getReportTypes() {
        return {
            attendance: {
                name: 'Reporte de Asistencia',
                filters: ['dateRange', 'departments', 'employees'],
                requiredFields: ['startDate', 'endDate']
            },
            productivity: {
                name: 'Reporte de Productividad',
                filters: ['dateRange', 'departments'],
                requiredFields: ['startDate', 'endDate']
            },
            timeTracking: {
                name: 'Seguimiento de Tiempo',
                filters: ['dateRange', 'employees', 'projects'],
                requiredFields: ['startDate', 'endDate']
            },
            summary: {
                name: 'Resumen Ejecutivo',
                filters: ['dateRange'],
                requiredFields: ['startDate', 'endDate']
            }
        };
    }

    getQuickReportConfig(reportType) {
        const configs = {
            daily: {
                type: 'attendance',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                format: 'xlsx'
            },
            weekly: {
                type: 'attendance',
                startDate: this.getWeekStart().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                format: 'xlsx'
            },
            monthly: {
                type: 'summary',
                startDate: this.getMonthStart().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                format: 'pdf'
            }
        };

        return configs[reportType] || configs.daily;
    }

    getWeekStart() {
        const date = new Date();
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    }

    getMonthStart() {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    getReportTypeName(type) {
        return this.reportTypes[type]?.name || type;
    }

    getFrequencyText(frequency) {
        const frequencies = {
            daily: 'Diario',
            weekly: 'Semanal',
            monthly: 'Mensual',
            quarterly: 'Trimestral'
        };
        return frequencies[frequency] || frequency;
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('es-ES');
    }

    formatDateTime(timestamp) {
        return new Date(timestamp).toLocaleString('es-ES');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type) {
        if (window.notificationSystem) {
            window.notificationSystem.showToast(message, type);
        }
    }

    async refresh() {
        await this.loadRecentReports();
        await this.loadScheduledReports();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportsManagerModule;
} else {
    window.ReportsManagerModule = ReportsManagerModule;
    window.reportsManager = new ReportsManagerModule();
}