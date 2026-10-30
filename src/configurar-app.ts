import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FiltroErroresDominio } from './shared/presentation/filtro-errores-dominio';

// Configuración HTTP común a la app real y a las pruebas e2e
export function configurarApp(app: INestApplication): void {
  app.enableCors({
    origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(','),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new FiltroErroresDominio());
}
