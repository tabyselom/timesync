import { Module } from '@nestjs/common';

import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceMembersController } from './workspace-members.controller';

import { UsersModule } from '../users/users.module';
import { WorkspacesService } from 'src/workspaces/workspaces.service';

@Module({
  imports: [UsersModule],
  providers: [WorkspaceMembersService, WorkspacesService],
  exports: [WorkspaceMembersService],
  controllers: [WorkspaceMembersController],
})
export class WorkspaceMembersModule {}
