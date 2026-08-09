import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { comparePassword, hashPassword } from 'src/common/utils/password.util';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, refreshToken: string, expiresAt: Date) {
    const tokenHash = await hashPassword(refreshToken);

    return this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
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
}
