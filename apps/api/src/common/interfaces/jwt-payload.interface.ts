import { WorkspaceRole } from '@prisma/client';

export interface JwtPayload {
  id: string;
  email: string;
  workspaceId?: string;
  role?: WorkspaceRole;
}
