import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

// Общие помощники для одноразовых кодов из писем (восстановление пароля, смена почты).

export const CODE_TTL_MINUTES = 15;      // сколько живёт код и выданный после него токен
export const MAX_CODE_ATTEMPTS = 5;      // неверных вводов, потом код сгорает
export const RESEND_COOLDOWN_MS = 60_000; // не чаще одного письма в минуту

/** Случайный 6-значный код, например "042917" */
export function generateCode() {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/**
 * HMAC с секретом сервера: даже если база утечёт, 6-значные коды нельзя перебрать
 * без секрета (простой sha256 из миллиона вариантов подбирается за секунду).
 */
export function hashCode(code: string) {
    return createHmac('sha256', process.env.JWT_SECRET ?? '').update(code).digest('hex');
}

/** Сравнение за постоянное время — по скорости ответа нельзя угадать совпавшие символы */
export function codeMatches(code: string, codeHash: string) {
    const a = Buffer.from(hashCode(code), 'hex');
    const b = Buffer.from(codeHash, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
}

/** Длинный случайный одноразовый токен (выдаётся после верного кода) */
export function generateToken() {
    return randomBytes(32).toString('base64url');
}

/** Хэш токена для хранения в БД (токен длинный и случайный — HMAC не нужен) */
export function sha256(value: string) {
    return createHash('sha256').update(value).digest('hex');
}

/** Срок годности кода/токена начиная с текущего момента */
export function expiresFromNow() {
    return new Date(Date.now() + CODE_TTL_MINUTES * 60_000);
}

/** "eli@test.dev" → "e***@test.dev" — показать, куда ушло письмо, не раскрывая адрес целиком */
export function maskEmail(email: string) {
    const [name, domain] = email.split('@');
    return `${name.slice(0, 1)}***@${domain}`;
}
