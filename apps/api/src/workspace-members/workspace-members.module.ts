import { forwardRef, Module } from '@nestjs/common';

import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceMembersController } from './workspace-members.controller';

import { UsersModule } from '../users/users.module';
import { WorkspacesService } from 'src/workspaces/workspaces.service';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';

@Module({
  imports: [UsersModule,
    forwardRef(()=> WorkspacesModule)
  ],
  providers: [WorkspaceMembersService],
  exports: [WorkspaceMembersService],
  controllers: [WorkspaceMembersController],
})
export class WorkspaceMembersModule {}
