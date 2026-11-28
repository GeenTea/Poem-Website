import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';
import { PasswordResetService } from './password-reset.service';
import { SessionsController } from './sessions/sessions.controller';
import { SessionsService } from './sessions/sessions.service';
@Module({
    imports: [
        UsersModule,
        JwtModule.register({
            global:true,
            secret:process.env.JWT_SECRET,
            signOptions:{
                expiresIn: '1h',
            },
        }),
        PrismaModule,
        MailModule,
    ],
    controllers:[AuthController, SessionsController],
    providers:[AuthService, PasswordResetService, SessionsService],
})
export class AuthModule {
}
