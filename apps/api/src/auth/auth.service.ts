import { Injectable } from '@nestjs/common';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { UsersService } from '../users/users.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { WorkspaceMembersService } from '../workspace-members/workspace-members.service';
import { TokenService } from './token.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { EmailAlreadyExistsException } from '../common/exceptions/conflict.exception';

import { comparePassword, hashPassword } from '../common/utils/password.util';
import { generateSlug } from '../common/utils/slug.util';

import { User, Workspace, WorkspaceRole } from '@prisma/client';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { RefreshTokenDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly usersService: UsersService,

    private readonly workspacesService: WorkspacesService,

    private readonly workspaceMembersService: WorkspaceMembersService,

    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new EmailAlreadyExistsException();
    }

    const passwordHash = await hashPassword(dto.password);
    
     const user = await this.createUser(dto, passwordHash);



     const tokens = await this.tokenService.generateToken(
       user.id,
       user.email
     );

     const refreshTokenHash = await this.tokenService.hashRefreshToken(
       tokens.refreshToken,
     );
     await this.usersService.updateRefreshToken(
       user.id,
       refreshTokenHash,
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

    const memberShip = existingUser.memberships[0];
    let tokens ;
    if (memberShip){
           tokens = await this.tokenService.generateToken(
             existingUser.id,
             existingUser.email,
             memberShip.workspaceId,
             memberShip.role
           );
    }else{
      tokens = await this.tokenService.generateToken(
        existingUser.id,
        existingUser.email,
      );
    }

    

    const refreshTokenHash = await this.tokenService.hashRefreshToken(
      tokens.refreshToken,
    );
    await this.usersService.updateRefreshToken(
      existingUser.id,
      refreshTokenHash,
    );

    return this.buildAuthResponse(existingUser, tokens);
  }

  async refresh(payload: JwtPayload, dto: RefreshTokenDto) {
    const existingUser = await this.usersService.findByIdWithMemberShips(
      payload.id,
    );

    if (!existingUser || !existingUser.refreshTokenHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isRefreshTokenValid = await this.tokenService.compareRefreshToken(
      dto.refreshToken,
      existingUser.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const memberShip = existingUser.memberships[0];

    if (!memberShip) {
      throw new UnauthorizedException('User has no workspace membership');
    }
    const role = memberShip.role;
    const workspaceId = memberShip.workspaceId;

    const tokens = await this.tokenService.generateToken(
      existingUser.id,
      existingUser.email,
      workspaceId,
      role,
    );

    const refreshTokenHash = await this.tokenService.hashRefreshToken(
      tokens.refreshToken,
    );
    await this.usersService.updateRefreshToken(
      existingUser.id,
      refreshTokenHash,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, '');
    return {
      message: 'Logged out successfully',
    };
  }

  async me(userId: string) {
    return this.usersService.findById(userId);
  }

  private async createUser(dto: RegisterDto, passwordHash: string){
    const data = {
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    };

   const user= await this.prisma.user.create({
      data
    })

    return  user;
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
