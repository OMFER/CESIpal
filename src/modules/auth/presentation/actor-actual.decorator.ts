import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Actor } from '../../../shared/domain/actor';

// El Actor que JwtStrategy.validate dejó en request.user
export const ActorActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Actor =>
    ctx.switchToHttp().getRequest<{ user: Actor }>().user,
);
