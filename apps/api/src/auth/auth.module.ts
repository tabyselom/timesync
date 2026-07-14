import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'




import { UsersModule } from '../users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';
import { TokenService } from './token.service';

@Module({
  imports: [
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

  providers: [
    AuthService,
    TokenService
  ],
})
export class AuthModule {}