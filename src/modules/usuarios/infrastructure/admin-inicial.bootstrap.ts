import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CrearAdminInicial } from '../application/crear-admin-inicial';

@Injectable()
export class AdminInicialBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminInicialBootstrap.name);

  constructor(
    private readonly config: ConfigService,
    private readonly crearAdminInicial: CrearAdminInicial,
  ) {}

  async onApplicationBootstrap() {
    const correo = this.config.get<string>('ADMIN_CORREO');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!correo || !password) return;

    if (await this.crearAdminInicial.ejecutar(correo, password)) {
      this.logger.log(`Administrador inicial creado: ${correo}`);
    }
  }
}
