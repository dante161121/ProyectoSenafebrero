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
**Legislación colombiana**: Implementación completa de la legislación laboral 
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

## Entorno de Desarrollo — Requisitos

Antes de ejecutar el proyecto asegúrate de tener instalado lo siguiente en tu computador:

| **Node.js**  Ejecutar el backend y el servidor de desarrollo del frontend 
| **npm**  Instalar los paquetes del proyecto (se instala junto con Node.js) 
| **MongoDB Community**  Base de datos donde se guarda la información del sistema 
| **Git** Clonar y gestionar el repositorio 

### 2. Instalar las dependencias

```bash
npm install
```

Luego las dependencias del backend:

```bash
cd backend
npm install
cd ..
```

## Cómo Arrancar el Proyecto

### Arranque rápido (todo en uno)

```bash
cd .\ProyectoFinalSEN
npm run start:both
```

Este comando deja los puertos reales fijos del proyecto:

- Frontend: http://localhost:3000/proyectopages/index.html
- Backend: http://localhost:5000/health

El script de arranque ahora hace esto automáticamente:

- Reutiliza backend y frontend si ya están sanos
- Libera solo los puertos esperados del proyecto cuando hace falta
- Evita que Vite cambie silenciosamente de 3000 a 3001

Comandos útiles:

```bash
npm run ports:status
npm run stop:both
```

##  Desarrollador
 
| **Repositorio** ProyectoFinalSEN https://github.com/mariangeldante2563/ProyectoFinalSEN
