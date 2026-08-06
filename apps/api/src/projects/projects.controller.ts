import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { CurrentUser } from 'src/auth/decorators/current-user/current-user.decorator';
import { CreateProjectDto } from './dto/create_project.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateProjectDto } from './dto/update_project.dto';

@Controller({
  path: 'workspaces/:workspaceId/projects',
  version: '1',
})
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  createProject(
    @Body() dto: CreateProjectDto,
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.createProject(workspaceId, user.id, dto);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  listProjects(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.projectsService.listProjects(workspaceId, user.id, pagination);
  }

  @Get(':id')
  getProject(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.getProjectById(workspaceId, projectId, user.id);
  }

  @Patch(':id')
  updateProject(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.updateProject(
      workspaceId,
      projectId,
      user.id,
      dto,
    );
  }

  @Delete(':id')
  deleteProject(
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.deleteProject(workspaceId, projectId, user.id);
  }
}

