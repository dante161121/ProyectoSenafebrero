/**
 * Script para verificar un usuario específico
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const emailToCheck = 'danteymariangelcarrillo@gmail.com';

async function checkUser() {
  try {
    console.log(' Buscando usuario:', emailToCheck);
    console.log('');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inoutmanager');
    
    const user = await User.findOne({ correoElectronico: emailToCheck }).select('+password');
    
    if (user) {
      console.log(' Usuario encontrado en la base de datos:');
      console.log('=====================================');
      console.log('- ID:', user._id);
      console.log('- Nombre:', user.nombreCompleto);
      console.log('- Email:', user.correoElectronico);
      console.log('- Tipo:', user.tipoUsuario);
      console.log('- Documento:', user.numeroDocumento);
      console.log('- Activo:', user.activo);
      console.log('- Código Admin:', user.codigoAdmin || 'N/A');
      console.log('- Foto perfil:', user.fotoPerfil);
      console.log('- Creado:', user.createdAt);
      console.log('- Actualizado:', user.updatedAt);
      console.log('');
      console.log(' Información de contraseña:');
      console.log('- Password hash existe:', !!user.password);
      console.log('- Longitud del hash:', user.password ? user.password.length : 0);
      console.log('- Formato bcrypt (inicia con $2):', user.password ? user.password.startsWith('$2') : false);
      console.log('');
      
      // Probar el login con una contraseña de prueba
      if (user.password && user.password.startsWith('$2')) {
        console.log(' La contraseña está correctamente hasheada con bcrypt');
        console.log('');
        console.log(' Para probar el login:');
        console.log('   1. Usa el email:', user.correoElectronico);
        console.log('   2. Usa la contraseña que estableciste al registrarte');
        if (user.tipoUsuario === 'administrador') {
          console.log('   3. Usa el código admin:', user.codigoAdmin || 'NO DEFINIDO');
        }
      } else {
        console.log(' La contraseña NO está en formato bcrypt válido');
        console.log('   El usuario fue creado de forma incorrecta');
      }
    } else {
      console.log('Usuario NO encontrado en la base de datos MongoDB');
      console.log('');
      console.log(' Verificando si existe en localStorage del navegador...');
      console.log('   El usuario podría estar solo en el navegador (modo offline)');
      console.log('');
      console.log(' Opciones:');
      console.log('   1. Registrar el usuario nuevamente desde la aplicación');
      console.log('   2. Verificar que el backend esté corriendo correctamente');
      console.log('   3. Verificar la conexión a MongoDB');
    }
    
  } catch (error) {
    console.error(' Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkUser();
