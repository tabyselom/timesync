import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { Tx } from '../prisma/prisma.types';
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserCreateInput, tx?: Tx): Promise<User> {
    const db = tx ?? this.prisma;
    return db.user.create({
      data,
    });
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: refreshToken,
      },
    });
  }

  async findByEmailWithMemberships(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });
  }

  async findByIdWithMemberShips(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });
  }
}
