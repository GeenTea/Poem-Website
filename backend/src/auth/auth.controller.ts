import { 
    Body, 
    Controller, 
    Post, 
    UseGuards,
    HttpCode,
    HttpStatus,
    Req,
    Get
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guards';
import { Request } from 'express';

export interface JwtPayload{
    sub: string;
    email: string;
    sessionId: string;
}

export interface RequestWithUser extends Request{
    user: JwtPayload
}


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

    @HttpCode(HttpStatus.OK)
    @Post('register')
    register(@Body() dto: RegisterDto){
        return this.authService.register(dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() dto: LoginDto){
        return this.authService.login(dto)
    }

    @HttpCode(HttpStatus.OK)
    @Post('/logout')
    @UseGuards(AuthGuard)
    logout(@Req() req: RequestWithUser){
        return this.authService.logout(
            req.user.sub,
            req.user.sessionId
        )
    }

    @Get('/me')
    @UseGuards(AuthGuard)
    me(@Req() req:RequestWithUser){
        return this.authService.me(req.user.sub)
    }
    
}
