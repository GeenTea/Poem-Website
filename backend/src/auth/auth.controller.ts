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
import type { Request } from 'express';
import type { RequestWithUser } from './types/request-with-user';
import { getClientInfo } from './client-info';
import { RefreshDto } from './dto/refresh.dto';

// Раньше типы жили здесь — оставляем реэкспорт для старых импортов (likes.controller)
export type { JwtPayload, RequestWithUser } from './types/request-with-user';
import { PasswordResetService } from './password-reset.service';
import { ForgotPasswordDto, ResetPasswordDto, VerifyResetCodeDto } from './dto/password-reset.dto';



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
    resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request){
        return this.passwordReset.reset(dto.resetToken, dto.password, getClientInfo(req));
    }

    @HttpCode(HttpStatus.OK)
    @Post('register')
    register(@Body() dto: RegisterDto, @Req() req: Request){
        return this.authService.register(dto, getClientInfo(req));
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() dto: LoginDto, @Req() req: Request){
        return this.authService.login(dto, getClientInfo(req))
    }

    // Новый accessToken по refreshToken (его присылает proxy.ts фронтенда, когда старый истекает)
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    refresh(@Body() dto: RefreshDto){
        return this.authService.refresh(dto.refreshToken)
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
