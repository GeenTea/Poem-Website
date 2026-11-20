import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import  * as argon2  from 'argon2';
import { PoemStatus } from 'generated/prisma/enums';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { basename, join } from 'path';
import { randomBytes } from 'crypto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AVATARS_DIR, AVATAR_URL_PREFIX } from 'src/common/uploads';

// Что можно отдавать о пользователе наружу (без email и passwordHash)
const PUBLIC_USER_SELECT = {
    id: true,
    username: true,
    displayName: true,
    bio: true,
    avatarUrl: true,
} as const;

/** Загруженный файл из multer (memoryStorage) — нужные нам поля */
export interface UploadedImage {
    buffer: Buffer;
    size: number;
    mimetype: string;
}

/** Определяет тип картинки по сигнатуре файла. Не картинка → null */
function detectImageType(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
    if (buf.length < 12) return null;
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
    if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
    return null;
}

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateUserDto) {
        const hashedPassword = await argon2.hash(dto.password);

        return this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                passwordHash: hashedPassword,
                displayName: dto.displayName,
            },
    });
    };

    async update(id: string, dto: UpdateUserDto){
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user){
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return this.prisma.user.update({
            where: { id },
            data: {
                username: dto.username,
                email: dto.email,
                displayName: dto.displayName,
                passwordHash: dto.password ? await argon2.hash(dto.password) : undefined,
                avatarUrl: dto.avatarUrl,
                bio: dto.bio,
            },
        });
    }

    async delete(id: string){
        const user = await this.prisma.user.findUnique({
            where: {
                id,
            }
        });

        if (!user){
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return this.prisma.user.delete({
            where: {
                id,
            }
        });
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id }
        });

        if(!user){
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async someServiceMethod(email: string) {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }
        return user;
    }

    async findByUsername(username: string) {
        const user = await this.prisma.user.findUnique({
            where: { username }
        });

        if(!user){
            throw new NotFoundException(`User with username ${username} not found`);
        }

        return user;
    }

    async findAll() {
        return this.prisma.user.findMany();
    }

    /** Пропускает, если actor — сам пользователь или ADMIN; иначе 403 */
    async assertSelfOrAdmin(actorId: string, targetId: string) {
        if (actorId === targetId) return;
        const actor = await this.prisma.user.findUnique({
            where: { id: actorId },
            select: { role: true },
        });
        if (actor?.role !== 'ADMIN') {
            throw new ForbiddenException('You can only change your own account');
        }
    }

    // ==================== Свой профиль (/users/me) ====================

    async updateMyProfile(userId: string, dto: UpdateProfileDto) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                displayName: dto.displayName,
                // '' → null: пользователь стёр bio
                bio: dto.bio === undefined ? undefined : dto.bio || null,
            },
            select: PUBLIC_USER_SELECT,
        });
    }

    /**
     * Сохраняет новый аватар. Тип проверяем по первым байтам файла (сигнатуре),
     * а не по заголовку Content-Type — его клиент может подделать.
     */
    async updateMyAvatar(userId: string, file: UploadedImage | undefined) {
        if (!file) throw new BadRequestException('Choose an image file');

        const ext = detectImageType(file.buffer);
        if (!ext) throw new BadRequestException('Only JPG, PNG or WebP images are allowed');

        const current = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true },
        });
        if (!current) throw new NotFoundException('User not found');

        await mkdir(AVATARS_DIR, { recursive: true });
        const fileName = `${userId}-${randomBytes(6).toString('hex')}.${ext}`;
        await writeFile(join(AVATARS_DIR, fileName), file.buffer);

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: AVATAR_URL_PREFIX + fileName },
            select: PUBLIC_USER_SELECT,
        });

        // Старый аватар удаляем, только если он наш (загружен сюда же), а не внешняя ссылка
        if (current.avatarUrl?.startsWith(AVATAR_URL_PREFIX)) {
            const oldName = basename(current.avatarUrl);
            await unlink(join(AVATARS_DIR, oldName)).catch(() => undefined);
        }

        return user;
    }

    async getProfile(username:string){
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                createdAt:true,
            },
        });

        if(!user){
            throw new NotFoundException('User dont exist')
        }

        // Считаем явно. В схеме имена связей перевёрнуты: User.follower — это «на кого Я
        // подписан», а User.following — «кто подписан на МЕНЯ». Через _count легко перепутать.
        const [poems, likes, followers, following] = await this.prisma.$transaction([
            this.prisma.poem.count({ where: { authorId: user.id, status: PoemStatus.PUBLISHED } }),
            // Лайки на опубликованных стихах автора
            this.prisma.like.count({ where: { poem: { authorId: user.id, status: PoemStatus.PUBLISHED } } }),
            this.prisma.follow.count({ where: { followingId: user.id } }), // подписаны на него
            this.prisma.follow.count({ where: { followerId: user.id } }),  // он подписан
        ]);

        return { ...user, stats: { poems, likes, followers, following } }
    }
}
