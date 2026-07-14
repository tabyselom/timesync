import { Injectable } from '@nestjs/common';
import { Prisma, WorkspaceMember } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { Tx } from '../prisma/prisma.types';

@Injectable()
export class WorkspaceMembersService {

  constructor(private readonly prisma: PrismaService) {}

  async create(
   data: Prisma.WorkspaceMemberCreateInput,
   tx?: Tx,
  ): Promise<WorkspaceMember> {
    const db = tx ?? this.prisma;
    return db.workspaceMember.create({
      data,
    });
  }
}