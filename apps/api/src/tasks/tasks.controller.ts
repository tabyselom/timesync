import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create_task.dto';
import { CurrentUser } from 'src/auth/decorators/current-user/current-user.decorator';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { TaskPaginationDto } from './dto/task_pagination.dto';
import { UpdateTaskDto } from './dto/update_task.dto';
import { ChangeTaskStatusDto } from './dto/change_task_status.dto';
import { ChangeTaskPriorityDto } from './dto/change_task_priority.dto';

@Controller({
  path: 'project/:projectId/tasks',
  version:"1"
})
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  createTask(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.createTask(projectId, dto, user.id);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  listTasks(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
    @Query() paginationDto: TaskPaginationDto,
  ) {
    return this.tasksService.listTasks(projectId, user.id, paginationDto);
  }

  @Get(':taskId')
  @UseGuards(JwtAuthGuard)
  getTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.getTask(projectId, taskId, user.id);
  }

  @Patch(':taskId')
  @UseGuards(JwtAuthGuard)
  updateTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.updateTask(projectId, taskId, dto, user.id);
  }

  @Delete(':taskId')
  @UseGuards(JwtAuthGuard)
  deleteTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.deleteTask(projectId, taskId, user.id);
  }

  @Patch(':taskId/status')
  @UseGuards(JwtAuthGuard)
  changeTaskStatus(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangeTaskStatusDto,
  ) {
    return this.tasksService.changeTaskStatus(projectId, taskId, user.id, dto);
  }

  @Patch(':taskId/priority')
  @UseGuards(JwtAuthGuard)
  changeTaskPriority(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangeTaskPriorityDto,
  ) {
    return this.tasksService.changeTaskPriority(
      projectId,
      taskId,
      user.id,
      dto,
    );
  }
}
