import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';

const MAX_LIMIT = 50;

@Injectable()
export class LikesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: NotificationsService,
    ){}

    async addLike(poemId: string, userId: string) {
        const poem = await this.getPublishedPoem(poemId);

        try {
            const like = await this.prisma.like.create({
                data: { poemId, userId },
            });
            await this.notifications.notify({
                type: 'POEM_LIKE',
                recipientId: poem.authorId,
                actorId: userId,
                poemId,
            });
            return like;
        } catch (error) {
            if (this.isPrismaError(error, 'P2002')) {
                throw new ConflictException('You have already liked this poem');
            }
            throw error;
        }
    }

    async removeLike(poemId: string, userId: string) {
        const poem = await this.getPublishedPoem(poemId);

        try {
            const like = await this.prisma.like.delete({
                where: { poemId_userId: { poemId, userId } },
            });
            await this.notifications.retract({
                type: 'POEM_LIKE',
                recipientId: poem.authorId,
                actorId: userId,
                poemId,
            });
            return like;
        } catch (error) {
            if (this.isPrismaError(error, 'P2025')) {
                throw new NotFoundException('Like not found');
            }
            throw error;
        }
    }
 
    async showPoemLikesCount(poemId: string) {
        await this.getPublishedPoem(poemId);
 
        const count = await this.prisma.like.count({
            where: { poemId },
        });
 
        return { poemId, count };
    }
 
    // Список пользователей, лайкнувших стих. Доступен только автору стиха.
    async showPoemLikes(poemId: string, userId: string, page = 1, limit = 10) {
        const poem = await this.prisma.poem.findUnique({
            where: { id: poemId },
            select: { authorId: true },
        });
 
        if (!poem) {
            throw new NotFoundException(`Poem with id ${poemId} not found`);
        }
 
        if (poem.authorId !== userId) {
            throw new ForbiddenException('Only the author can see who liked this poem');
        }
 
        const { safePage, skip, take } = this.paginate(page, limit);
 
        const [items, total] = await this.prisma.$transaction([
            this.prisma.like.findMany({
                where: { poemId },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                select: {
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatarUrl: true,
                        },
                    },
                },
            }),
            this.prisma.like.count({ where: { poemId } }),
        ]);
 
        return { items, total, page: safePage, limit: take };
    }
 
    // Стихи, которые лайкнул сам пользователь. Приватно: userId берётся только из токена.
    async showUserLikes(userId: string, page = 1, limit = 10) {
        const { safePage, skip, take } = this.paginate(page, limit);
 
        const where: Prisma.LikeWhereInput = {
            userId,
            poem: { status: 'PUBLISHED' },
        };
 
        const [items, total] = await this.prisma.$transaction([
            this.prisma.like.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                select: {
                    createdAt: true,
                    poem: {
                        select: {
                            id: true,
                            title: true,
                            publishedAt: true,
                            author: {
                                select: {
                                    id: true,
                                    username: true,
                                    displayName: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.like.count({ where }),
        ]);
 
        return { items, total, page: safePage, limit: take };
    }
 
    // ==================== Лайки комментариев ====================
 
    async addLikeComment(poemId: string, commentId: string, userId: string) {
        const comment = await this.getCommentOnPublishedPoem(poemId, commentId);

        try {
            const like = await this.prisma.commentLike.create({
                data: { commentId, userId },
            });
            await this.notifications.notify({
                type: 'COMMENT_LIKE',
                recipientId: comment.authorId,
                actorId: userId,
                poemId,
                commentId,
            });
            return like;
        } catch (error) {
            if (this.isPrismaError(error, 'P2002')) {
                throw new ConflictException('You have already liked this comment');
            }
            throw error;
        }
    }
 
    async removeLikeComment(poemId: string, commentId: string, userId: string) {
        const comment = await this.getCommentOnPublishedPoem(poemId, commentId);

        try {
            const like = await this.prisma.commentLike.delete({
                where: { userId_commentId: { userId, commentId } },
            });
            await this.notifications.retract({
                type: 'COMMENT_LIKE',
                recipientId: comment.authorId,
                actorId: userId,
                poemId,
                commentId,
            });
            return like;
        } catch (error) {
            if (this.isPrismaError(error, 'P2025')) {
                throw new NotFoundException('Like not found');
            }
            throw error;
        }
    }








    private async getPublishedPoem(poemId: string) {
        const poem = await this.prisma.poem.findUnique({
            where: { id: poemId, status: 'PUBLISHED' },
        });
 
        if (!poem) {
            throw new NotFoundException(`Poem with id ${poemId} not found`);
        }
 
        return poem;
    }
 
    private async getCommentOnPublishedPoem(poemId: string, commentId: string) {
        await this.getPublishedPoem(poemId);
 
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId, poemId },
        });
 
        if (!comment) {
            throw new NotFoundException(`Comment with id ${commentId} not found`);
        }
 
        return comment;
    }
 
    private paginate(page: number, limit: number) {
        const safePage = Math.max(page, 1);
        const take = Math.min(Math.max(limit, 1), MAX_LIMIT);
        const skip = (safePage - 1) * take;
 
        return { safePage, skip, take };
    }
 
    private isPrismaError(error: unknown, code: string) {
        return (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === code
        );
    }

}