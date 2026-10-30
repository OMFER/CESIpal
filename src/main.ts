import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FiltroErroresDominio } from './shared/presentation/filtro-errores-dominio';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(process.env.PORT || 3000);
}
bootstrap().catch((err) => console.error(err));
