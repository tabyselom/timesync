import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { WorkspacesService } from './workspaces.service';
import { WorkspaceController } from './workspace.controller';

@Module({
  imports: [PrismaModule],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
  controllers: [WorkspaceController],
})
export class WorkspacesModule {}
