import { 
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Req,
    UseGuards,
} from "@nestjs/common";
import { FollowsService } from "./follows.service";
import { AuthGuard } from "src/auth/guards/auth.guards";


@Controller('users/:id')
export class FollowController{
    constructor(private readonly followsService:FollowsService){}

    @UseGuards(AuthGuard)
    @Post('follow')
    follow(
        @Req() req,
        @Param('id') targetId: string
    ){
        return this.followsService.startFollow(req.user.sub, targetId);
    }

    @UseGuards(AuthGuard)
    @Delete('follow')
    unfollow(
        @Req() req,
        @Param('id') targetId: string
    ){
        return this.followsService.unfollow(req.user.sub, targetId)
    }

    @Get('followers')
    followers(@Param('id') id: string) {
        return this.followsService.getFollowers(id);
    }

    @Get('following')
    following(@Param('id') id: string) {
        return this.followsService.getFollowing(id);
    }
}