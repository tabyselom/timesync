import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user;
    const workspaceId = request.params.workspaceId;

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    if (!workspaceId) {
      throw new BadRequestException('Workspace ID is required.');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace.');
    }

    // Use the database as the source of truth.
    request.user.workspaceId = workspaceId;
    request.user.role = membership.role;

    return true;
  }
}
