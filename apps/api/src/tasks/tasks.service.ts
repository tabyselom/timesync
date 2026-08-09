import {  ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create_task.dto';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaskPaginationDto } from './dto/task_pagination.dto';
import { Prisma, WorkspaceRole } from '@prisma/client';
import { UpdateTaskDto } from './dto/update_task.dto';
import { ChangeTaskStatusDto } from './dto/change_task_status.dto';
import { ChangeTaskPriorityDto } from './dto/change_task_priority.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async createTask(
    projectId: string,
    createTaskDto: CreateTaskDto,
    userId: string,
  ) {
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

  async listTasks(
    projectId: string,
    userId: string,
    paginationDto: TaskPaginationDto,
  ) {
    const project = await this.assertProject(projectId);
    await this.assertWorkspaceMember(project.workspaceId, userId);

    const { page = 1, limit = 10, status, priority } = paginationDto;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      projectId: project.id,
      deletedAt: null,
      ...(status && { status }),
      ...(priority && { priority }),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTask(projectId: string, taskId: string, userId: string) {
    const project = await this.assertProject(projectId);
    await this.assertWorkspaceMember(project.workspaceId, userId);

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId: project.id,
        deletedAt: null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async updateTask(
    projectId: string,
    taskId: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ) {
    const project = await this.assertProject(projectId);
    const membership = await this.assertWorkspaceMember(
      project.workspaceId,
      userId,
    );
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId: project.id,
        deletedAt: null,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (
      task.createdById !== userId &&
      membership.role !== WorkspaceRole.ADMIN &&
      membership.role !== WorkspaceRole.OWNER
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this task',
      );
    }

    if (updateTaskDto.assignedToId) {
      await this.assertUser(updateTaskDto.assignedToId);
      await this.assertWorkspaceMember(
        project.workspaceId,
        updateTaskDto.assignedToId,
      );
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: updateTaskDto,
    });

    return {
      message: 'Task updated successfully.',
      task: updatedTask,
    };
  }

  async deleteTask(projectId: string, taskId: string, userId: string) {
    const project = await this.assertProject(projectId);
    const membership = await this.assertWorkspaceMember(
      project.workspaceId,
      userId,
    );
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId: project.id,
        deletedAt: null,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found or already deleted');
    }

    if (
      task.createdById !== userId &&
      membership.role !== WorkspaceRole.ADMIN &&
      membership.role !== WorkspaceRole.OWNER
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this task',
      );
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });

    return {
      message: 'Task deleted successfully.',
    };
  }

  async changeTaskStatus(
    projectId: string,
    taskId: string,
    userId: string,
    dto: ChangeTaskStatusDto,
  ) {
    const project = await this.assertProject(projectId);
    const membership = await this.assertWorkspaceMember(
      project.workspaceId,
      userId,
    );
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId: project.id,
        deletedAt: null,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found or already deleted');
    }

    if (
      task.createdById !== userId &&
      membership.role !== WorkspaceRole.ADMIN &&
      membership.role !== WorkspaceRole.OWNER &&
      task.assignedToId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to change the status of this task',
      );
    }

    if (task.status === dto.status) {
      throw new ConflictException(`The status is already ${dto.status}.`);
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: dto.status,
      },
    });

    return {
      message: 'Task status updated successfully.',
      task: updatedTask,
    };
  }

  async changeTaskPriority(
    projectId: string,
    taskId: string,
    userId: string,
    dto: ChangeTaskPriorityDto,
  ) {
    const project = await this.assertProject(projectId);
    const membership = await this.assertWorkspaceMember(
      project.workspaceId,
      userId,
    );
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId: project.id,
        deletedAt: null,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found or already deleted');
    }

    if (
      task.createdById !== userId &&
      membership.role !== WorkspaceRole.ADMIN &&
      membership.role !== WorkspaceRole.OWNER
    ) {
      throw new ForbiddenException(
        'You do not have permission to change the Priority of this task',
      );
    }

    if (task.priority === dto.priority) {
      throw new ConflictException(`The status is already ${dto.priority}.`);
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        priority: dto.priority,
      },
    });

    return {
      message: 'Task status priority successfully.',
      task: updatedTask,
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
