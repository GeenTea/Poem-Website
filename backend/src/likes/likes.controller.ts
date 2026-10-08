import { 
    Controller, 
    Get, 
    Post, 
    Delete, 
    Body, 
    Param, 
    Req, 
    Query, 
    DefaultValuePipe,
    ParseIntPipe, 
    UseGuards 
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { AuthGuard } from 'src/auth/guards/auth.guards';
import type { RequestWithUser } from 'src/auth/auth.controller';

@Controller()
export class LikesController {
    constructor(private readonly likesService:LikesService){}

    @Post('poems/:poemId/likes')
    @UseGuards(AuthGuard)
    addLike(
        @Param('poemId') poemId:string,
        @Req() req: RequestWithUser,
    ){
        return this.likesService.addLike(poemId, req.user.sub)
    }

    @Delete('poem/:poemId/likes')
    @UseGuards(AuthGuard)
    removeLike(
        @Param('poemId') poemId: string,
        @Req() req: RequestWithUser,
    ){
        return this.likesService.removeLike(poemId, req.user.sub)
    }

    @Get('poems/:poemId/likes/count')
    showPoemLikesCount(@Param('poemId') poemId: string){
        return this.likesService.showPoemLikesCount(poemId)
    }

    @Get('poems/:poemId/likes')
    @UseGuards(AuthGuard)
    showPoemLikes(
        @Param('poemId') poemId: string,
        @Req() req: RequestWithUser,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit:number,
    ){
        return this.likesService.showPoemLikes(poemId, req.user.sub,page,limit);
    }

    @Post('poems/:poemId/comments/:commentId/likes')
    @UseGuards(AuthGuard)
    addLikeComment(
        @Param('poemId') poemId:string,
        @Param('commentId') commentId: string,
        @Req() req: RequestWithUser,
    ){
        return this.likesService.addLikeComment(poemId, commentId, req.user.sub);
    }

    @Delete('poems/:poemId/comments/:commentId/Likes')
    @UseGuards(AuthGuard)
    removeLikeComment(
        @Param('poemId') poemId:string,
        @Param('commentId') commentId: string,
        @Req() req: RequestWithUser,
    ){
        return this.likesService.removeLikeComment(poemId, commentId, req.user.sub)
    }

    @Get('user/me/likes')
    @UseGuards(AuthGuard)
    showUserLikes(
        @Req() req: RequestWithUser,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit:number,
    ){
        return this.likesService.showUserLikes(req.user.sub, page, limit)
    }
}