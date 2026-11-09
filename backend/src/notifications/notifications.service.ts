import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const MAX_LIMIT = 50;

export interface NotifyInput {
    type: NotificationType;
    recipientId: string;
    actorId: string;
    poemId?: string | null;
    commentId?: string | null;
}

// Для этих типов действие можно отменить (unlike / unfollow) и повторить —
// держим не больше одного уведомления на пару «кто → что».
const TOGGLE_TYPES: NotificationType[] = ['POEM_LIKE', 'COMMENT_LIKE', 'FOLLOW'];

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Создаёт уведомление. Никогда не бросает исключение: если уведомление не
     * записалось, лайк/комментарий/подписка всё равно должны пройти.
     */
    async notify(input: NotifyInput) {
        if (input.recipientId === input.actorId) return; // себе не уведомляем

        const data = {
            type: input.type,
            recipientId: input.recipientId,
            actorId: input.actorId,
            poemId: input.poemId ?? null,
            commentId: input.commentId ?? null,
        };

        try {
            if (TOGGLE_TYPES.includes(input.type)) {
                await this.prisma.$transaction([
                    this.prisma.notification.deleteMany({ where: data }),
                    this.prisma.notification.create({ data }),
                ]);
            } else {
                await this.prisma.notification.create({ data });
            }
        } catch (error) {
            this.logger.error(`Failed to create ${input.type} notification`, error);
        }
    }

    /** Убирает уведомление, когда действие отменили (unlike, unfollow). */
    async retract(input: NotifyInput) {
        try {
            await this.prisma.notification.deleteMany({
                where: {
                    type: input.type,
                    recipientId: input.recipientId,
                    actorId: input.actorId,
                    poemId: input.poemId ?? null,
                    commentId: input.commentId ?? null,
                },
            });
        } catch (error) {
            this.logger.error(`Failed to retract ${input.type} notification`, error);
        }
    }

    async findAll(userId: string, page = 1, limit = 20) {
        const safePage = Math.max(page, 1);
        const take = Math.min(Math.max(limit, 1), MAX_LIMIT);

        // Берём на одну запись больше, чтобы понять, есть ли следующая страница
        const rows = await this.prisma.notification.findMany({
            where: { recipientId: userId },
            orderBy: { createdAt: 'desc' },
            skip: (safePage - 1) * take,
            take: take + 1,
            select: {
                id: true,
                type: true,
                readAt: true,
                createdAt: true,
                actor: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true },
                },
                poem: { select: { id: true, title: true } },
                comment: { select: { id: true, content: true, poemId: true } },
            },
        });

        return {
            items: rows.slice(0, take),
            page: safePage,
            hasMore: rows.length > take,
        };
    }

    async unreadCount(userId: string) {
        const count = await this.prisma.notification.count({
            where: { recipientId: userId, readAt: null },
        });
        return { count };
    }

    async markRead(id: string, userId: string) {
        const { count } = await this.prisma.notification.updateMany({
            where: { id, recipientId: userId, readAt: null },
            data: { readAt: new Date() },
        });

        if (count === 0) {
            // Либо уже прочитано, либо чужое/несуществующее
            const exists = await this.prisma.notification.findFirst({
                where: { id, recipientId: userId },
                select: { id: true },
            });
            if (!exists) throw new NotFoundException('Notification not found');
        }

        return { ok: true };
    }

    async markAllRead(userId: string) {
        const { count } = await this.prisma.notification.updateMany({
            where: { recipientId: userId, readAt: null },
            data: { readAt: new Date() },
        });
        return { updated: count };
    }
}
