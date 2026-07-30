import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
