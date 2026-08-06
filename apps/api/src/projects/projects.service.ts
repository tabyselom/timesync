import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';

import { Prisma, Workspace, WorkspaceRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { WorkspacesService } from 'src/workspaces/workspaces.service';
import { NotFoundError } from 'rxjs';
import { generateSlug } from 'src/common/utils/slug.util';

@Injectable()
export class ProjectsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly usersService: UsersService,
        private readonly workspacesService: WorkspacesService,
      ) {}
  async create(workspaceId: string, userId: string, dto: CreateProjectDto){
    const workspace = await this.workspacesService.findById(workspaceId);
    if(!workspace){
         throw new NotFoundException('No Workspace found with this id.');
    }
    
    const user = await this.prisma.workspaceMember.findUnique({
        where:{
            userId_workspaceId:{
                userId,
                workspaceId
            }
        }
    })
    if (!user) {
      throw new NotFoundException('User is not a member of this workspace.');
    }

    if (user.role === WorkspaceRole.MANAGER){
        throw new ConflictException(" You don't have permission to create project");
    }

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        slug: generateSlug(dto.name),
        workspace: {
          connect: {
            id: workspaceId,
          },
      },
    }
  });
        
    

  }
}

