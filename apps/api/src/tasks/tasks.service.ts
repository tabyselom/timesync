import {  Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create_task.dto';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaskPaginationDto } from './dto/task_pagination.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async createTask( projectId: string,createTaskDto: CreateTaskDto,userId: string,) {
    const project = await this.assertProject(projectId);

    await this.assertWorkspaceMember(project.workspaceId, userId);

    const data = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      dueDate: createTaskDto.dueDate,
      priority: createTaskDto.priority,
      projectId: project.id,
      createdById: userId,
      assignedToId: createTaskDto.assignedToId || null,
    };

    if (createTaskDto.assignedToId) {
      await this.assertUser(createTaskDto.assignedToId);

      await this.assertWorkspaceMember(
        project.workspaceId,
        createTaskDto.assignedToId,
      );

      data.assignedToId = createTaskDto.assignedToId;
    }

    const task = await this.prisma.task.create({ data });
    return {
      message: 'Task created successfully.',
      task,
    };
  }

  async listTasks(projectId: string, userId: string, paginationDto: TaskPaginationDto) {

    const project = await this.assertProject(projectId);
    await this.assertWorkspaceMember(project.workspaceId, userId);

    const { page = 1, limit = 10, status, priority } = paginationDto;
    const skip = (page - 1) * limit;


    const [tasks, total] = await Promise.all([
     this.prisma.task.findMany({
      where: {
        projectId: project.id,
        deletedAt: null,
        ...(status && { status }),
        ...(priority && { priority }),
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo:{
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            }
        }
    }
    }),
    this.prisma.task.count({ where: {
        projectId: project.id,
        deletedAt: null,
        ...(status && { status }),
        ...(priority && { priority }),
      },})
    
    ]);

    return {
      tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

  }

  private async assertProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
        deletedAt: null,
      },
      include: {
        workspace: true,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }
  private async assertWorkspaceMember(workspaceId: string, userId: string) {
    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
    if (!workspaceMember) {
      throw new NotFoundException('User is not a member of this workspace');
    }
    return workspaceMember;
  }

  private async assertUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
