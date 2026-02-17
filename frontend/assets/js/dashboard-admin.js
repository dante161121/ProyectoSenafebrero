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
  
  loadEmployeesList() {
    try {
      if (!this.employeesList) return;
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const employees = users.filter(user => user.tipoUsuario === 'empleado');
      if (employees.length === 0) {
        this.employeesList.innerHTML = '<p>No hay empleados registrados.</p>';
        return;
      }
      let employeesHTML = '<div class="employees-table"><table>';
      employeesHTML += '<thead><tr><th>Nombre</th><th>Documento</th><th>Cargo</th><th>Acciones</th></tr></thead><tbody>';
      
      employees.forEach(employee => {
        employeesHTML += `
          <tr data-id="${employee.id}">
            <td>${employee.nombreCompleto}</td>
            <td>${employee.numeroDocumento}</td>
            <td>${employee.cargo || 'No especificado'}</td>
            <td>
              <button class="view-btn" data-id="${employee.id}">Ver</button>
              <button class="edit-btn" data-id="${employee.id}">Editar</button>
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
  
  viewEmployeeDetails(employeeId) {
    try {
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      
      const employee = users.find(user => user.id === employeeId);
      
      if (!employee) {
        if (typeof NotificationManager !== 'undefined') {
          NotificationManager.showToast('Empleado no encontrado', 'error');
        } else {
          alert('Empleado no encontrado');
        }
        return;
      }
  
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      const employeeRecords = attendanceRecords.filter(record => record.userId === employeeId);
      
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
  
  loadAttendanceRecords() {
    try {
      if (!this.attendanceRecords) return;

      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      const filteredRecords = this.filterAttendanceByDate(attendanceRecords);

      if (filteredRecords.length === 0) {
        this.attendanceRecords.innerHTML = '<p>No hay registros de asistencia disponibles.</p>';
        return;
      }

      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

      filteredRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      let recordsHTML = '<div class="records-table"><table>';
      recordsHTML += '<thead><tr><th>Empleado</th><th>Fecha</th><th>Hora</th><th>Tipo</th></tr></thead><tbody>';

      filteredRecords.forEach(record => {
        const user = users.find(u => u.id === record.userId);
        const userName = user ? user.nombreCompleto : 'Usuario desconocido';
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

  filterAttendanceByDate(records) {
    if (!this.dateFilter) return records;
    
    const filterValue = this.dateFilter.value;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filterValue) {
      case 'today':
        return records.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate.getDate() === now.getDate() &&
                 recordDate.getMonth() === now.getMonth() &&
                 recordDate.getFullYear() === now.getFullYear();
        });

      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        return records.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= weekStart;
        });
        
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        return records.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= monthStart;
        });
        
      case 'all':
      default:
        return records;
    }
  }
  
  loadDashboardStats() {
    try {

      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      

      const employees = users.filter(user => user.tipoUsuario === 'empleado');

      if (this.activeEmployees) {
        this.activeEmployees.textContent = employees.length;
      }
 
      if (this.todayAttendance) {
        const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
        const now = new Date();
        const today = now.toLocaleDateString('es-ES');
        

        const employeesWithEntryToday = new Set();
        
        attendanceRecords.forEach(record => {
          const recordDate = new Date(record.timestamp).toLocaleDateString('es-ES');
          if (recordDate === today && record.type === 'entrada') {
            employeesWithEntryToday.add(record.userId);
          }
        });

        const attendancePercentage = employees.length > 0 
          ? Math.round((employeesWithEntryToday.size / employees.length) * 100) 
          : 0;
        
        this.todayAttendance.textContent = `${attendancePercentage}%`;
      }
      
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }
  
  searchEmployees() {
    try {
      if (!this.employeeSearch || !this.employeesList) return;
      
      const searchTerm = this.employeeSearch.value.trim().toLowerCase();

      if (!searchTerm) {
        this.loadEmployeesList();
        return;
      }

      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

      const filteredEmployees = users.filter(user => 
        user.tipoUsuario === 'empleado' && (
          user.nombreCompleto.toLowerCase().includes(searchTerm) ||
          user.numeroDocumento.includes(searchTerm) ||
          (user.cargo && user.cargo.toLowerCase().includes(searchTerm))
        )
      );

      if (filteredEmployees.length === 0) {
        this.employeesList.innerHTML = '<p>No se encontraron empleados que coincidan con la búsqueda.</p>';
        return;
      }

      let employeesHTML = '<div class="employees-table"><table>';
      employeesHTML += '<thead><tr><th>Nombre</th><th>Documento</th><th>Cargo</th><th>Acciones</th></tr></thead><tbody>';
      
      filteredEmployees.forEach(employee => {
        employeesHTML += `
          <tr data-id="${employee.id}">
            <td>${employee.nombreCompleto}</td>
            <td>${employee.numeroDocumento}</td>
            <td>${employee.cargo || 'No especificado'}</td>
            <td>
              <button class="view-btn" data-id="${employee.id}">Ver</button>
              <button class="edit-btn" data-id="${employee.id}">Editar</button>
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
  
  exportData() {
    try {

      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      const filteredRecords = this.filterAttendanceByDate(attendanceRecords);

      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      let csv = 'Empleado,Documento,Fecha,Hora,Tipo\n';
      
      filteredRecords.forEach(record => {
        const user = users.find(u => u.id === record.userId);
        if (user) {
          csv += `"${user.nombreCompleto}","${user.numeroDocumento}","${record.date}","${record.time}","${record.type}"\n`;
        }
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
