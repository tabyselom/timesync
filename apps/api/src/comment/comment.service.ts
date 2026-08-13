import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create_comment.dto';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { UpdateCommentDto } from './dto/update_comment.dto';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class CommentService {
    constructor (
         private readonly prisma: PrismaService,
    ){}

    async create(taskId:string,dto:CreateCommentDto,user:JwtPayload){
        const task = await this.prisma.task.findUnique({
            where:{id:taskId,deletedAt:null},
            select:{
                title:true,
                project:{
                    select:{
                        workspaceId:true
                    }
                },
                
            }
        })
        if(!task){
            throw new NotFoundException('Task not found');
        }

        if (!task.project) {
          throw new NotFoundException(
            'Project associated with this task not found',
          );
        }
        

        const member = await this.prisma.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              workspaceId: task.project.workspaceId,
              userId: user.id,
            },
          },
        });

        if (!member) {
          throw new ForbiddenException(
            "You don't have permission to comment on this task",
          );
        }

        const comment = await this.prisma.comment.create({
            data:{
                content:dto.content,
                userId:user.id,
                taskId
            }

        })

        return {
          message: 'Comment created successfully',
          comment: comment.content,
          author: user.email,
          task: task.title,
        };

    }

    async list(taskId:string,user:JwtPayload){
        const task =await this.prisma.task.findUnique({
            where:{id:taskId,deletedAt:null},
            select:{
                title:true,
                project:{
                    select:{
                        workspaceId:true
                    }
                }
            }
        })
        if(!task){
            throw new NotFoundException('Task not found');
        }

        if(!task.project){
            throw new NotFoundException('Project associated with this task not found');
        }

        if(task.project.workspaceId !== user.workspaceId){
            throw new ForbiddenException("You don't have permission to view comments on this task")
        }
        
        const comments = await this.prisma.comment.findMany({
            where:{
                taskId,
                deletedAt:null
            },
            select:{
                id:true,
                content:true,
                createdAt:true,
                user:{
                    select:{
                        email:true,
                        firstName:true,
                        lastName:true
                    }
                }
            }
        });

        if (!comments) {
          throw new NotFoundException('Comments not found');
        }


        return {
            comments
        }


    }

    async getComment(commentId:string,user:JwtPayload){
        const comment = await this.prisma.comment.findUnique({
            where:{id:commentId,deletedAt:null},
            select:{
                id:true,
                content:true,
                createdAt:true,
                user:{
                    select:{
                        id:true,
                        email:true,
                        firstName:true,
                        lastName:true
                    }}
            }
        })
        if(!comment){
            throw new NotFoundException('Comment not found');
        }
        if(comment.user.id !== user.id){
            throw new ForbiddenException("you don't have permission to view comments on this task")
        }

        return {
            comment
        }
    }

    async updateComment(taskId:string,commentId:string,dto:UpdateCommentDto,user:JwtPayload){
        const comment = await this.prisma.comment.findUnique({
            where:{id:commentId,deletedAt:null,taskId},
            select:{
                id:true,
                content:true,
                createdAt:true,
                user:{
                    select:{
                        id:true,
                        email:true,
                        firstName:true,
                        lastName:true
                    }}
            }
        })

        if(!comment){
            throw new NotFoundException('Comment not found');
        }
        if(comment.user.id !== user.id){
            throw new ForbiddenException("you don't have permission to edit comments on this task")
        }
        const updatedComment = await this.prisma.comment.update({
            where:{id:commentId},
            data:{
                content:dto.content,
                updatedAt:new Date()
            },
            select:{
                id:true,
                content:true,
                updatedAt:true,
                createdAt:true,
                user:{
                    select:{
                        id:true,
                        email:true,
                        firstName:true,
                        lastName:true
                    }}
            }
        })

        return {
            message:'Comment updated successfully',
            comment:updatedComment
        }
    }

    async deleteComment(taskId:string,commentId:string,user:JwtPayload){
        const comment = await this.prisma.comment.findUnique({
            where:{id:commentId,deletedAt:null,taskId},
            select:{
                id:true,
                content:true,
                createdAt:true,
                user:{
                    select:{
                        id:true,
                        email:true,
                        firstName:true,
                        lastName:true
                    }}
            }
        })

        if(!comment){
            throw new NotFoundException('Comment not found');
        }

        if(user.role !== WorkspaceRole.ADMIN && user.role !== WorkspaceRole.OWNER && comment.user.id !== user.id){
            throw new ForbiddenException("you don't have permission to delete comments on this task")
        }

        await this.prisma.comment.update({
            where:{id:commentId},
            data:{
                deletedAt:new Date()
            }
        })

        return {
            message:'Comment deleted successfully'
        }

    }


}
