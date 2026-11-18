import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CreateReportDto } from './dto/create-reports.dto';

const USER_PREVIEW = { select: { id: true, username: true, displayName: true } } as const;

// Что показываем модератору вместе с жалобой. Одна константа на список и на одну жалобу.
const REPORT_INCLUDE = {
    reporter: USER_PREVIEW,   // кто пожаловался
    targetUser: USER_PREVIEW, // на кого
    comment: {
        select: {
            id: true,
            content: true,
            author: USER_PREVIEW,
        },
    },
    poem: { select: { id: true, title: true } },
} satisfies Prisma.ReportInclude;

// Цель жалобы, найденная по type + targetId
interface ReportTarget {
    authorId: string;          // автор комментария/стиха → targetUserId
    poemId: string;            // стих (для жалобы на комментарий — стих, под которым он)
    commentId: string | null;  // только для жалобы на комментарий
}

@Injectable()
export class ReportsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: NotificationsService) {}

    async createReport(dto: CreateReportDto, reporterId: string) {
        const target = await this.findTarget(dto);

        if (target.authorId === reporterId) {
            throw new BadRequestException(
                dto.type === 'POEM' ? 'You cannot report your own poem' : 'You cannot report your own comment',
            );
        }

        // Повтор жалобы на стих проверяем здесь: уникальный индекс [reporterId, poemId]
        // в схеме сделать нельзя — у жалоб на комментарии тоже заполнен poemId.
        // Повтор жалобы на комментарий ловит @@unique([reporterId, commentId]) → P2002 ниже.
        if (dto.type === 'POEM') {
            const existing = await this.prisma.report.findFirst({
                where: { type: 'POEM', reporterId, poemId: target.poemId },
                select: { id: true },
            });
            if (existing) throw new ConflictException('You have already reported this poem');
        }

        try {
            const report = await this.prisma.report.create({
                data: {
                    type: dto.type,
                    reason: dto.reason,
                    reporterId,
                    targetUserId: target.authorId,
                    poemId: target.poemId,
                    commentId: target.commentId,
                },
            });

            await this.notifications.notifyModerators({
                type: 'REPORT_CREATED',
                actorId: reporterId,
                reportId: report.id,
                poemId: target.poemId,
                commentId: target.commentId,
            });

            return report;
        } catch (error) {
            if (this.isPrismaError(error, 'P2002')) {
                throw new ConflictException('You have already reported this comment');
            }
            throw error;
        }
    }

    async getReports(page = 1, limit = 20) {
        const safePage = Math.max(page, 1);
        const safeLimit = Math.min(Math.max(limit, 1), 50);

        return this.prisma.report.findMany({
            skip: (safePage - 1) * safeLimit,
            take: safeLimit,
            orderBy: { createdAt: 'desc' },
            include: REPORT_INCLUDE,
        });
    }

    async getReportById(id: string) {
        const report = await this.prisma.report.findUnique({
            where: { id },
            include: REPORT_INCLUDE,
        });
        if (!report) {
            throw new NotFoundException(`Report with id ${id} not found`);
        }
        return report;
    }

    async deleteReport(id: string) {
        const report = await this.prisma.report.findUnique({
            where: { id },
        });
        if (!report) {
            throw new NotFoundException(`Report with id ${id} not found`);
        }
        return this.prisma.report.delete({
            where: { id },
        });
    }

    /** Находит то, на что жалуются, по type + targetId. Нет такого → 404. */
    private async findTarget(dto: CreateReportDto): Promise<ReportTarget> {
        if (dto.type === 'COMMENT') {
            const comment = await this.prisma.comment.findUnique({
                where: { id: dto.targetId },
                select: { authorId: true, poemId: true },
            });
            if (!comment) {
                throw new NotFoundException(`Comment with id ${dto.targetId} not found`);
            }
            return { authorId: comment.authorId, poemId: comment.poemId, commentId: dto.targetId };
        }

        // POEM: жаловаться можно только на опубликованный стих (черновики никто не видит)
        const poem = await this.prisma.poem.findUnique({
            where: { id: dto.targetId, status: 'PUBLISHED' },
            select: { id: true, authorId: true },
        });
        if (!poem) {
            throw new NotFoundException(`Poem with id ${dto.targetId} not found`);
        }
        return { authorId: poem.authorId, poemId: poem.id, commentId: null };
    }

    private isPrismaError(error: unknown, code: string) {
        return (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === code
        );
    }
}
