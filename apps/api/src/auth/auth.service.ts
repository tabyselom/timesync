import { Injectable } from '@nestjs/common';
import {
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { UsersService } from '../users/users.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { WorkspaceMembersService } from '../workspace-members/workspace-members.service';
import{TokenService} from './token.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';


import { EmailAlreadyExistsException } from '../common/exceptions/conflict.exception';

import { comparePassword, hashPassword } from '../common/utils/password.util';
import { generateSlug } from '../common/utils/slug.util';

import { User, Workspace, WorkspaceRole } from '@prisma/client';



@Injectable()
export class AuthService {

   constructor(
    private prisma:PrismaService,
    private readonly usersService: UsersService,

    private readonly workspacesService: WorkspacesService,

    private readonly workspaceMembersService: WorkspaceMembersService,
    
    private readonly tokenService: TokenService,
   ){}

  async register(dto: RegisterDto) {
    const existingUser =await this.usersService.findByEmail(dto.email);
    
    if(existingUser){
      throw new EmailAlreadyExistsException();
    }

    const passwordHash = await hashPassword(dto.password);
    const slug = generateSlug(dto.workspaceName);

    const result = await this.createUserWithWorkspace(
      dto,
      passwordHash,
      slug,
  );

    const tokens = await this.tokenService.generateToken(
    result.user.id,
    result.user.email,
    result.workspace.id,
  );

  const refreshTokenHash = await this.tokenService.hashRefreshToken(tokens.refreshToken);
   await this.usersService.updateRefreshToken(
    result.user.id,
    refreshTokenHash,
  );

  return  this.buildAuthResponse(
    result.user,
    result.workspace,
    tokens,
  )
  

  }

  async login(dto: LoginDto) {
    const existingUser = await this.usersService.findByEmailWithMemberships(dto.email);

  if (!existingUser || !existingUser.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(dto.password, existingUser.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const memberShip = existingUser.memberships[0];
    if (!memberShip) {
      throw new ForbiddenException('User does not belong to any workspace');
    }

    const workspace=memberShip.workspace;

    const tokens = await this.tokenService.generateToken(
      existingUser.id,
      existingUser.email,
      workspace.id,
    );

    const refreshTokenHash = await this.tokenService.hashRefreshToken(tokens.refreshToken);
    await this.usersService.updateRefreshToken(existingUser.id, refreshTokenHash);

    return this.buildAuthResponse(existingUser, workspace, tokens);
  
  }


  private async createUserWithWorkspace(
  dto: RegisterDto,
  passwordHash: string,
  slug: string,
) {
  return this.prisma.$transaction(async (tx) => {
    const user = await this.usersService.create(
      {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      tx,
    );

    const workspace = await this.workspacesService.create(
      {
        name: dto.workspaceName,
        slug,
      },
      tx,
    );

    await this.workspaceMembersService.create(
      {
        role: WorkspaceRole.OWNER,

        user: {
          connect: {
            id: user.id,
          },
        },

        workspace: {
          connect: {
            id: workspace.id,
          },
        },
      },
      tx,
    );

    return {
      user,
      workspace,
    };
  });
}

   private buildAuthResponse(
  user: User,
  workspace: Workspace,
  tokens: {
    accessToken: string;
    refreshToken: string;
  },
) {
  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },

    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },

    tokens,
  };
}}