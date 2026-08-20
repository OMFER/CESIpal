import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import * as i18n from '../i18n/es.json';

@ApiTags(i18n.swagger.auth.etiqueta)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({
    summary: i18n.swagger.auth.login_summary,
    description: i18n.swagger.auth.login_description
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}