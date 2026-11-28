import {
    BadRequestException,
    ConflictException,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { unlink } from 'fs/promises';
import { basename, join } from 'path';
import { Prisma } from 'generated/prisma/client';
import { PoemStatus } from 'generated/prisma/enums';
import { AVATARS_DIR, AVATAR_URL_PREFIX } from 'src/common/uploads';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { emailChangeCodeEmail, emailChangedEmail, passwordChangedEmail } from 'src/mail/templates';
import {
    CODE_TTL_MINUTES,
    MAX_CODE_ATTEMPTS,
    RESEND_COOLDOWN_MS,
    codeMatches,
    expiresFromNow,
    generateCode,
    generateToken,
    hashCode,
    maskEmail,
    sha256,
} from 'src/common/codes';

const INVALID_CODE = 'Invalid or expired code';

/**
 * Настройки аккаунта текущего пользователя: пароль, почта, username.
 * sessionId — сессия, с которой пришёл запрос: её оставляем, остальные отзываем.
 */
@Injectable()
export class AccountService {
    private readonly logger = new Logger(AccountService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mail: MailService,
    ) {}

    // ==================== Пароль ====================

    async changePassword(userId: string, sessionId: string, currentPassword: string, newPassword: string) {
        const user = await this.getUser(userId);

        // 400, а не 401: 401 фронтенд понял бы как «сессия истекла, войдите заново»
        if (!(await argon2.verify(user.passwordHash, currentPassword))) {
            throw new BadRequestException('Current password is incorrect');
        }
        if (currentPassword === newPassword) {
            throw new BadRequestException('The new password must be different from the current one');
        }

        const now = new Date();
        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await argon2.hash(newPassword) } }),
            this.revokeOtherSessions(userId, sessionId, now),
        ]);

        this.notify(passwordChangedEmail(user.email, this.nameOf(user), now));
        return { ok: true };
    }

    // ==================== Username ====================

    async changeUsername(userId: string, username: string) {
        const user = await this.getUser(userId);
        if (user.username === username) {
            throw new BadRequestException('This is already your username');
        }

        try {
            return await this.prisma.user.update({
                where: { id: userId },
                data: { username },
                select: { id: true, username: true, displayName: true, bio: true, avatarUrl: true },
            });
        } catch (error) {
            // Уникальный индекс в БД — надёжнее предварительной проверки (нет гонки двух запросов)
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('This username is already taken');
            }
            throw error;
        }
    }

    // ==================== Почта: 3 шага ====================

    /** Шаг 1: код на ТЕКУЩУЮ почту (доказывает, что почтой владеет хозяин аккаунта) */
    async sendEmailCode(userId: string) {
        const user = await this.getUser(userId);

        const last = await this.prisma.emailChangeRequest.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
        });
        if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
            // Пользователь вошёл — раскрывать нечего, честно отвечаем 429
            throw new HttpException('Please wait a minute before requesting a new code', HttpStatus.TOO_MANY_REQUESTS);
        }

        const code = generateCode();
        await this.prisma.$transaction([
            this.prisma.emailChangeRequest.deleteMany({ where: { userId, usedAt: null } }),
            this.prisma.emailChangeRequest.create({
                data: { userId, codeHash: hashCode(code), expiresAt: expiresFromNow() },
            }),
        ]);

        await this.mail.send(emailChangeCodeEmail(user.email, this.nameOf(user), code, CODE_TTL_MINUTES));
        return { ok: true, email: maskEmail(user.email) };
    }

    /** Шаг 2: проверить код → одноразовый emailToken */
    async verifyEmailCode(userId: string, code: string) {
        const request = await this.prisma.emailChangeRequest.findFirst({
            where: { userId, usedAt: null, tokenHash: null },
            orderBy: { createdAt: 'desc' },
        });
        if (!request || request.expiresAt < new Date()) throw new BadRequestException(INVALID_CODE);

        // Сначала атомарно тратим попытку, потом сравниваем — лимит не обойти параллельными запросами
        const { count } = await this.prisma.emailChangeRequest.updateMany({
            where: { id: request.id, attempts: { lt: MAX_CODE_ATTEMPTS } },
            data: { attempts: { increment: 1 } },
        });
        if (count === 0 || !codeMatches(code, request.codeHash)) throw new BadRequestException(INVALID_CODE);

        const emailToken = generateToken();
        await this.prisma.emailChangeRequest.update({
            where: { id: request.id },
            data: { tokenHash: sha256(emailToken), expiresAt: expiresFromNow() },
        });
        return { emailToken };
    }

    /** Шаг 3: сменить почту по токену */
    async changeEmail(userId: string, sessionId: string, emailToken: string, newEmail: string) {
        const request = await this.prisma.emailChangeRequest.findUnique({
            where: { tokenHash: sha256(emailToken) },
        });
        // Токен должен принадлежать именно этому пользователю
        if (!request || request.userId !== userId || request.usedAt || request.expiresAt < new Date()) {
            throw new BadRequestException('This confirmation has expired. Please request a new code.');
        }

        const user = await this.getUser(userId);
        if (user.email.toLowerCase() === newEmail.toLowerCase()) {
            throw new BadRequestException('This is already your email');
        }

        // Почта уникальна без учёта регистра: «Eli@Test.dev» не должен стать вторым аккаунтом
        const taken = await this.prisma.user.findFirst({
            where: { email: { equals: newEmail, mode: 'insensitive' }, NOT: { id: userId } },
            select: { id: true },
        });
        if (taken) throw new ConflictException('This email is already used by another account');

        const now = new Date();
        try {
            await this.prisma.$transaction(async (tx) => {
                const { count } = await tx.emailChangeRequest.updateMany({
                    where: { id: request.id, usedAt: null },
                    data: { usedAt: now },
                });
                if (count === 0) throw new BadRequestException('This confirmation has already been used.');

                await tx.user.update({ where: { id: userId }, data: { email: newEmail } });
                await this.revokeOtherSessions(userId, sessionId, now, tx);
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('This email is already used by another account');
            }
            throw error;
        }

        // Письмо на СТАРУЮ почту — если адрес сменил не владелец, он об этом узнает
        this.notify(emailChangedEmail(user.email, this.nameOf(user), maskEmail(newEmail), now));
        return { email: newEmail };
    }

    // ==================== Мои данные ====================

    /** Все стихи пользователя (включая черновики и скрытые) одним Markdown-файлом */
    async exportPoems(userId: string) {
        const user = await this.getUser(userId);
        const poems = await this.prisma.poem.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: 'desc' },
            select: {
                title: true,
                content: true,
                status: true,
                hiddenById: true,
                publishedAt: true,
                createdAt: true,
                updatedAt: true,
                tags: { select: { tag: { select: { name: true } } } },
            },
        });

        const isoDate = (date: Date) => date.toISOString().slice(0, 10);
        const name = user.displayName ? `${user.displayName} (@${user.username})` : `@${user.username}`;
        const lines: string[] = [
            `# Poems by ${name}`,
            '',
            `Exported on ${isoDate(new Date())} · ${poems.length} ${poems.length === 1 ? 'poem' : 'poems'}`,
            '',
        ];

        if (poems.length === 0) {
            lines.push("You haven't written any poems yet — the page is still blank.", '');
        }

        for (const poem of poems) {
            const dates = [
                poem.publishedAt && `published ${isoDate(poem.publishedAt)}`,
                `created ${isoDate(poem.createdAt)}`,
                `updated ${isoDate(poem.updatedAt)}`,
            ].filter(Boolean);
            const tags = poem.tags.map((t) => t.tag.name);

            lines.push(
                '---',
                '',
                `## ${poem.title.replace(/\s+/g, ' ').trim() || 'Untitled'}`,
                '',
                `**${this.statusLabel(poem.status, poem.hiddenById, userId)}** · ${dates.join(' · ')}`,
                '',
            );
            if (tags.length > 0) lines.push(`Tags: ${tags.join(', ')}`, '');

            // Текст стиха кладём в «огороженный» блок (```text … ```): внутри него Markdown
            // сохраняет все переносы строк и не трогает символы вроде *, #, - в начале строки,
            // а в обычном текстовом редакторе стих читается как есть.
            // «Два пробела в конце строки» невидимы и легко теряются при сохранении,
            // а обратный слэш в конце каждой строки мешает читать файл как простой текст.
            // Ограду делаем длиннее самой длинной серии обратных кавычек в стихе — иначе она закроется раньше.
            const longestRun = Math.max(0, ...(poem.content.match(/`+/g) ?? []).map((run) => run.length));
            const fence = '`'.repeat(Math.max(3, longestRun + 1));
            lines.push(`${fence}text`, poem.content.replace(/\r\n?/g, '\n'), fence, '');
        }

        return lines.join('\n');
    }

    /**
     * Удалить аккаунт со всем содержимым. Все связи с User в schema.prisma — onDelete: Cascade
     * (стихи, комментарии, лайки, подписки, уведомления, жалобы, сессии…), а Poem.hiddenBy — SetNull,
     * поэтому одного delete достаточно: остальное PostgreSQL удалит сам в той же транзакции.
     */
    async deleteAccount(userId: string, password: string) {
        const user = await this.getUser(userId);
        // 400, а не 401 — как при смене пароля
        if (!(await argon2.verify(user.passwordHash, password))) {
            throw new BadRequestException('Password is incorrect');
        }

        const deleted = await this.prisma.$transaction((tx) =>
            tx.user.delete({ where: { id: userId }, select: { avatarUrl: true } }),
        );

        // Файл аватара — после транзакции: если удаление в БД не удалось, файл должен остаться
        if (deleted.avatarUrl?.startsWith(AVATAR_URL_PREFIX)) {
            await unlink(join(AVATARS_DIR, basename(deleted.avatarUrl))).catch(() => undefined);
        }
        return { ok: true };
    }

    // ==================== helpers ====================

    private statusLabel(status: PoemStatus, hiddenById: string | null, userId: string) {
        if (status === PoemStatus.PUBLISHED) return 'Published';
        if (status === PoemStatus.DRAFT) return 'Draft';
        return hiddenById && hiddenById !== userId ? 'Hidden by a moderator' : 'Hidden';
    }

    private async getUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, username: true, displayName: true, passwordHash: true },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    /** Отозвать все сессии пользователя, кроме текущей */
    private revokeOtherSessions(
        userId: string,
        sessionId: string,
        now: Date,
        db: Pick<PrismaService, 'session'> = this.prisma,
    ) {
        return db.session.updateMany({
            where: { userId, revokedAt: null, NOT: { id: sessionId } },
            data: { revokedAt: now },
        });
    }

    private nameOf(user: { displayName: string | null; username: string }) {
        return user.displayName || user.username;
    }

    /** Письмо-уведомление: ошибка отправки не должна отменять уже сделанную смену */
    private notify(message: Parameters<MailService['send']>[0]) {
        this.mail.send(message).catch((error) => this.logger.error('Failed to send notification email', error));
    }
}
