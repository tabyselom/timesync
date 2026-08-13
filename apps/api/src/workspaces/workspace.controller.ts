import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateWorkspaceDto } from './dto/create_workspace.dto';
import { CurrentUser } from 'src/auth/decorators/current-user/current-user.decorator';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Controller({
  path: 'workspaces',
})
export class WorkspaceController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateWorkspaceDto, @CurrentUser() user: JwtPayload) {
    return this.workspacesService.create(dto, user);
  }

   @Post(':workspaceId/select')
   @UseGuards(JwtAuthGuard)
    select(
      @Param('workspaceId', new ParseUUIDPipe()) workspaceId: string,
      @CurrentUser() user: JwtPayload,
    ) {
      return this.workspacesService.select(user.id, workspaceId);
    } 
  


}