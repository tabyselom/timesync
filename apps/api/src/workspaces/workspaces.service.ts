import { Injectable } from '@nestjs/common';
import { Prisma, Workspace } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { Tx } from '../prisma/prisma.types';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.WorkspaceCreateInput, tx?: Tx): Promise<Workspace> {
    const db = tx ?? this.prisma;
    return db.workspace.create({
      data,
    });
  }

  async findById(id: string) {
    return this.prisma.workspace.findUnique({
      where: {
        id,
      },
    });
  }
}
