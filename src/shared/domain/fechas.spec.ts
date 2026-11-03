import { esZonaHorariaValida, formatearFecha, inicioDelDia } from './fechas';

describe('fechas en la zona horaria de la escuela', () => {
  it('la medianoche en Ciudad de México es a las 06:00 UTC', () => {
    expect(
      inicioDelDia('2026-08-03', 'America/Mexico_City').toISOString(),
    ).toBe('2026-08-03T06:00:00.000Z');
  });

  it('respeta el horario de verano de cada fecha', () => {
    expect(inicioDelDia('2026-01-15', 'Europe/Madrid').toISOString()).toBe(
      '2026-01-14T23:00:00.000Z',
    );
    expect(inicioDelDia('2026-07-15', 'Europe/Madrid').toISOString()).toBe(
      '2026-07-14T22:00:00.000Z',
    );
  });

  it('formatea en la zona indicada, no en UTC', () => {
    const medianocheMadrid = inicioDelDia('2026-08-10', 'Europe/Madrid');
    expect(formatearFecha(medianocheMadrid, 'Europe/Madrid')).toBe(
      '10 de agosto de 2026',
    );
  });

  it('valida nombres de zona', () => {
    expect(esZonaHorariaValida('America/Mexico_City')).toBe(true);
    expect(esZonaHorariaValida('Marte/Olympus')).toBe(false);
  });

  it('rechaza fechas mal formadas', () => {
    expect(() => inicioDelDia('03/08/2026', 'UTC')).toThrow('YYYY-MM-DD');
  });
});
