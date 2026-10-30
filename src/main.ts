import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './configurar-app';
import { configurarSwagger } from './configurar-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);
  configurarSwagger(app);
  await app.listen(process.env.PORT || 3000);
}
bootstrap().catch((err) => console.error(err));
