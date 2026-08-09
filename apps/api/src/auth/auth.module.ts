import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from '../users/users.module';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';

import { AuthController } from './auth.controller';

import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';

import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { RefreshTokenService } from './refresh-token.service';

@Module({
  imports: [
    JwtModule.register({}),
    UsersModule,
    WorkspacesModule,
    WorkspaceMembersModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('jwt.secret'),
        signOptions: {
          expiresIn: config.getOrThrow('jwt.expiresIn'),
        },
      }),
    }),
  ],

  controllers: [AuthController],

  exports: [TokenService],

  providers: [
    AuthService,
    TokenService,
    JwtStrategy,
    RefreshTokenStrategy,
    RefreshTokenService,
  ],
})
export class AuthModule {}
