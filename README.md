# InOutManager - Sistema de Gestión de Asistencia y Control de Jornada Laboral

<p align="center">
  <img src="frontend/assets/img/icon.jpg" alt="InOutManager Logo" width="150">
</p>

## Descripción del Proyecto

**InOutManager** es un sistema completo de gestión de asistencia y control de jornada laboral desarrollado con tecnologías modernas (MERN Stack). El sistema permite el registro preciso de entradas y salidas de empleados, cálculo automático de tiempos laborados según la legislación colombiana vigente (2025), generación de reportes avanzados en formato Excel, auditoría completa de acciones y administración completa de usuarios con roles diferenciados.


## Tecnologías Utilizadas

### Backend

Tecnología   

**Node.js**  Entorno de ejecución JavaScript del lado del servidor 
**Express.js**  Framework web para Node.js con arquitectura RESTful 
**MongoDB** Base de datos NoSQL para almacenamiento de datos 
**JWT**  9.0.2  Autenticación basada en tokens JSON Web Token 
**bcryptjs** 2.4.3  Encriptación de contraseñas 
**exceljs**  4.3.0  Generación de reportes en formato Excel 
**express-validator**  6.14.2  Validación de datos en backend 

### Frontend

Tecnología 

**HTML5**  Estructura semántica para la interfaz de usuario 
**CSS3**  Estilos con variables CSS personalizadas, flexbox y grid 
**JavaScript ES6+** | - | Programación orientada a objetos con clases 
**Vite** | ^7.1.5 | Servidor de desarrollo y herramienta de construcción |
**date-fns** | ^2.30.0 | Librería para manipulación de fechas |


###  Autenticación y Autorización

**Registro de usuarios**: Empleados y administradores con validación completa de datos
**Inicio de sesión seguro**: Autenticación JWT con tokens seguros
**Código de administrador**: Verificación adicional para acceso administrativo (código de 4 dígitos)
**Recuperación de contraseña**: Sistema de recuperación con códigos de verificación
**Gestión de sesiones**: Control de sesiones activas con LocalStorage y logout seguro
**Validación de tokens**: Verificación de integridad de tokens JWT

### Registro de Asistencia y Control de Jornada

**Registro de entrada/salida**: Marcación precisa con timestamp
**Sesiones de trabajo**: Creación automática de sesiones laborales
**Cálculo de tiempos**: Algoritmos avanzados para cálculo de tiempo laborado
**Legislación colombiana**: Implementación completa de la legislación laboral 2025 (Ley 2101, CST, Decreto 1072)
**Recargos automáticos**: Cálculo de recargos nocturnos (35%), extras diurnas (25%), extras nocturnas (75%) y dominicales (100%)
**Validación de integridad**: Verificación de consistencia de datos
**Distribución de jornadas**: Clasificación entre jornada diurna (6:00-22:00) y nocturna (22:00-6:00)

### Estadísticas y Reportes

**Estadísticas diarias**: Resumen completo del día laboral
**Estadísticas semanales/mensuales**: Análisis de productividad por períodos
**Gráficos interactivos**: Visualización con Chart.js y D3.js
**Reportes Excel**: Generación automática de reportes personalizados con ExcelJS
**Dashboard en tiempo real**: Actualización automática de métricas
**KPIs avanzados**: Indicadores clave de rendimiento (puntualidad, horas extras, etc.)

### Panel de Administración Avanzado

**Dashboard administrativo**: Panel completo con métricas y gráficos 
**Vista en tiempo real**: Monitoreo continuo de asistencia de todos los empleados
**Gestión de empleados**: Administración completa del personal (alta, baja, modificación)


### Prerequisites

- Node.js 18.x o superior
- MongoDB 6.x o superior
- npm 9.x o superior
- Git

### Pasos de Instalación

1. **Clonar el repositorio**
   bash
   git clone https://github.com/mariangeldante2563/ProyectoFinalSEN.git
   cd ProyectoFinalSEN
   

2. **Instalar dependencias del proyecto**
   bash
   npm install
  

3. **Instalar dependencias del backend**
   bash
   cd backend
   npm install
   cd 
  

4. **Configurar variables de entorno**

   Crear archivo `.env` en la carpeta `backend/`:
   env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/inoutmanager
   JWT_SECRET=tu_secreto_jwt_aqui
   JWT_EXPIRE=7d
   NODE_ENV=development
   CORS_ENABLED=true
   CORS_ORIGIN=http://localhost:5173
  

5. **Iniciar MongoDB** 
   bash
   # En Windows
   net start MongoDB
   
6. **Ejecutar el proyecto**

Opción 1 - Script de Windows:
 bash
npm run start:windows

##  Desarrollador
 
| **Repositorio** | [ProyectoFinalSEN](https://github.com/mariangeldante2563/ProyectoFinalSEN) |
