import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';
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
        PrismaModule
    ],
    controllers:[AuthController],
    providers:[AuthService],
})
export class AuthModule {
}
