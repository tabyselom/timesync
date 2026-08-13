import { forwardRef, Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { WorkspacesService } from './workspaces.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceMembersModule } from 'src/workspace-members/workspace-members.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => WorkspaceMembersModule),
    UsersModule,
    forwardRef(() => AuthModule),
  ],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
  controllers: [WorkspaceController],
})
export class WorkspacesModule {}
