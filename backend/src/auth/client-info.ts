import type { Request } from 'express';

/** С какого устройства пришёл запрос — сохраняем в сессию при входе */
export interface ClientInfo {
    userAgent: string | null;
    ip: string | null;
}

// Браузер ходит к Next, а Next — к нам, поэтому настоящий User-Agent и IP пересылают
// route handlers фронтенда (User-Agent и X-Forwarded-For). Это только справочная
// информация для списка сеансов — на безопасность она не влияет, подделка ничего не даёт.
export function getClientInfo(req: Request): ClientInfo {
    const userAgent = req.headers['user-agent']?.slice(0, 512) || null;

    const forwarded = req.headers['x-forwarded-for'];
    const firstForwarded = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
        ?.split(',')[0]
        ?.trim();

    const ip = (firstForwarded || req.socket?.remoteAddress || '').slice(0, 64) || null;

    return { userAgent, ip };
}
