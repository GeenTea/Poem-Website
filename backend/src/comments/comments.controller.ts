import { Controller, Req } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Get, Post, Body, Patch, Param, Delete, UseGuards} from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guards';
import type { RequestWithUser } from 'src/auth/types/request-with-user';
import { CreateCommentDto } from './dto/create-comments.dto';
import { UpdateCommentDto } from './dto/update-comments.dto';


@Controller('poems/:poemId/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Post()
    @UseGuards(AuthGuard)
    create(
        @Param('poemId') poemId: string,
        @Body() dto: CreateCommentDto,
        @Req() req: RequestWithUser,
    ){
        return this.commentsService.create(poemId, req.user.sub, dto);
    }

    @Patch(':commentId')
    @UseGuards(AuthGuard)
    update(
        @Param('poemId') poemId: string,
        @Param('commentId') commentId: string,
        @Body() dto: UpdateCommentDto,
        @Req() req: RequestWithUser,
    ){
        return this.commentsService.update(commentId, req.user.sub, poemId, dto);
    }

    @Delete(':commentId')
    @UseGuards(AuthGuard)
    delete(
        @Param('poemId') poemId: string,
        @Param('commentId') commentId: string,
        @Req() req: RequestWithUser,
    ){
        return this.commentsService.delete(commentId, req.user.sub, poemId);
    }

    @Get()
    findAll(@Param('poemId') poemId: string){
        return this.commentsService.findAll(poemId);
    }
}