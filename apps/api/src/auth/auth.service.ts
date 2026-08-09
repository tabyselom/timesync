import { ForbiddenException, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { UsersService } from '../users/users.service';
import { RefreshTokenService } from './refresh-token.service';
import { TokenService } from './token.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { EmailAlreadyExistsException } from '../common/exceptions/conflict.exception';

import { comparePassword, hashPassword } from '../common/utils/password.util';

import { User } from '@prisma/client';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { RefreshTokenDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new EmailAlreadyExistsException();
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.createUser(dto, passwordHash);

    const tokens = await this.tokenService.generateToken(user.id, user.email);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenService.create(
      user.id,
      tokens.refreshToken,
      expiresAt,
    );

    return this.buildAuthResponse(user, tokens);
  }

  async login(dto: LoginDto) {
    const existingUser = await this.usersService.findByEmailWithMemberships(
      dto.email,
    );

    if (!existingUser || !existingUser.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(
      dto.password,
      existingUser.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.tokenService.generateToken(existingUser.id, existingUser.email);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenService.create(
      existingUser.id,
      tokens.refreshToken,
      expiresAt,
    );

    return this.buildAuthResponse(existingUser, tokens);
  }

  async selectWorkspace(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace.');
    }

    const user = await this.usersService.findById(userId);

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
  async refresh(payload: JwtPayload, dto: RefreshTokenDto) {
    const user = await this.usersService.findByIdWithMemberShips(payload.id);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Find and validate the refresh-token session
    const storedToken = await this.refreshTokenService.validate(
      user.id,
      dto.refreshToken,
    );

    let tokens;

    // If this refresh token belongs to a workspace session,
    // verify that the membership still exists.
    if (payload.workspaceId) {
      const membership = user.memberships.find(
        (membership) => membership.workspaceId === payload.workspaceId,
      );

      if (!membership) {
        throw new UnauthorizedException(
          'Workspace membership is no longer valid.',
        );
      }

      tokens = await this.tokenService.generateToken(
        user.id,
        user.email,
        membership.workspaceId,
        membership.role,
      );
    } else {
      // User has no selected workspace.
      tokens = await this.tokenService.generateToken(user.id, user.email);
    }

    // Rotate refresh token:
    // old token can no longer be used.
    await this.refreshTokenService.revoke(storedToken.id);

    // Store the new refresh token.
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenService.create(
      user.id,
      tokens.refreshToken,
      expiresAt,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
  async logout(userId: string) {
    await this.refreshTokenService.revokeAll(userId);
    return {
      message: 'Logged out successfully',
    };
  }

  async me(userId: string) {
    return this.usersService.findById(userId);
  }

  private async createUser(dto: RegisterDto, passwordHash: string) {
    const data = {
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    };

    const user = await this.prisma.user.create({
      data,
    });

    return user;
  }

  private buildAuthResponse(
    user: User,
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
      tokens,
    };
  }
}
