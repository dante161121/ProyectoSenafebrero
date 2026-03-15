
class AuditManagerModule {
    constructor() {
        this.auditLogs = [];
        this.filteredLogs = [];
        this.filters = {
            level: 'all',
            type: 'all',
            user: 'all',
            dateRange: 'all'
        };
        this.logLevels = this.getLogLevels();
        this.logTypes = this.getLogTypes();
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.totalPages = 1;
    }
    initialize() {
        this.setupEventListeners();
        this.loadAuditLogs();
        this.setupRealTimeUpdates();
        
        console.log('🔍 Audit Manager initialized successfully');
    }

    setupEventListeners() {
        // Filter controls
        const levelFilter = document.getElementById('auditLevelFilter');
        if (levelFilter) {
            levelFilter.addEventListener('change', (e) => {
                this.filters.level = e.target.value;
                this.applyFilters();
            });
        }

        const typeFilter = document.getElementById('auditTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.applyFilters();
            });
        }
        const userFilter = document.getElementById('auditUserFilter');
        if (userFilter) {
            userFilter.addEventListener('change', (e) => {
                this.filters.user = e.target.value;
                this.applyFilters();
            });
        }
        const dateRangeFilter = document.getElementById('auditDateRange');
        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', (e) => {
                this.filters.dateRange = e.target.value;
                this.applyFilters();
            });
        }
        const searchInput = document.getElementById('auditSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchLogs(e.target.value);
            });
        }
        const exportBtn = document.getElementById('exportAuditLogs');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAuditLogs());
        }
        const clearBtn = document.getElementById('clearAuditLogs');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.showClearLogsModal());
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('audit-page-btn')) {
                const page = parseInt(e.target.dataset.page);
                this.goToPage(page);
            }
        });
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-log-detail')) {
                const logId = e.target.dataset.logId;
                this.showLogDetail(logId);
            }
        });
        const autoRefreshToggle = document.getElementById('autoRefreshAudit');
        if (autoRefreshToggle) {
            autoRefreshToggle.addEventListener('change', (e) => {
                this.toggleAutoRefresh(e.target.checked);
            });
        }
    }
    async loadAuditLogs(page = 1) {
        try {
            const params = new URLSearchParams({
                page: page,
                limit: this.itemsPerPage,
                level: this.filters.level !== 'all' ? this.filters.level : '',
                type: this.filters.type !== 'all' ? this.filters.type : '',
                user: this.filters.user !== 'all' ? this.filters.user : '',
                dateRange: this.filters.dateRange !== 'all' ? this.filters.dateRange : ''
            });

            const response = await fetch(`/api/admin/audit/logs?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.auditLogs = data.logs;
                this.filteredLogs = [...this.auditLogs];
                this.currentPage = data.page;
                this.totalPages = data.totalPages;
                
                this.renderAuditLogs();
                this.renderPagination();
                this.updateAuditStats(data.stats);
            }
        } catch (error) {
            console.error('Error loading audit logs:', error);
            this.showNotification('Error al cargar los logs de auditoría', 'error');
        }
    }

    applyFilters() {
        this.filteredLogs = this.auditLogs.filter(log => {
            let matchesFilters = true;

            if (this.filters.level !== 'all' && log.level !== this.filters.level) {
                matchesFilters = false;
            }

            if (this.filters.type !== 'all' && log.type !== this.filters.type) {
                matchesFilters = false;
            }

            if (this.filters.user !== 'all' && log.userId !== this.filters.user) {
                matchesFilters = false;
            }

            if (this.filters.dateRange !== 'all') {
                const logDate = new Date(log.timestamp);
                const now = new Date();
                let cutoffDate;

                switch (this.filters.dateRange) {
                    case 'today':
                        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        break;
                    case 'week':
                        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'month':
                        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        cutoffDate = new Date(0);
                }

                if (logDate < cutoffDate) {
                    matchesFilters = false;
                }
            }

            return matchesFilters;
        });

        this.renderAuditLogs();
    }

    searchLogs(searchTerm) {
        if (!searchTerm.trim()) {
            this.applyFilters();
            return;
        }

        const term = searchTerm.toLowerCase();
        this.filteredLogs = this.auditLogs.filter(log => 
            log.action.toLowerCase().includes(term) ||
            log.description.toLowerCase().includes(term) ||
            log.userEmail?.toLowerCase().includes(term) ||
            log.ipAddress?.includes(term) ||
            log.resource?.toLowerCase().includes(term)
        );

        this.renderAuditLogs();
    }

    renderAuditLogs() {
        const timeline = document.querySelector('.audit-timeline');
        if (!timeline) return;

        if (this.filteredLogs.length === 0) {
            timeline.innerHTML = `
                <div class="no-logs-message">
                    <i class="fas fa-search"></i>
                    <p>No se encontraron logs de auditoría con los filtros aplicados</p>
                </div>
            `;
            return;
        }

        timeline.innerHTML = this.filteredLogs.map(log => `
            <div class="timeline-item" data-log-id="${log.id}">
                <div class="timeline-icon ${log.level}">
                    ${this.getLogIcon(log.type)}
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <div class="timeline-title">${log.action}</div>
                        <div class="timeline-meta">
                            <span class="log-level ${log.level}">${this.getLogLevelText(log.level)}</span>
                            <span class="log-time">${this.formatDateTime(log.timestamp)}</span>
                        </div>
                    </div>
                    <div class="timeline-description">${log.description}</div>
                    <div class="timeline-details">
                        <div class="log-detail-item">
                            <i class="fas fa-user"></i>
                            <span>${log.userEmail || 'Sistema'}</span>
                        </div>
                        ${log.ipAddress ? `
                            <div class="log-detail-item">
                                <i class="fas fa-globe"></i>
                                <span>${log.ipAddress}</span>
                            </div>
                        ` : ''}
                        ${log.userAgent ? `
                            <div class="log-detail-item">
                                <i class="fas fa-desktop"></i>
                                <span>${this.parseUserAgent(log.userAgent)}</span>
                            </div>
                        ` : ''}
                        ${log.resource ? `
                            <div class="log-detail-item">
                                <i class="fas fa-file"></i>
                                <span>${log.resource}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="timeline-actions">
                        <button class="view-log-detail" data-log-id="${log.id}">
                            <i class="fas fa-eye"></i> Ver detalles
                        </button>
                        ${log.relatedLogs ? `
                            <button class="view-related-logs" data-log-id="${log.id}">
                                <i class="fas fa-link"></i> Ver relacionados (${log.relatedLogs})
                            </button>
                        ` : ''}
                    </div>
                </div>
                ${this.shouldHighlightLog(log) ? '<div class="log-highlight"></div>' : ''}
            </div>
        `).join('');
    }

    renderPagination() {
        const paginationContainer = document.querySelector('.audit-pagination');
        if (!paginationContainer || this.totalPages <= 1) return;

        let paginationHTML = '';
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="audit-page-btn" data-page="${this.currentPage - 1}">
                    <i class="fas fa-chevron-left"></i> Anterior
                </button>
            `;
        }

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="audit-page-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="audit-page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="audit-page-btn" data-page="${this.totalPages}">${this.totalPages}</button>`;
        }

        if (this.currentPage < this.totalPages) {
            paginationHTML += `
                <button class="audit-page-btn" data-page="${this.currentPage + 1}">
                    Siguiente <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }

        paginationContainer.innerHTML = paginationHTML;
    }

    updateAuditStats(stats) {
        const statsContainer = document.querySelector('.audit-stats');
        if (!statsContainer || !stats) return;

        statsContainer.innerHTML = `
            <div class="audit-stat">
                <div class="stat-icon success">
                    <i class="fas fa-circle-check"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.success || 0}</div>
                    <div class="stat-label">Exitosos</div>
                </div>
            </div>
            <div class="audit-stat">
                <div class="stat-icon warning">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.warning || 0}</div>
                    <div class="stat-label">Advertencias</div>
                </div>
            </div>
            <div class="audit-stat">
                <div class="stat-icon danger">
                    <i class="fas fa-circle-xmark"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.error || 0}</div>
                    <div class="stat-label">Errores</div>
                </div>
            </div>
            <div class="audit-stat">
                <div class="stat-icon info">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.total || 0}</div>
                    <div class="stat-label">Total</div>
                </div>
            </div>
        `;
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.loadAuditLogs(page);
        }
    }

    showLogDetail(logId) {
        const log = this.auditLogs.find(l => l.id === logId);
        if (!log) return;

        const modal = this.createLogDetailModal(log);
        modal.classList.add('active');
    }
    createLogDetailModal(log) {
        const modalId = 'logDetailModal';
        let modal = document.getElementById(modalId);
        
        if (modal) {
            modal.remove();
        }

        const modalHTML = `
            <div id="${modalId}" class="modal-overlay">
                <div class="modal" style="width: 800px; max-height: 90vh;">
                    <div class="modal-header">
                        <h3 class="modal-title">Detalles del Log de Auditoría</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                        <div class="log-detail-section">
                            <h4>Información General</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>ID:</label>
                                    <span>${log.id}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Acción:</label>
                                    <span>${log.action}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Tipo:</label>
                                    <span>${this.getLogTypeText(log.type)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Nivel:</label>
                                    <span class="log-level ${log.level}">${this.getLogLevelText(log.level)}</span>
                                </div>
                                <div class="detail-item full-width">
                                    <label>Descripción:</label>
                                    <span>${log.description}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Fecha y Hora:</label>
                                    <span>${this.formatDateTime(log.timestamp)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="log-detail-section">
                            <h4>Información del Usuario</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Email:</label>
                                    <span>${log.userEmail || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>ID de Usuario:</label>
                                    <span>${log.userId || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Rol:</label>
                                    <span>${log.userRole || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Dirección IP:</label>
                                    <span>${log.ipAddress || 'N/A'}</span>
                                </div>
                                <div class="detail-item full-width">
                                    <label>User Agent:</label>
                                    <span class="user-agent">${log.userAgent || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        ${log.metadata ? `
                            <div class="log-detail-section">
                                <h4>Metadatos</h4>
                                <pre class="metadata-content">${JSON.stringify(log.metadata, null, 2)}</pre>
                            </div>
                        ` : ''}

                        ${log.stackTrace ? `
                            <div class="log-detail-section">
                                <h4>Stack Trace</h4>
                                <pre class="stack-trace">${log.stackTrace}</pre>
                            </div>
                        ` : ''}

                        <div class="log-detail-section">
                            <h4>Información Técnica</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Recurso:</label>
                                    <span>${log.resource || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Método HTTP:</label>
                                    <span>${log.method || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Código de Estado:</label>
                                    <span>${log.statusCode || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Duración:</label>
                                    <span>${log.duration ? log.duration + 'ms' : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="panel-control-btn" onclick="auditManager.exportLogDetail('${log.id}')">
                            <i class="fas fa-download"></i> Exportar
                        </button>
                        <button class="panel-control-btn" onclick="document.getElementById('${modalId}').classList.remove('active')">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById(modalId);
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        return modal;
    }
    async exportAuditLogs() {
        try {
            this.showNotification('Exportando logs de auditoría...', 'info');

            const params = new URLSearchParams({
                level: this.filters.level !== 'all' ? this.filters.level : '',
                type: this.filters.type !== 'all' ? this.filters.type : '',
                user: this.filters.user !== 'all' ? this.filters.user : '',
                dateRange: this.filters.dateRange !== 'all' ? this.filters.dateRange : '',
                format: 'xlsx'
            });

            const response = await fetch(`/api/admin/audit/export?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const fileName = `audit-logs-${new Date().toISOString().split('T')[0]}.xlsx`;
                this.downloadBlob(blob, fileName);
                this.showNotification('Logs exportados exitosamente', 'success');
            }
        } catch (error) {
            console.error('Error exporting audit logs:', error);
            this.showNotification('Error al exportar los logs', 'error');
        }
    }
    async exportLogDetail(logId) {
        const log = this.auditLogs.find(l => l.id === logId);
        if (!log) return;

        const data = {
            logDetail: log,
            exportDate: new Date().toISOString(),
            exportedBy: localStorage.getItem('userEmail')
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        this.downloadBlob(blob, `log-detail-${logId}.json`);
    }
    downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showClearLogsModal() {
        const modalHTML = `
            <div id="clearLogsModal" class="modal-overlay">
                <div class="modal" style="width: 500px;">
                    <div class="modal-header">
                        <h3 class="modal-title">Limpiar Logs de Auditoría</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="warning-message">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Esta acción eliminará permanentemente los logs de auditoría seleccionados.</p>
                        </div>
                        <div class="form-group">
                            <label>Eliminar logs anteriores a:</label>
                            <select id="clearLogsRange">
                                <option value="30">30 días</option>
                                <option value="60">60 días</option>
                                <option value="90">90 días</option>
                                <option value="180">180 días</option>
                                <option value="365">1 año</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="confirmClearLogs">
                                Confirmo que deseo eliminar los logs de auditoría
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="panel-control-btn danger" id="confirmClear">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                        <button class="panel-control-btn" id="cancelClear">Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('clearLogsModal');
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('#cancelClear').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('#confirmClear').addEventListener('click', () => {
            const confirmed = document.getElementById('confirmClearLogs').checked;
            const daysRange = document.getElementById('clearLogsRange').value;
            
            if (confirmed) {
                this.clearAuditLogs(daysRange);
                modal.remove();
            } else {
                this.showNotification('Debe confirmar la eliminación', 'error');
            }
        });

        modal.classList.add('active');
    }

    async clearAuditLogs(daysRange) {
        try {
            const response = await fetch('/api/admin/audit/clear', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ daysRange: parseInt(daysRange) })
            });

            if (response.ok) {
                this.showNotification('Logs eliminados exitosamente', 'success');
                await this.loadAuditLogs();
            }
        } catch (error) {
            console.error('Error clearing audit logs:', error);
            this.showNotification('Error al eliminar los logs', 'error');
        }
    }

    setupRealTimeUpdates() {
        if (window.realTimeManager && window.realTimeManager.websocket) {
            const ws = window.realTimeManager.websocket;
            
            ws.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'audit_log') {
                    this.addNewLog(data.log);
                }
            });
        }
    }

    addNewLog(log) {
        this.auditLogs.unshift(log);
        if (this.auditLogs.length > 1000) {
            this.auditLogs = this.auditLogs.slice(0, 1000);
        }

        this.applyFilters();
        
        if (log.level === 'error' || log.level === 'warning') {
            this.showNotification(`Nuevo log de auditoría: ${log.action}`, log.level);
        }
    }
    toggleAutoRefresh(enabled) {
        if (enabled) {
            this.autoRefreshInterval = setInterval(() => {
                this.loadAuditLogs(this.currentPage);
            }, 30000); // Refresh every 30 seconds
        } else {
            if (this.autoRefreshInterval) {
                clearInterval(this.autoRefreshInterval);
            }
        }
    }

    getLogLevels() {
        return {
            info: 'Información',
            warning: 'Advertencia',
            error: 'Error',
            success: 'Éxito'
        };
    }

    getLogTypes() {
        return {
            login: 'Inicio de Sesión',
            logout: 'Cierre de Sesión',
            create: 'Creación',
            update: 'Actualización',
            delete: 'Eliminación',
            export: 'Exportación',
            import: 'Importación',
            backup: 'Respaldo',
            restore: 'Restauración',
            security: 'Seguridad',
            system: 'Sistema'
        };
    }

    getLogIcon(type) {
        const icons = {
            login: '<i class="fas fa-right-to-bracket"></i>',
            logout: '<i class="fas fa-right-from-bracket"></i>',
            create: '<i class="fas fa-plus"></i>',
            update: '<i class="fas fa-edit"></i>',
            delete: '<i class="fas fa-trash"></i>',
            export: '<i class="fas fa-download"></i>',
            import: '<i class="fas fa-upload"></i>',
            backup: '<i class="fas fa-database"></i>',
            restore: '<i class="fas fa-undo"></i>',
            security: '<i class="fas fa-shield-alt"></i>',
            system: '<i class="fas fa-cog"></i>'
        };
        return icons[type] || '<i class="fas fa-info-circle"></i>';
    }

    getLogLevelText(level) {
        return this.logLevels[level] || level;
    }
    getLogTypeText(type) {
        return this.logTypes[type] || type;
    }
    shouldHighlightLog(log) {
        const isRecent = new Date() - new Date(log.timestamp) < 3600000; // 1 hour
        const isHighPriority = log.level === 'error' || log.level === 'warning';
        return isRecent || isHighPriority;
    }
    parseUserAgent(userAgent) {
        
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Desconocido';
    }
    formatDateTime(timestamp) {
        return new Date(timestamp).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    showNotification(message, type) {
        if (window.notificationSystem) {
            window.notificationSystem.showToast(message, type);
        }
    }
    async refresh() {
        await this.loadAuditLogs(this.currentPage);
    }
    destroy() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        console.log('🔍 Audit Manager destroyed');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuditManagerModule;
} else {
    window.AuditManagerModule = AuditManagerModule;
    window.auditManager = new AuditManagerModule();
}