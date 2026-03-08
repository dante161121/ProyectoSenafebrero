const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/inoutmanager_test';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('email inválido => 400 con errors.field = "correoElectronico"', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correoElectronico: 'correo-malo', password: '123456' })
      .expect(400);
    expect(res.body.success).toBe(false);
    const fieldError = res.body.errors.find(e => e.field === 'correoElectronico');
    expect(fieldError).toBeDefined();
  });

  test('usuario no existe => 401 credenciales', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correoElectronico: 'no@existe.com', password: '123456' })
      .expect(401);
    expect(res.body.success).toBe(false);
    const fieldError = res.body.errors.find(e => e.field === 'credenciales');
    expect(fieldError).toBeDefined();
  });

  test('password incorrecto => 401', async () => {
    const user = new User({
      nombreCompleto: 'Test User',
      numeroDocumento: '12345678',
      correoElectronico: 'user@test.com',
      password: 'Clave123',
      tipoUsuario: 'empleado'
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correoElectronico: 'user@test.com', password: 'wrongpass' })
      .expect(401);
    expect(res.body.success).toBe(false);
    const fieldError = res.body.errors.find(e => e.field === 'credenciales');
    expect(fieldError).toBeDefined();
  });

  test('usuario NO admin sin codigoAdmin => login ok con password correcto', async () => {
    const user = new User({
      nombreCompleto: 'Empleado',
      numeroDocumento: '22222222',
      correoElectronico: 'empleado@test.com',
      password: 'Clave123',
      tipoUsuario: 'empleado'
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correoElectronico: 'empleado@test.com', password: 'Clave123' })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('usuario admin sin codigoAdmin => 401 field codigoAdmin', async () => {
    const admin = new User({
      nombreCompleto: 'Admin',
      numeroDocumento: '99999999',
      correoElectronico: 'admin@test.com',
      password: 'Clave123',
      tipoUsuario: 'administrador',
      codigoAdmin: '1234'
    });
    await admin.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correoElectronico: 'admin@test.com', password: 'Clave123' })
      .expect(401);
    const fieldError = res.body.errors.find(e => e.field === 'codigoAdmin');
    expect(fieldError).toBeDefined();
  });

  test('usuario admin con codigoAdmin inválido => 401 field codigoAdmin', async () => {
    const admin = new User({
      nombreCompleto: 'Admin',
      numeroDocumento: '99999999',
      correoElectronico: 'admin@test.com',
      password: 'Clave123',
      tipoUsuario: 'administrador',
      codigoAdmin: '1234'
    });
    await admin.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correoElectronico: 'admin@test.com', password: 'Clave123', codigoAdmin: '12ab' })
      .expect(401);
    const fieldError = res.body.errors.find(e => e.field === 'codigoAdmin');
    expect(fieldError).toBeDefined();
  });

  test('login exitoso (admin) => 200 con token y user.id', async () => {
    const admin = new User({
      nombreCompleto: 'Admin',
      numeroDocumento: '99999999',
      correoElectronico: 'admin@test.com',
      password: 'Clave123',
      tipoUsuario: 'administrador',
      codigoAdmin: '1234'
    });
    await admin.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correoElectronico: 'admin@test.com', password: 'Clave123', codigoAdmin: '1234' })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBeDefined();
  });
});
