import { 
    Injectable,
    UnauthorizedException,
    ConflictException,
    NotFoundException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomBytes, createHash } from 'node:crypto';
import type { ClientInfo } from './client-info';

// Сколько живёт сессия (и refresh-токен)
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        ){}

    async register(dto: RegisterDto, client: ClientInfo){
        const existingUser = await this.usersService.findByEmail(dto.email)

        if(existingUser){
            throw new ConflictException('This email is exist');
        }

        // Занятый username раньше падал в базе с 500 — проверяем заранее и отвечаем 409
        const usernameTaken = await this.prisma.user.findUnique({
            where: { username: dto.username },
            select: { id: true },
        })
        if(usernameTaken){
            throw new ConflictException('This username is already taken');
        }

        const user = await this.usersService.create(dto)

        const {session, refreshToken} = await this.createSession(user.id, client)

        const accessToken = this.createAccessToken(
            user.id,
            session.id,
        )

        return{
            refreshToken,
            accessToken,
        }
    }

    async login(dto: LoginDto, client: ClientInfo){
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

        const { session, refreshToken } = await this.createSession(user.id, client)

        const accessToken = this.createAccessToken(
                user.id,
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

    async me(userId:string){
        const user = await this.prisma.user.findUnique({
            where:{
                id:userId
            },
            select:{
                id: true,
                displayName: true,
                avatarUrl:true,
                username:true,
                email:true,
                role:true,
            }
        })


        if(!user){
            throw new NotFoundException('User not found');
        }


        return user
    }









    /**
     * Новый accessToken по refreshToken той же сессии.
     * Refresh-токен НЕ меняем (без ротации): браузер часто шлёт несколько запросов сразу,
     * и при ротации второй запрос пришёл бы со старым, уже недействительным токеном —
     * пользователя бы «выкинуло». Защита держится на том, что токен в httpOnly-cookie,
     * живёт 30 дней и сессию можно закрыть (выход, «выйти на других устройствах», смена пароля).
     */
    async refresh(refreshToken: string) {
        const session = await this.prisma.session.findFirst({
            where: {
                refreshTokenHash: hashToken(refreshToken),
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            select: { id: true, userId: true },
        });

        if (!session) {
            throw new UnauthorizedException('Session expired. Please sign in again.');
        }

        await this.prisma.session.update({
            where: { id: session.id },
            data: { lastUsedAt: new Date() },
        });

        return { accessToken: this.createAccessToken(session.userId, session.id) };
    }

    /** Новая сессия + пара токенов — как при входе. Используется после смены пароля */
    async issueTokens(userId: string, client: ClientInfo) {
        const { session, refreshToken } = await this.createSession(userId, client);
        const accessToken = this.createAccessToken(userId, session.id);
        return { accessToken, refreshToken };
    }

    private createAccessToken(userId: string, sessionId: string): string{

        return this.jwtService.sign({
                sub: userId,
                sessionId,
            })
        
    }

    private async createSession(userId: string, client: ClientInfo){
        const refreshToken = randomBytes(64).toString('base64url');

        const refreshTokenHash = hashToken(refreshToken);

        const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

        const session = await this.prisma.session.create({
            data:{
                userId,
                refreshTokenHash,
                expiresAt,
                userAgent: client.userAgent,
                ip: client.ip,
            }
        })

        return{
            refreshToken,
            session,
        }
    }
}
