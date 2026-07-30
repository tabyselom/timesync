import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

type RefreshTokenRequest = Request & {
  body: {
    refreshToken: string;
  };
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),

      ignoreExpiration: false,

      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),

      passReqToCallback: true,
    });
  }

  validate(req: RefreshTokenRequest, payload: JwtPayload) {
    return {
      ...payload,
      refreshToken: req.body.refreshToken,
    };
  }
}
