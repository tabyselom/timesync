import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, WorkspaceMember, WorkspaceRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

import { Tx } from '../prisma/prisma.types';

import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { transferOwnership } from './dto/transfer-ownership.dto';

@Injectable()
export class WorkspaceMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async create(
    data: Prisma.WorkspaceMemberCreateInput,
    tx?: Tx,
  ): Promise<WorkspaceMember> {
    const db = tx ?? this.prisma;
    return db.workspaceMember.create({
      data,
    });
  }

   async listMember(workspaceId:string, userId: string) {
    const workspace = await this.workspacesService.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('No Workspace found with this id.');
    }

    const member = await this.findMembership(workspaceId, userId);

    if (!member) {
      throw new NotFoundException('User is not a member of this workspace.');
    }

    return this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        role: true,
        createdAt: true,
      },
    });
  }


  async invite(workspaceId: string, dto: InviteMemberDto) {
    const workspace = await this.workspacesService.findById(workspaceId);

    if (!workspace) {
      throw new NotFoundException('No Workspace found with this id.');
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('No user found with this email.');
    }

    const existingMembership = await this.findMembership(
      workspaceId,user.id    );

    if (existingMembership) {
      throw new ConflictException(
        'User is already a member of this workspace.',
      );
    }

    const data = {
      role: dto.role,
      user: {
        connect: {
          id: user.id,
        },
      },
      workspace: {
        connect: {
          id: workspaceId,
        },
      },
    };

    const member = await this.create(data);
    return {
      message: 'Member invited successfully.',
      member,
    };
  }

  async leaveWorkspace(workspaceId: string, user: JwtPayload) {
    const workspace = await this.workspacesService.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('No Workspace found with this id.');
    }
    const member = await this.findMembership(workspaceId, user.id);

    if (!member) {
      throw new NotFoundException('User is not a member of this workspace.');
    }
    if (member.role === WorkspaceRole.OWNER) {
      const count = await this.ownerCount(workspaceId);

      if (count <= 1) {
        throw new ConflictException(
          ' You are the last owner.Transfer ownership before leaving the workspace.',
        );
      }
    }

    await this.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    return {
      message: 'You have successfully left the workspace.',
    };
  }

  async transferOwnership(
    workspaceId: string,
    user: JwtPayload,
    dto: transferOwnership,
  ) {
    const workspace = await this.workspacesService.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('No Workspace found with this id.');
    }
    const currentUser = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!currentUser || currentUser.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Only workspace owners can transfer ownership.',
      );
    }

    const member = await this.findMembership(workspaceId, dto.newOwnerId);

    if (!member) {
      throw new NotFoundException('user is not member of this work space');
    }

    if (member.role == WorkspaceRole.OWNER) {
      throw new ConflictException('member is already Owner ');
    }

    return this.changeOwnership(workspaceId, dto.newOwnerId, user.id);
  }

 async deleteMembership(user: JwtPayload, workspaceId: string, userId: string) {

  if (user.id === userId) {
    throw new ConflictException('Use the leave workspace endpoint instead.');
  } 

    const workspace = await this.workspacesService.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('No Workspace found with this id.');
    }

    const member = await this.findMembership(workspaceId, user.id);

    if (!member) {
      throw new NotFoundException('You are not a member of this workspace.');
    }

    if (member.role === WorkspaceRole.MANAGER || member.role === WorkspaceRole.MEMBER) {
      throw new ForbiddenException(
        'Only workspace owners and admins can delete memberships.',
      );
    }

    const targetMember = await this.findMembership(workspaceId, userId);

    if (!targetMember) {
      throw new NotFoundException('The specified user is not a member of this workspace.');
    }

    if (targetMember.role === WorkspaceRole.OWNER && member.role !== WorkspaceRole.OWNER) {
      throw new ConflictException('You cannot delete the membership of the workspace owner.');
    }

    await this.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    return {
      message: 'Membership deleted successfully.',
    };
  
 }

  async changeMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
    user: JwtPayload
  ) {

   

    if (role === WorkspaceRole.OWNER) {
      throw new ConflictException('Use the transfer ownership endpoint.');
    }
     if (user.id === userId) {
       throw new ConflictException('You cannot change your own role.');
     }
    const workspace = await this.workspacesService.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('No Workspace found with this id.');
    }

    const member = await this.findMembership(workspaceId, user.id);

    if (!member) {
      throw new NotFoundException('You are not a member of this workspace.');
    }

    if (member.role !== WorkspaceRole.OWNER
    ) {
      throw new ForbiddenException(
        'Only workspace owners  can change member roles.',
      );
    }

    const targetMember = await this.findMembership(workspaceId, userId);

    if (!targetMember) {
      throw new NotFoundException('The specified user is not a member of this workspace.');
    }
    if (targetMember.role === WorkspaceRole.OWNER) {
      throw new ConflictException('Use the transfer ownership endpoint.');
    }

    if(targetMember.role === role){
      throw new ConflictException('The specified user already has this role.');
    }


    await this.prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      data: {
        role,
      },
    });

    return {
      message: 'Member role changed successfully.',
      member
    };
  }
 
  async ownerCount(workspaceId: string) {
    return await this.prisma.workspaceMember.count({
      where: {
        workspaceId,
        role: WorkspaceRole.OWNER,
      },
    });
  }

  async findMembership(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
  }

  private async changeOwnership(
    workspaceId: string,
    newOwnerId: string,
    user: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.workspaceMember.update({
        where: {
          userId_workspaceId: {
            userId: newOwnerId,
            workspaceId,
          },
        },
        data: {
          role: WorkspaceRole.OWNER,
        },
      });

      await tx.workspaceMember.update({
        where: {
          userId_workspaceId: {
            userId: user,
            workspaceId,
          },
        },
        data: {
          role: WorkspaceRole.ADMIN,
        },
      });

      return {
        message: 'You have successfully transfer ownership',
      };
    });
  }
}
