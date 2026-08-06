import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { WorkspaceMembersService } from 'src/workspace-members/workspace-members.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports:[UsersModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, WorkspaceMembersService],
})
export class ProjectsModule {}
