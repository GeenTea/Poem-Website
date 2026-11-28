import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guards';
import type { RequestWithUser } from '../types/request-with-user';
import { SessionsService } from './sessions.service';

@Controller('auth/sessions')
@UseGuards(AuthGuard)
export class SessionsController {
    constructor(private readonly sessions: SessionsService) {}

    @Get()
    list(@Req() req: RequestWithUser) {
        return this.sessions.list(req.user.sub, req.user.sessionId);
    }

    // Все, кроме текущей
    @HttpCode(HttpStatus.OK)
    @Delete()
    revokeOthers(@Req() req: RequestWithUser) {
        return this.sessions.revokeOthers(req.user.sub, req.user.sessionId);
    }

    @HttpCode(HttpStatus.OK)
    @Delete(':id')
    revoke(@Req() req: RequestWithUser, @Param('id') id: string) {
        return this.sessions.revoke(req.user.sub, req.user.sessionId, id);
    }
}
