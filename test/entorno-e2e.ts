// Se carga antes que las pruebas: AppModule valida estas variables al importarse.
// La base de pruebas se borra al empezar y al terminar: nunca apuntar a una base real.
process.env.MONGO_URI =
  process.env.MONGO_URI_E2E ?? 'mongodb://127.0.0.1:27017/cesipal_e2e';
process.env.JWT_SECRET = 'secreto-de-pruebas-e2e';
process.env.ADMIN_CORREO = 'admin@escuela.mx';
process.env.ADMIN_PASSWORD = 'admin123';
