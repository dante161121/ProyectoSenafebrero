// FUNCIONALIDAD DEL DASHBOARD DE ADMINISTRADOR // 

class AdminDashboard extends BaseDashboard {
  constructor() {
    super('administrador');
    
   //DOM
    this.adminName = document.getElementById('adminName');
    this.employeesList = document.getElementById('employeesList');
    this.attendanceRecords = document.getElementById('attendanceRecords');
    this.adminDepartment = document.getElementById('adminDepartment');
    this.activeEmployees = document.getElementById('activeEmployees');
    this.todayAttendance = document.getElementById('todayAttendance');
    this.employeeSearch = document.getElementById('employeeSearch');
    this.searchBtn = document.getElementById('searchBtn');
    this.dateFilter = document.getElementById('dateFilter');
    this.exportBtn = document.getElementById('exportBtn');
    this.newEmployeeBtn = document.getElementById('newEmployeeBtn');
    this.reportsBtn = document.getElementById('reportsBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
  }
  
  initSpecific() {
    this.setupEventListeners();
    this.loadEmployeesList();
    this.loadAttendanceRecords();
    this.loadDashboardStats();
  }
  
  updateUserInterface() {
    if (this.adminName) {
      this.adminName.textContent = this.currentUser.nombreCompleto;
    }
    if (this.adminDepartment) {
      this.adminDepartment.textContent = this.currentUser.departamento || 'No especificado';
    }
  }
  
  setupEventListeners() {
    if (this.searchBtn) {
      this.searchBtn.addEventListener('click', () => this.searchEmployees());
    }
    
    if (this.dateFilter) {
      this.dateFilter.addEventListener('change', () => this.loadAttendanceRecords());
    }
    
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => this.logout());
    }
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.exportData());
    }
    
    if (this.newEmployeeBtn) {
      this.newEmployeeBtn.addEventListener('click', () => window.location.href = 'registro.html');
    }
    
    if (this.reportsBtn) {
      this.reportsBtn.addEventListener('click', () => {
        if (typeof NotificationManager !== 'undefined') {
          NotificationManager.showToast('Funcionalidad de informes en desarrollo', 'info');
        } else {
          alert('Funcionalidad de informes en desarrollo');
        }
      });
    }
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => {
        if (typeof NotificationManager !== 'undefined') {
          NotificationManager.showToast('Funcionalidad de configuración en desarrollo', 'info');
        } else {
          alert('Funcionalidad de configuración en desarrollo');
        }
      });
    }
  }
  
  _authHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async loadEmployeesList() {
    try {
      if (!this.employeesList) return;
      this.employeesList.innerHTML = '<p>Cargando empleados...</p>';

      const response = await fetch('/api/users?tipoUsuario=empleado&limit=200', {
        headers: this._authHeaders()
      });
      const result = await response.json();

      if (!result.success) {
        this.employeesList.innerHTML = '<p>Error al obtener empleados del servidor.</p>';
        return;
      }

      const employees = result.data;
      if (employees.length === 0) {
        this.employeesList.innerHTML = '<p>No hay empleados registrados.</p>';
        return;
      }

      let employeesHTML = '<div class="employees-table"><table>';
      employeesHTML += '<thead><tr><th>Nombre</th><th>Documento</th><th>Cargo</th><th>Acciones</th></tr></thead><tbody>';

      employees.forEach(employee => {
        employeesHTML += `
          <tr data-id="${employee._id}">
            <td>${employee.nombreCompleto}</td>
            <td>${employee.numeroDocumento}</td>
            <td>${employee.cargo || 'No especificado'}</td>
            <td>
              <button class="view-btn" data-id="${employee._id}">Ver</button>
              <button class="edit-btn" data-id="${employee._id}">Editar</button>
            </td>
          </tr>
        `;
      });

      employeesHTML += '</tbody></table></div>';
      this.employeesList.innerHTML = employeesHTML;
      this.setupEmployeeActions();
    } catch (error) {
      console.error('Error al cargar lista de empleados:', error);
      this.employeesList.innerHTML = '<p>Error al cargar los empleados.</p>';
    }
  }
  
  setupEmployeeActions() {

    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        const employeeId = button.getAttribute('data-id');
        this.viewEmployeeDetails(employeeId);
      });
    });
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const employeeId = button.getAttribute('data-id');
        if (typeof NotificationManager !== 'undefined') {
          NotificationManager.showToast(`Funcionalidad de edición en desarrollo para empleado ID: ${employeeId}`, 'info');
        } else {
          alert(`Funcionalidad de edición en desarrollo para empleado ID: ${employeeId}`);
        }
      });
    });
  }
  
  async viewEmployeeDetails(employeeId) {
    try {
      const [userRes, attRes] = await Promise.all([
        fetch(`/api/users/${employeeId}`, { headers: this._authHeaders() }),
        fetch(`/api/attendance/all?userId=${employeeId}&limit=100`, { headers: this._authHeaders() })
      ]);

      const userResult = await userRes.json();
      const attResult = await attRes.json();

      const employee = userResult.data;

      if (!employee) {
        if (typeof NotificationManager !== 'undefined') {
          NotificationManager.showToast('Empleado no encontrado', 'error');
        } else {
          alert('Empleado no encontrado');
        }
        return;
      }

      const employeeRecords = attResult.success ? attResult.data.map(r => ({
        userId: r.userId?._id || r.userId,
        type: r.type,
        timestamp: r.timestamp,
        date: r.date || new Date(r.timestamp).toLocaleDateString('es-ES'),
        time: r.time || new Date(r.timestamp).toLocaleTimeString('es-ES')
      })) : [];
      
      const modal = document.createElement('div');
      modal.className = 'employee-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h3>Detalles del Empleado</h3>
          
          <div class="employee-details">
            <p><strong>Nombre:</strong> ${employee.nombreCompleto}</p>
            <p><strong>Documento:</strong> ${employee.numeroDocumento}</p>
            <p><strong>Correo:</strong> ${employee.correoElectronico}</p>
            <p><strong>Cargo:</strong> ${employee.cargo || 'No especificado'}</p>
            <p><strong>Horario:</strong> ${employee.horarioAsignado || 'No especificado'}</p>
            <p><strong>Fecha de Ingreso:</strong> ${employee.fechaIngreso || 'No especificado'}</p>
            <p><strong>Teléfono:</strong> ${employee.telefono || 'No especificado'}</p>
          </div>
          
          <h4>Registros de Asistencia</h4>
          <div class="employee-attendance">
            ${this.generateAttendanceHTML(employeeRecords)}
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const closeModal = modal.querySelector('.close-modal');
      closeModal.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      modal.addEventListener('click', event => {
        if (event.target === modal) {
          document.body.removeChild(modal);
        }
      });
      
    } catch (error) {
      console.error('Error al mostrar detalles del empleado:', error);
      if (typeof NotificationManager !== 'undefined') {
        NotificationManager.showToast('Error al cargar los detalles del empleado', 'error');
      } else {
        alert('Error al cargar los detalles del empleado');
      }
    }
  }
  
  generateAttendanceHTML(records) {
    if (records.length === 0) {
      return '<p>No hay registros de asistencia para este empleado.</p>';
    }
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let html = '<table>';
    html += '<thead><tr><th>Fecha</th><th>Hora</th><th>Tipo</th></tr></thead><tbody>';
    
    records.forEach(record => {
      const typeClass = record.type === 'entrada' ? 'entry-record' : 'exit-record';
      const typeIcon = record.type === 'entrada' ? '⬆️' : '⬇️';
      
      html += `
        <tr class="${typeClass}">
          <td>${record.date}</td>
          <td>${record.time}</td>
          <td>${typeIcon} ${record.type.charAt(0).toUpperCase() + record.type.slice(1)}</td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    
    return html;
  }
  
  async loadAttendanceRecords() {
    try {
      if (!this.attendanceRecords) return;
      this.attendanceRecords.innerHTML = '<p>Cargando registros...</p>';

      // Construir filtro de fecha para la query
      const dateParams = this._buildDateQueryParams();
      const response = await fetch(`/api/attendance/all?limit=200${dateParams}`, {
        headers: this._authHeaders()
      });
      const result = await response.json();

      if (!result.success) {
        this.attendanceRecords.innerHTML = '<p>Error al obtener registros del servidor.</p>';
        return;
      }

      const filteredRecords = result.data;

      if (filteredRecords.length === 0) {
        this.attendanceRecords.innerHTML = '<p>No hay registros de asistencia disponibles.</p>';
        return;
      }

      let recordsHTML = '<div class="records-table"><table>';
      recordsHTML += '<thead><tr><th>Empleado</th><th>Fecha</th><th>Hora</th><th>Tipo</th></tr></thead><tbody>';

      filteredRecords.forEach(record => {
        // userId viene populate con { _id, nombreCompleto, numeroDocumento }
        const userName = record.userId?.nombreCompleto || 'Usuario desconocido';
        const typeClass = record.type === 'entrada' ? 'entry-record' : 'exit-record';
        const typeIcon = record.type === 'entrada' ? '⬆️' : '⬇️';

        recordsHTML += `
          <tr class="${typeClass}">
            <td>${userName}</td>
            <td>${record.date}</td>
            <td>${record.time}</td>
            <td>${typeIcon} ${record.type.charAt(0).toUpperCase() + record.type.slice(1)}</td>
          </tr>
        `;
      });
      
      recordsHTML += '</tbody></table></div>';
      this.attendanceRecords.innerHTML = recordsHTML;

    } catch (error) {
      console.error('Error al cargar registros de asistencia:', error);
      this.attendanceRecords.innerHTML = '<p>Error al cargar los registros.</p>';
    }
  }

  // Construye los parámetros de fecha para la query según el filtro seleccionado
  _buildDateQueryParams() {
    if (!this.dateFilter) return '';
    const filterValue = this.dateFilter.value;
    const now = new Date();

    const toISO = (d) => d.toISOString().split('T')[0];

    switch (filterValue) {
      case 'today': {
        const today = toISO(now);
        return `&startDate=${today}&endDate=${today}`;
      }
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return `&startDate=${toISO(weekStart)}&endDate=${toISO(now)}`;
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return `&startDate=${toISO(monthStart)}&endDate=${toISO(now)}`;
      }
      case 'all':
      default:
        return '';
    }
  }
  
  async loadDashboardStats() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [usersRes, attRes] = await Promise.all([
        fetch('/api/users?tipoUsuario=empleado&limit=1', { headers: this._authHeaders() }),
        fetch(`/api/attendance/all?startDate=${today}&endDate=${today}&limit=500`, { headers: this._authHeaders() })
      ]);

      const usersResult = await usersRes.json();
      const attResult = await attRes.json();

      const totalEmployees = usersResult.success ? usersResult.pagination.total : 0;

      if (this.activeEmployees) {
        this.activeEmployees.textContent = totalEmployees;
      }

      if (this.todayAttendance) {
        const employeesWithEntry = new Set();
        if (attResult.success) {
          attResult.data.forEach(record => {
            if (record.type === 'entrada') {
              const uid = record.userId?._id || record.userId;
              employeesWithEntry.add(String(uid));
            }
          });
        }
        const percentage = totalEmployees > 0
          ? Math.round((employeesWithEntry.size / totalEmployees) * 100)
          : 0;
        this.todayAttendance.textContent = `${percentage}%`;
      }
    } catch (error) {
      console.error('Error al cargar estadísticas del dashboard:', error);
    }
  }
  
  async searchEmployees() {
    try {
      if (!this.employeeSearch || !this.employeesList) return;

      const searchTerm = this.employeeSearch.value.trim();

      if (!searchTerm) {
        this.loadEmployeesList();
        return;
      }

      this.employeesList.innerHTML = '<p>Buscando...</p>';

      const response = await fetch(
        `/api/users?tipoUsuario=empleado&search=${encodeURIComponent(searchTerm)}&limit=100`,
        { headers: this._authHeaders() }
      );
      const result = await response.json();

      if (!result.success || result.data.length === 0) {
        this.employeesList.innerHTML = '<p>No se encontraron empleados que coincidan con la búsqueda.</p>';
        return;
      }

      let employeesHTML = '<div class="employees-table"><table>';
      employeesHTML += '<thead><tr><th>Nombre</th><th>Documento</th><th>Cargo</th><th>Acciones</th></tr></thead><tbody>';

      result.data.forEach(employee => {
        employeesHTML += `
          <tr data-id="${employee._id}">
            <td>${employee.nombreCompleto}</td>
            <td>${employee.numeroDocumento}</td>
            <td>${employee.cargo || 'No especificado'}</td>
            <td>
              <button class="view-btn" data-id="${employee._id}">Ver</button>
              <button class="edit-btn" data-id="${employee._id}">Editar</button>
            </td>
          </tr>
        `;
      });

      employeesHTML += '</tbody></table></div>';
      this.employeesList.innerHTML = employeesHTML;
      this.setupEmployeeActions();
    } catch (error) {
      console.error('Error al buscar empleados:', error);
      this.employeesList.innerHTML = '<p>Error al buscar empleados.</p>';
    }
  }
  
  async exportData() {
    try {
      const dateParams = this._buildDateQueryParams();
      const response = await fetch(`/api/attendance/all?limit=1000${dateParams}`, {
        headers: this._authHeaders()
      });
      const result = await response.json();

      if (!result.success) {
        if (typeof NotificationManager !== 'undefined') {
          NotificationManager.showToast('Error al obtener datos para exportar', 'error');
        } else {
          alert('Error al obtener datos para exportar');
        }
        return;
      }

      const filteredRecords = result.data;
      let csv = 'Empleado,Documento,Fecha,Hora,Tipo\n';

      filteredRecords.forEach(record => {
        const nombre = record.userId?.nombreCompleto || 'Desconocido';
        const documento = record.userId?.numeroDocumento || '-';
        const fecha = record.date || new Date(record.timestamp).toLocaleDateString('es-ES');
        const hora = record.time || new Date(record.timestamp).toLocaleTimeString('es-ES');
        csv += `"${nombre}","${documento}","${fecha}","${hora}","${record.type}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      link.setAttribute('href', url);
      link.setAttribute('download', `registros_asistencia_${dateStr}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (typeof NotificationManager !== 'undefined') {
        NotificationManager.showToast('Datos exportados correctamente', 'success');
      } else {
        alert('Datos exportados correctamente');
      }
      
    } catch (error) {
      console.error('Error al exportar datos:', error);
       if (typeof NotificationManager !== 'undefined') {
        NotificationManager.showToast('Error al exportar datos', 'error');
      } else {
        alert('Error al exportar datos');
      }
    }
  }
  
}

document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new AdminDashboard();
});
