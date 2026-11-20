import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { passwordChangedEmail, resetCodeEmail } from 'src/mail/templates';
import { AuthService } from './auth.service';

const CODE_TTL_MINUTES = 15;      // сколько живёт код и resetToken
const MAX_ATTEMPTS = 5;           // неверных вводов кода, потом код сгорает
const RESEND_COOLDOWN_MS = 60_000; // не чаще одного письма в минуту

// Одна и та же ошибка для «нет такого email», «неверный код», «код истёк», «попытки кончились»:
// по ответу нельзя понять, что именно не так — и есть ли вообще такой аккаунт.
const INVALID_CODE = 'Invalid or expired code';

/**
 * Восстановление пароля в 3 шага:
 *   1. forgot(email)        → письмо с 6-значным кодом
 *   2. verify(email, code)  → одноразовый resetToken
 *   3. reset(token, pass)   → новый пароль, все старые сессии отозваны, выдаём новые токены
 */
@Injectable()
export class PasswordResetService {
    private readonly logger = new Logger(PasswordResetService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mail: MailService,
        private readonly auth: AuthService,
    ) {}

    // ---------- Шаг 1 ----------
    async forgot(email: string) {
        const user = await this.findUserByEmail(email);

        // Аккаунта нет — отвечаем так же, как если бы письмо ушло
        if (!user) return { ok: true };

        // Слишком часто — молча не отправляем (ошибка 429 выдала бы, что аккаунт существует)
        const last = await this.prisma.passwordReset.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
        });
        if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) return { ok: true };

        // Новый код отменяет все прежние незавершённые заявки
        const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
        await this.prisma.$transaction([
            this.prisma.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } }),
            this.prisma.passwordReset.create({
                data: {
                    userId: user.id,
                    codeHash: this.hashCode(code),
                    expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
                },
            }),
        ]);

        try {
            await this.mail.send(resetCodeEmail(user.email, user.displayName || user.username, code, CODE_TTL_MINUTES));
        } catch (error) {
            // Не говорим клиенту — иначе снова выдали бы, что аккаунт есть
            this.logger.error('Failed to send password reset email', error);
        }

        return { ok: true };
    }

    // ---------- Шаг 2 ----------
    async verify(email: string, code: string) {
        const user = await this.findUserByEmail(email);
        if (!user) throw new BadRequestException(INVALID_CODE);

        const reset = await this.prisma.passwordReset.findFirst({
            where: { userId: user.id, usedAt: null, resetTokenHash: null },
            orderBy: { createdAt: 'desc' },
        });
        if (!reset || reset.expiresAt < new Date()) throw new BadRequestException(INVALID_CODE);

        // Сначала атомарно «тратим» попытку, потом сравниваем. Так даже параллельные запросы
        // не смогут сделать больше MAX_ATTEMPTS проверок одного кода.
        const { count } = await this.prisma.passwordReset.updateMany({
            where: { id: reset.id, attempts: { lt: MAX_ATTEMPTS } },
            data: { attempts: { increment: 1 } },
        });
        if (count === 0 || !this.codeMatches(code, reset.codeHash)) {
            throw new BadRequestException(INVALID_CODE);
        }

        // Код верный → одноразовый токен на смену пароля (в БД — только его хэш)
        const resetToken = randomBytes(32).toString('base64url');
        await this.prisma.passwordReset.update({
            where: { id: reset.id },
            data: {
                resetTokenHash: sha256(resetToken),
                expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
            },
        });

        return { resetToken };
    }

    // ---------- Шаг 3 ----------
    async reset(resetToken: string, password: string) {
        const reset = await this.prisma.passwordReset.findUnique({
            where: { resetTokenHash: sha256(resetToken) },
            include: { user: { select: { id: true, email: true, username: true, displayName: true } } },
        });
        if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
            throw new BadRequestException('This reset link has expired. Please start again.');
        }

        const passwordHash = await argon2.hash(password);
        const now = new Date();

        await this.prisma.$transaction(async (tx) => {
            // Закрываем заявку; usedAt: null в условии — защита от двойного использования токена
            const { count } = await tx.passwordReset.updateMany({
                where: { id: reset.id, usedAt: null },
                data: { usedAt: now },
            });
            if (count === 0) throw new BadRequestException('This reset link has already been used.');

            await tx.user.update({ where: { id: reset.userId }, data: { passwordHash } });

            // Выходим со всех устройств: кто знал старый пароль, больше не сможет обновить токен
            await tx.session.updateMany({
                where: { userId: reset.userId, revokedAt: null },
                data: { revokedAt: now },
            });
        });

        // Новая сессия на этом устройстве — пользователь сразу вошёл
        const tokens = await this.auth.issueTokens(reset.userId);

        const { user } = reset;
        this.mail
            .send(passwordChangedEmail(user.email, user.displayName || user.username, now))
            .catch((error) => this.logger.error('Failed to send password changed email', error));

        return tokens;
    }

    // ---------- helpers ----------

    // Email без учёта регистра: «Eli@Test.dev» и «eli@test.dev» — один аккаунт
    private findUserByEmail(email: string) {
        return this.prisma.user.findFirst({
            where: { email: { equals: email.trim(), mode: 'insensitive' } },
            select: { id: true, email: true, username: true, displayName: true },
        });
    }

    // HMAC с секретом сервера: даже если база утечёт, 6-значные коды нельзя перебрать
    // без секрета (простой sha256 из миллиона вариантов подбирается за секунду).
    private hashCode(code: string) {
        return createHmac('sha256', process.env.JWT_SECRET ?? '').update(code).digest('hex');
    }

    // Сравнение за постоянное время — по скорости ответа нельзя угадать совпавшие символы
    private codeMatches(code: string, codeHash: string) {
        const a = Buffer.from(this.hashCode(code), 'hex');
        const b = Buffer.from(codeHash, 'hex');
        return a.length === b.length && timingSafeEqual(a, b);
    }
}

function sha256(value: string) {
    return createHash('sha256').update(value).digest('hex');
}
