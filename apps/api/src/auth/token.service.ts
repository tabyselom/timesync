import { Injectable } from '@nestjs/common';
import { comparePassword, hashPassword } from 'src/common/utils/password.util';
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
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN') as '7d',
      });
    
      return {
        accessToken,
        refreshToken,
      };
    }

    async compareRefreshToken(
    refreshToken: string,
    refreshTokenHash: string,
    ) {
    return comparePassword(
        refreshToken,
        refreshTokenHash,
    );
    }

    generateRefreshToken(){}

    verifyRefreshToken(){}

    hashRefreshToken(
        token: string,
    ){
        return hashPassword(token);
    }

}