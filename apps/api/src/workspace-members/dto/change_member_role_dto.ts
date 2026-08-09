import { IsEnum } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';

export class ChangeMemberRoleDto {
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
