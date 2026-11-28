import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import type { JwtPayload } from '../types/request-with-user';

// lastUsedAt обновляем не чаще раза в 5 минут — иначе каждый запрос писал бы в базу
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }

    // Подписи мало: токен живёт час, а сессию могли закрыть раньше (выход, «выйти на других
    // устройствах», смена пароля). Поэтому проверяем саму сессию в базе.
    const session = payload.sessionId
      ? await this.prisma.session.findUnique({
          where: { id: payload.sessionId },
          select: { userId: true, revokedAt: true, expiresAt: true, lastUsedAt: true },
        })
      : null;

    const now = Date.now();
    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt.getTime() <= now
    ) {
      throw new UnauthorizedException();
    }

    if (now - session.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
      // Не ждём ответа базы — запрос пользователя не должен из-за этого тормозить
      this.prisma.session
        .update({ where: { id: payload.sessionId }, data: { lastUsedAt: new Date(now) } })
        .catch((error) => this.logger.warn(`Failed to update lastUsedAt: ${error}`));
    }

    request['user'] = payload;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
