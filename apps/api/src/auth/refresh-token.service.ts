import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { comparePassword, hashPassword } from 'src/common/utils/password.util';
import { RefreshToken } from '@prisma/client';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
    workspaceId?: string,
  ) {
    const tokenHash = await hashPassword(refreshToken);

    return this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        workspaceId,
      },
    });
  }

  async validate(userId: string, refreshToken: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    for (const token of tokens) {
      const isValid = await comparePassword(refreshToken, token.tokenHash);

      if (isValid) {
        return token;
      }
    }

    throw new UnauthorizedException('Invalid or expired refresh token.');
  }

  async validateAndDetectReuse(userId: string, refreshToken: string) {
    const token = await this.findToken(userId, refreshToken);

    if (token.revokedAt) {
      // Possible token theft/reuse.
      await this.revokeAll(userId);

      throw new UnauthorizedException(
        'Refresh token reuse detected. All sessions have been revoked.',
      );
    }

    if (token.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token has expired.');
    }

    return token;
  }

  async revoke(tokenId: string) {
    return this.prisma.refreshToken.update({
      where: {
        id: tokenId,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAll(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async findToken(userId: string, refreshToken: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
      },
    });

    for (const token of tokens) {
      const valid = await comparePassword(refreshToken, token.tokenHash);

      if (valid) {
        return token;
      }
    }

    throw new UnauthorizedException('Invalid refresh token.');
  }

  async detectReuse(token: RefreshToken) {
    if (!token.revokedAt) {
      return false;
    }

    return true;
  }

  async markReplaced(oldTokenId: string, newTokenId: string) {
    return this.prisma.refreshToken.update({
      where: {
        id: oldTokenId,
      },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: newTokenId,
      },
    });
  }

  async getActiveSessions(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        workspaceId: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.refreshToken.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    await this.prisma.refreshToken.update({
      where: {
        id: session.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'Session revoked successfully.',
    };
  }
  
}
