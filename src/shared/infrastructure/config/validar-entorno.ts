// Se ejecuta al arrancar: si falta una variable obligatoria la app no inicia, en vez de fallar después
export function validarEntorno(
  entorno: Record<string, unknown>,
): Record<string, unknown> {
  const faltantes = ['MONGO_URI', 'JWT_SECRET'].filter(
    (clave) => !entorno[clave],
  );
  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${faltantes.join(', ')} (ver .env_example)`,
    );
  }

  const secreto = String(entorno.JWT_SECRET);
  if (entorno.NODE_ENV === 'production' && secreto.length < 32) {
    throw new Error(
      'JWT_SECRET debe tener al menos 32 caracteres en producción',
    );
  }

  const tieneCorreo = Boolean(entorno.ADMIN_CORREO);
  const tienePassword = Boolean(entorno.ADMIN_PASSWORD);
  if (tieneCorreo !== tienePassword) {
    throw new Error('ADMIN_CORREO y ADMIN_PASSWORD deben definirse juntas');
  }
  return entorno;
}
