/**
 * @version 1.0.0
 * @description
 */

const net = require('net');
class PortManager {
  constructor() {
    this.defaultPorts = {
      backend: 5000,
      frontend: 3000
    };
    this.maxPortRange = 10; 
  }

  /**
   * Verifica si un puerto está disponible
   * @param {number} port 
   * @returns {Promise<boolean>} 
   */
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.close(() => {
          resolve(true);
        });
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Encuentra el primer puerto disponible a partir de un puerto base
   * @param {number} startPort 
   * @param {number} maxTries 
   * @returns {Promise<number|null>} 
   */
  async findAvailablePort(startPort, maxTries = this.maxPortRange) {
    for (let i = 0; i < maxTries; i++) {
      const port = startPort + i;
      const available = await this.isPortAvailable(port);
      
      if (available) {
        return port;
      }
    }
    return null;
  }

  /**
   * @returns {Promise<Object>} 
   */
  async getAvailablePorts() {
    console.log('Buscando puertos disponibles...');
    
    const backendPort = await this.findAvailablePort(this.defaultPorts.backend);
    const frontendPort = await this.findAvailablePort(this.defaultPorts.frontend);
    
    if (!backendPort || !frontendPort) {
      throw new Error('No se pudieron encontrar puertos disponibles');
    }
    
    console.log(`Puerto backend disponible: ${backendPort}`);
    console.log(`Puerto frontend disponible: ${frontendPort}`);
    
    return {
      backend: backendPort,
      frontend: frontendPort
    };
  }

  /**
   * Mata procesos que estén usando puertos específicos
   * @param {number[]} ports 
   */
  async killProcessesOnPorts(ports) {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    for (const port of ports) {
      try {
        console.log(` Verificando puerto ${port}...`);

        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        
        if (stdout.trim()) {
          const lines = stdout.trim().split('\n');
          const pids = new Set();
          
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') {
              pids.add(pid);
            }
          });

          for (const pid of pids) {
            try {
              await execAsync(`taskkill /F /PID ${pid}`);
              console.log(` Proceso ${pid} terminado (puerto ${port})`);
            } catch (error) {
              console.log(`No se pudo terminar proceso ${pid}`);
            }
          }
        }
      } catch (error) {
        // Puerto probablemente libre
        console.log(`Puerto ${port} está libre`);
      }
    }
  }

  /**
   * @returns {Promise<Object>} 
   */
  async prepareEnvironment() {
    console.log('🧹 Preparando entorno de puertos...');

    await this.killProcessesOnPorts([
      this.defaultPorts.backend,
      this.defaultPorts.frontend,
      this.defaultPorts.backend + 1,
      this.defaultPorts.frontend + 1
    ]);
    

    await new Promise(resolve => setTimeout(resolve, 2000));

    const ports = await this.getAvailablePorts();
    
    return ports;
  }
}

module.exports = PortManager;