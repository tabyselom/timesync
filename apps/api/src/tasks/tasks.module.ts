import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { UsersModule } from 'src/users/users.module';
import { WorkspaceMembersModule } from 'src/workspace-members/workspace-members.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';

@Module({
  imports: [UsersModule,WorkspaceMembersModule,
    ProjectsModule,
    WorkspacesModule
  ],
  providers: [TasksService],
  controllers: [TasksController]
})
export class TasksModule {}
