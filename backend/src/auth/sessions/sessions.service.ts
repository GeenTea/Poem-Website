import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { describeUserAgent } from './user-agent';

/** «Активные сеансы»: где пользователь сейчас вошёл, и выход на других устройствах */
@Injectable()
export class SessionsService {
    constructor(private readonly prisma: PrismaService) {}

    // Активная сессия = не отозвана и не истекла
    private activeWhere(userId: string) {
        return { userId, revokedAt: null, expiresAt: { gt: new Date() } };
    }

    async list(userId: string, currentSessionId: string) {
        const sessions = await this.prisma.session.findMany({
            where: this.activeWhere(userId),
            orderBy: { lastUsedAt: 'desc' },
            select: { id: true, userAgent: true, ip: true, createdAt: true, lastUsedAt: true },
        });

        return sessions.map((s) => {
            const { device, kind } = describeUserAgent(s.userAgent);
            return {
                id: s.id,
                device,
                kind,
                ip: s.ip,
                createdAt: s.createdAt,
                lastUsedAt: s.lastUsedAt,
                current: s.id === currentSessionId,
            };
        });
    }

    async revoke(userId: string, currentSessionId: string, sessionId: string) {
        // Текущую сессию закрывают через обычный выход (он ещё и cookie чистит)
        if (sessionId === currentSessionId) {
            throw new BadRequestException('Use logout to sign out of the current session');
        }

        // userId в условии: чужую сессию «не найдём» — 404, а не 403, чтобы не выдавать, что она есть
        const { count } = await this.prisma.session.updateMany({
            where: { ...this.activeWhere(userId), id: sessionId },
            data: { revokedAt: new Date() },
        });
        if (count === 0) throw new NotFoundException('Session not found');

        return { ok: true };
    }

    async revokeOthers(userId: string, currentSessionId: string) {
        const { count } = await this.prisma.session.updateMany({
            where: { ...this.activeWhere(userId), id: { not: currentSessionId } },
            data: { revokedAt: new Date() },
        });
        return { revoked: count };
    }
}
