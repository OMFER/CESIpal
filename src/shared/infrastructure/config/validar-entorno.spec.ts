import { validarEntorno } from './validar-entorno';

describe('validarEntorno', () => {
  const minimo = {
    MONGO_URI: 'mongodb://localhost/escuela',
    JWT_SECRET: 'secreto',
  };

  it('acepta la configuración mínima', () => {
    expect(validarEntorno(minimo)).toEqual(minimo);
  });

  it('exige MONGO_URI y JWT_SECRET', () => {
    expect(() => validarEntorno({ MONGO_URI: 'x' })).toThrow('JWT_SECRET');
  });

  it('exige un secreto largo en producción', () => {
    expect(() => validarEntorno({ ...minimo, NODE_ENV: 'production' })).toThrow(
      '32 caracteres',
    );
  });

  it('exige ADMIN_CORREO y ADMIN_PASSWORD juntas', () => {
    expect(() => validarEntorno({ ...minimo, ADMIN_CORREO: 'a@b.mx' })).toThrow(
      'juntas',
    );
  });
});
