import { Injectable } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateWorkspaceDto } from './dto/create_workspace.dto';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

import { generateSlug } from 'src/common/utils/slug.util';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkspaceDto, user: JwtPayload){
    const slug= generateSlug(dto.name);
    const workspace = await this.prisma.$transaction(async (tx)=>{
       const workspace= await tx.workspace.create({data:{
        name:dto.name,
        slug
      }})
      await tx.workspaceMember.create({
        data: {
          workspaceId:workspace.id,
          userId:user.id,
          role:WorkspaceRole.OWNER
        },
      });
      return workspace;
    })

    return {
      message: 'Workspace created successfully',
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug, // Return the slug to the client!
        createdAt: workspace.createdAt,
      }
    };
  }
  async findById(id: string) {
    return this.prisma.workspace.findUnique({
      where: {
        id,
      },
    });
  }
}
