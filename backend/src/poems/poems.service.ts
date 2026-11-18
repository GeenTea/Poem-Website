import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePoemDto } from './dto/create-poem.dto';
import { UpdatePoemDto } from './dto/update-poem.dto';
import { Prisma } from '../../generated/prisma/client';

// Форма стиха, которую отдают все эндпоинты (на фронте это PoemDto)
const poemPublicSelect = {
    id: true,
    title: true,
    content: true,
    status: true,
    viewCount: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
    hiddenById: true, // кто скрыл (null — не скрыт)
    hiddenAt: true,

    author: {
        select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
        },
    },

    tags: {
        select: {
            tag: { select: { name: true, slug: true } },
        },
    },

    _count: {
        select: { likes: true, comments: true },
    },
} satisfies Prisma.PoemSelect;

// Минимум полей, нужный для проверок прав и состояния
const poemAccessSelect = {
    id: true,
    authorId: true,
    status: true,
    hiddenById: true,
    publishedAt: true,
} satisfies Prisma.PoemSelect;

@Injectable()
export class PoemsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreatePoemDto, authorId: string) {
        return this.prisma.$transaction(async (tx) => {
            const tagIds = await this.resolveTagIds(tx, dto.tagSlugs ?? []);

            return tx.poem.create({
                data: {
                    title: dto.title,
                    content: dto.content,
                    status: dto.status,
                    authorId,
                    // Публикуем сразу — фиксируем дату публикации
                    publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
                    tags: { create: tagIds.map((tagId) => ({ tagId })) },
                },
                select: poemPublicSelect,
            });
        });
    }

    async update(id: string, dto: UpdatePoemDto, userId: string) {
        const poem = await this.findAccessOr404(id);

        if (poem.authorId !== userId) {
            throw new ForbiddenException('Only the author can edit this poem');
        }

        // Скрытый стих можно править (текст, теги), но вернуть его в ленту — только через unhide
        if (dto.status !== undefined && poem.status === 'ARCHIVED') {
            throw new BadRequestException('Cannot change the status of a hidden poem — unhide it first');
        }

        return this.prisma.$transaction(async (tx) => {
            const tagIds = dto.tagSlugs ? await this.resolveTagIds(tx, dto.tagSlugs) : undefined;

            return tx.poem.update({
                where: { id },
                data: {
                    title: dto.title,
                    content: dto.content,
                    status: dto.status,
                    // Первая публикация — ставим дату; при повторной публикации она сохраняется
                    ...(dto.status === 'PUBLISHED' && !poem.publishedAt && { publishedAt: new Date() }),
                    // Передали tagSlugs — заменяем набор тегов целиком
                    ...(tagIds && {
                        tags: {
                            deleteMany: {},
                            create: tagIds.map((tagId) => ({ tagId })),
                        },
                    }),
                },
                select: poemPublicSelect,
            });
        });
    }

    async hide(id: string, userId: string) {
        const poem = await this.findAccessOr404(id);

        if (poem.authorId !== userId && !(await this.isModerator(userId))) {
            throw new ForbiddenException('You cannot hide this poem');
        }
        if (poem.status === 'DRAFT') {
            throw new BadRequestException('A draft cannot be hidden');
        }
        if (poem.status === 'ARCHIVED') {
            throw new ConflictException('This poem is already hidden');
        }

        return this.prisma.poem.update({
            where: { id },
            data: { status: 'ARCHIVED', hiddenById: userId, hiddenAt: new Date() },
            select: poemPublicSelect,
        });
    }

    async unhide(id: string, userId: string) {
        const poem = await this.findAccessOr404(id);
        const isAuthor = poem.authorId === userId;
        const isModerator = await this.isModerator(userId);

        if (!isAuthor && !isModerator) {
            throw new ForbiddenException('You cannot unhide this poem');
        }
        // Скрытый = ARCHIVED + известно, кто скрыл
        if (poem.status !== 'ARCHIVED' || !poem.hiddenById) {
            throw new ConflictException('This poem is not hidden');
        }
        // Автор возвращает только то, что скрыл сам; скрытое модератором — только модератор/админ
        if (!isModerator && poem.hiddenById !== poem.authorId) {
            throw new ForbiddenException('This poem was hidden by a moderator');
        }

        return this.prisma.poem.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                hiddenById: null,
                hiddenAt: null,
                // publishedAt сохраняем; если его почему-то нет — ставим сейчас
                ...(!poem.publishedAt && { publishedAt: new Date() }),
            },
            select: poemPublicSelect,
        });
    }

    async findMine(userId: string) {
        return this.prisma.poem.findMany({
            where: { authorId: userId },
            orderBy: { updatedAt: 'desc' },
            select: poemPublicSelect,
        });
    }

    async findPrivate(id: string, userId: string) {
        const poem = await this.prisma.poem.findUnique({
            where: { id },
            select: poemPublicSelect,
        });

        // Автор видит любой свой стих; модератор/админ — только скрытые (чтобы их проверить).
        // Во всех остальных случаях 404, а не 403 — не выдаём, что такой черновик существует.
        if (poem) {
            if (poem.author.id === userId) return poem;
            if (poem.status === 'ARCHIVED' && (await this.isModerator(userId))) return poem;
        }
        throw new NotFoundException(`Poem with id ${id} not found`);
    }

    async findAll(tag?: string, q?: string) {
        const search = q?.trim();

        return this.prisma.poem.findMany({
            where: {
                status: 'PUBLISHED',
                ...(tag && {
                    tags: {
                        some: {
                            tag: { slug: tag },
                        },
                    },
                }),
                ...(search && {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { content: { contains: search, mode: 'insensitive' } },
                        { author: { username: { contains: search, mode: 'insensitive' } } },
                        { author: { displayName: { contains: search, mode: 'insensitive' } } },
                    ],
                }),
            },

            orderBy: {
                publishedAt: 'desc',
            },

            select: poemPublicSelect,
        });
    }

    // Публичная страница стиха: черновики и скрытые не отдаём
    async findOne(id: string) {
        const poem = await this.prisma.poem.findFirst({
            where: { id, status: 'PUBLISHED' },
            select: poemPublicSelect,
        });
        if (!poem) {
            throw new NotFoundException(`Poem with id ${id} not found`);
        }
        return poem;
    }

    async delete(id: string, userId: string) {
        const poem = await this.findAccessOr404(id);

        if (poem.authorId !== userId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
            if (user?.role !== 'ADMIN') {
                throw new ForbiddenException('Only the author or an admin can delete this poem');
            }
        }

        return this.prisma.poem.delete({
            where: { id },
        });
    }

    private async findAccessOr404(id: string) {
        const poem = await this.prisma.poem.findUnique({ where: { id }, select: poemAccessSelect });
        if (!poem) {
            throw new NotFoundException(`Poem with id ${id} not found`);
        }
        return poem;
    }

    // Роли нет в JWT — читаем из БД (так смена роли действует сразу, без перелогина)
    private async isModerator(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        return user?.role === 'MODERATOR' || user?.role === 'ADMIN';
    }

    // slug → id. Новые теги не создаём: неизвестный slug → 400
    private async resolveTagIds(tx: Prisma.TransactionClient, slugs: string[]): Promise<string[]> {
        if (slugs.length === 0) return [];

        const tags = await tx.tag.findMany({
            where: { slug: { in: slugs } },
            select: { id: true, slug: true },
        });

        if (tags.length !== slugs.length) {
            const known = new Set(tags.map((t) => t.slug));
            const unknown = slugs.filter((s) => !known.has(s));
            throw new BadRequestException(`Unknown tags: ${unknown.join(', ')}`);
        }
        return tags.map((t) => t.id);
    }
}
