import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create_project.dto';

import { WorkspaceMember, WorkspaceRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from 'src/workspaces/workspaces.service';
import { generateSlug } from 'src/common/utils/slug.util';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateProjectDto } from './dto/update_project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}
  async createProject(
    workspaceId: string,
    userId: string,
    dto: CreateProjectDto,
  ) {
    await this.assertWorkspace(workspaceId);

    const membership = await this.assertWorkspaceMember(workspaceId, userId);

    this.assertCanManageProjects(membership);

    const existingProject = await this.prisma.project.findFirst({
      where: {
        name: dto.name,
        workspaceId: workspaceId,
        deletedAt: null,
      },
    });

    if (existingProject) {
      throw new ConflictException(
        'A project with this name already exists in this workspace.',
      );
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
        createdBy: {
          connect: {
            id: userId,
          },
        },
      },
    });
    return {
      message: 'Project created successfully.',
      project,
    };
  }

  async listProjects(workspaceId: string, userId: string, pagination:PaginationDto) {
    await this.assertWorkspace(workspaceId);
    await this.assertWorkspaceMember(workspaceId, userId);
    const projects = await this.prisma.project.findMany({
      where: {
        workspaceId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      take: pagination.limit,
      skip: (pagination.page - 1) * pagination.limit,
      orderBy: {
        createdAt: 'desc',
      },

    });

    const total= await this.prisma.project.count({
      where: {
        workspaceId,
        deletedAt: null,
      },
    });

    const totalPages = Math.ceil(total / pagination.limit);
    const hasNextPage = pagination.page < totalPages;
    const hasPreviousPage = pagination.page > 1;



    return {
      message: 'Projects retrieved successfully.',
      projects,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async getProjectById(workspaceId: string, projectId: string, userId: string) {
    await this.assertWorkspace(workspaceId);
    await this.assertWorkspaceMember(workspaceId, userId);
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    return project;
  }

  async updateProject(
    workspaceId: string,
    projectId: string,
    userId: string,
    dto: UpdateProjectDto
  ) {
    await this.assertWorkspace(workspaceId);
    await this.assertWorkspaceMember(workspaceId, userId);
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    return await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: dto,
    });
  }

  async deleteProject(workspaceId: string, projectId: string, userId: string) {
    await this.assertWorkspace(workspaceId);
    await this.assertWorkspaceMember(workspaceId, userId);
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    return {
      message: 'Project deleted successfully.',
    };
  } 

  private async assertWorkspaceMember(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
    if (!membership) {
      throw new NotFoundException('User is not a member of this workspace.');
    }
    return membership;
  }

  private async assertWorkspace(workspaceId: string) {
    const workspace = await this.workspacesService.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('No Workspace found with this id.');
    }
  }

  private assertCanManageProjects(member: WorkspaceMember) {
    if (
      member.role !== WorkspaceRole.OWNER &&
      member.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage projects.',
      );
    }
  }
}

