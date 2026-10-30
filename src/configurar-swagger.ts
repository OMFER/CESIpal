import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as i18n from './i18n/es.json';

export const RUTA_DOCUMENTACION = 'api/docs';

// Documentación interactiva de la API en /api/docs
export function configurarSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle(i18n.swagger.global.titulo)
    .setDescription(i18n.swagger.global.descripcion)
    .setVersion(i18n.swagger.global.version)
    .addBearerAuth()
    .build();

  const documento = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(RUTA_DOCUMENTACION, app, documento);
}
