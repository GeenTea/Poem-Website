import { 
    Injectable, 
    BadRequestException,
    UnauthorizedException,
    ConflictException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomBytes, createHash } from 'node:crypto';
@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        ){}

    async register(dto: RegisterDto){
        const existingUser = await this.usersService.findByEmail(dto.email)

        if(existingUser){
            throw new ConflictException('This email is exist');
        }

        const user = await this.usersService.create(dto)

        const {session, refreshToken} = await this.createSession(user.id)

        const accessToken = this.createAccessToken(
            user.id,
            user.email,
            session.id,
        )

        return{
            refreshToken,
            accessToken,
        }
    }

    async login(dto: LoginDto){
        const user = await this.usersService.findByEmail(dto.email);

        if(!user){
            throw new UnauthorizedException('Invalid email or passoword')
        }

        const isPasswordValid = await argon2.verify(
            user.passwordHash,
            dto.password,
        )

        if(!isPasswordValid){
            throw new UnauthorizedException('Invalid email or password')
        }

        const { session, refreshToken } = await this.createSession(user.id)

        const accessToken = this.createAccessToken(
                user.id,
                user.email,
                session.id,
            )
        
        return {
            accessToken,
            refreshToken
        }
    }

    async logout(userId: string, sessionId: string){
         await this.prisma.session.update({
            where:{
                id: sessionId,
                userId,
                revokedAt:null
            },
            data:{
                revokedAt: new Date()
            }
        })

        return {
            message: 'Logged out successfully'
        }
    }

    private createAccessToken(userId: string, email:  string, sessionId: string): string{

        return this.jwtService.sign({
                sub: userId,
                email,
                sessionId,
            })
        
    }

    private async createSession(userId: string){
        const refreshToken = randomBytes(64).toString('base64url');

        const refreshTokenHash= createHash('sha256').update(refreshToken).digest('hex');

        const expiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
        );


        const session = await this.prisma.session.create({
            data:{
                userId,
                refreshTokenHash,
                expiresAt
            }
        })

        return{
            refreshToken,
            session,
        }
    }
}
