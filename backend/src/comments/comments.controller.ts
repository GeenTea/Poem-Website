import { Controller, Req } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Get, Post, Body, Patch, Param, Delete, UseGuards} from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guards';
import type { RequestWithUser } from 'src/auth/types/request-with-user';
import { CreateCommentDto } from './dto/create-comments.dto';


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
}