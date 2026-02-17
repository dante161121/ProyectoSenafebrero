/**
 * IN OUT MANAGER - SCRIPT DE LIMPIEZA DE PUERTOS
 * @version 1.0.0
 * @description 
 */

const PortManager = require('../utils/PortManager');

async function cleanPorts() {
  try {
    console.log('IN OUT MANAGER - LIMPIEZA DE PUERTOS');
    console.log('='.repeat(50));
    
    const portManager = new PortManager();
    
    // Limpiar puertos comunes
    const portsToClean = [3000, 3001, 3002, 5000, 5001, 5002];
    
    console.log('Verificando puertos:', portsToClean.join(', '));
    
    await portManager.killProcessesOnPorts(portsToClean);
    
    console.log('');
    console.log('Limpieza de puertos completada');
    
    // Verificar qué puertos están ahora disponibles
    console.log('');
    console.log(' Verificando puertos disponibles:');
    
    for (const port of portsToClean) {
      const isAvailable = await portManager.isPortAvailable(port);
      const status = isAvailable ? ' Disponible' : ' Ocupado';
      console.log(`   Puerto ${port}: ${status}`);
    }
    
    console.log('');
    console.log('🎉 Puertos preparados para IN OUT MANAGER');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error(' Error al limpiar puertos:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  cleanPorts();
}

module.exports = { cleanPorts };