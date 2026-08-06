import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create_task.dto';
import { CurrentUser } from 'src/auth/decorators/current-user/current-user.decorator';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { TaskPaginationDto } from './dto/task_pagination.dto';

@Controller({
    path: 'project/:projectId',
})
export class TasksController {
    constructor(
        private readonly tasksService: TasksService,
    ) {}

    @Post('tasks')
    @UseGuards(JwtAuthGuard)
    createTask(
        @Param('projectId') projectId: string,
        @Body() createTaskDto: CreateTaskDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.tasksService.createTask(projectId, createTaskDto, user.id);
    }


    @Get('tasks')
    @UseGuards(JwtAuthGuard)
    listTasks(
        @Param('projectId') projectId: string,
        @CurrentUser() user: JwtPayload,
        @Query() paginationDto: TaskPaginationDto
    ) {
        return this.tasksService.listTasks(projectId, user.id, paginationDto);
    }
}
