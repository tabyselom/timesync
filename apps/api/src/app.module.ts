import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import jwt from './config/jwt.config';

import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { WorkspaceMembersModule } from './workspace-members/workspace-members.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwt],
    }),

    PrismaModule,
    UsersModule,
    AuthModule,
    WorkspacesModule,
    WorkspaceMembersModule,
    
  ],
})
export class AppModule {}