import { ForbiddenException, forwardRef, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import {  WorkspaceRole } from '@prisma/client';

import { CreateWorkspaceDto } from './dto/create_workspace.dto';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

import { generateSlug } from 'src/common/utils/slug.util';
import { WorkspaceMembersService } from 'src/workspace-members/workspace-members.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { TokenService } from 'src/auth/token.service';
import { RefreshTokenService } from 'src/auth/refresh-token.service';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => WorkspaceMembersService))
    private readonly workspaceMemberService: WorkspaceMembersService,
    private readonly userService: UsersService,
    @Inject(forwardRef(() => TokenService))
    private readonly tokenService: TokenService,
    private readonly refreshTokenService:RefreshTokenService
  ) {}

  async create(dto: CreateWorkspaceDto, user: JwtPayload) {
    const slug = generateSlug(dto.name);
    const workspace = await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: dto.name,
          slug,
        },
      });
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: WorkspaceRole.OWNER,
        },
      });
      return workspace;
    });

    return {
      message: 'Workspace created successfully',
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug, // Return the slug to the client!
        createdAt: workspace.createdAt,
      },
    };
  }
  async findById(id: string) {
    return this.prisma.workspace.findUnique({
      where: {
        id,
      },
    });
  }

  async select(userId: string, workspaceId: string) {
    const membership = await this.workspaceMemberService.findMembership(
      workspaceId,
      userId,
    );

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace.');
    }

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const tokens = await this.tokenService.generateToken(
      user.id,
      user.email,
      membership.workspaceId,
      membership.role,
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenService.create(
      user.id,
      tokens.refreshToken,
      expiresAt,
      membership.workspaceId,
    );

    return {
      message: 'Workspace selected successfully.',
      workspace: {
        id: membership.workspaceId,
        role: membership.role,
      },
      tokens,
    };
  }
}
