import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CurrentUser } from 'src/auth/decorators/current-user/current-user.decorator';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { CreateCommentDto } from './dto/create_comment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import path from 'path';
import { UpdateCommentDto } from './dto/update_comment.dto';

@Controller({
  path: 'tasks/:taskId/comments',
  version: '1',
})
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('')
  @UseGuards(JwtAuthGuard)
  createComment(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentService.create(taskId, dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getComment(@Param('taskId') taskId: string, @CurrentUser() user: JwtPayload) {
    return this.commentService.getComment(taskId, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  listComments(
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentService.list(taskId, user);
  }

  @Patch(':commentId')
  @UseGuards(JwtAuthGuard)
  updateComment(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCommentDto
    ){
        return this.commentService.updateComment(taskId,commentId,dto,user);

    }

    @Delete(':commentId')
    @UseGuards(JwtAuthGuard)
    deleteComment(
        @Param('commentId') commentId:string,
        @Param('taskId') taskId:string,
        @CurrentUser() user:JwtPayload){
        return this.commentService.deleteComment(taskId,commentId,user);
    }
}
