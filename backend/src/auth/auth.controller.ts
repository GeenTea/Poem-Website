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
import { PasswordResetService } from './password-reset.service';
import { ForgotPasswordDto, ResetPasswordDto, VerifyResetCodeDto } from './dto/password-reset.dto';

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
    constructor(
        private readonly authService: AuthService,
        private readonly passwordReset: PasswordResetService,
    ){}

    // ---------- Восстановление пароля (без входа) ----------

    // Шаг 1: отправить код на почту. Ответ всегда одинаковый — не раскрываем, есть ли аккаунт
    @HttpCode(HttpStatus.OK)
    @Post('password/forgot')
    forgotPassword(@Body() dto: ForgotPasswordDto){
        return this.passwordReset.forgot(dto.email);
    }

    // Шаг 2: проверить код → одноразовый resetToken
    @HttpCode(HttpStatus.OK)
    @Post('password/verify')
    verifyResetCode(@Body() dto: VerifyResetCodeDto){
        return this.passwordReset.verify(dto.email, dto.code);
    }

    // Шаг 3: новый пароль → новые токены (пользователь сразу вошёл)
    @HttpCode(HttpStatus.OK)
    @Post('password/reset')
    resetPassword(@Body() dto: ResetPasswordDto){
        return this.passwordReset.reset(dto.resetToken, dto.password);
    }

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
