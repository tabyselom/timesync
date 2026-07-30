import {
  Body,
  Controller,
  Post,
  Param,
  UseGuards,
  Delete,
  Patch,
} from '@nestjs/common';
import { WorkspaceMembersService } from './workspace-members.service';

import { InviteMemberDto } from './dto/invite-member.dto';
import { Roles } from 'src/auth/decorators/roles/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user/current-user.decorator';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { transferOwnership } from './dto/transfer-ownership.dto';

@Controller({
  path: 'workspaces/:workspaceId',
  version: '1',
})
export class WorkspaceMembersController {
  constructor(
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  inviteMember(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.workspaceMembersService.invite(workspaceId, dto);
  }

  @Delete('leave')
  @UseGuards(JwtAuthGuard)
  leaveWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workspaceMembersService.leaveWorkspace(workspaceId, user);
  }

  @Patch('transfer-ownership')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkspaceRole.OWNER)
  transferOwnership(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: transferOwnership,
  ) {
    return this.workspaceMembersService.transferOwnership(
      workspaceId,
      user,
      dto,
    );
  }
}
