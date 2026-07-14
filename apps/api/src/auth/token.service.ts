import { Injectable } from '@nestjs/common';
import { hashPassword } from 'src/common/utils/password.util';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config/dist/config.service';





@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ){}

    async generateToken(
        userId: string,
        email: string,
        workspaceId: string,
    ){
      const payload = { sub: userId, email, workspaceId };
    
      const accessToken = await this.jwtService.signAsync(payload,{  
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN') as '15m',
        });
    
      const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.configService.getOrThrow<string>('jwt.refreshExpiresIn') as '7d',
      });
    
      return {
        accessToken,
        refreshToken,
      };
      }

    generateRefreshToken(){}

    verifyRefreshToken(){}

    hashRefreshToken(
        token: string,
    ){
        return hashPassword(token);
    }

}