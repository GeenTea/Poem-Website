import {
    Controller,
    DefaultValuePipe,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guards';
import type { RequestWithUser } from 'src/auth/types/request-with-user';
import { NotificationsService } from './notifications.service';

// Уведомления приватные: пользователь берётся только из токена
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    findAll(
        @Req() req: RequestWithUser,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.notificationsService.findAll(req.user.sub, page, limit);
    }

    @Get('unread-count')
    unreadCount(@Req() req: RequestWithUser) {
        return this.notificationsService.unreadCount(req.user.sub);
    }

    @Patch('read-all')
    markAllRead(@Req() req: RequestWithUser) {
        return this.notificationsService.markAllRead(req.user.sub);
    }

    @Patch(':id/read')
    markRead(@Req() req: RequestWithUser, @Param('id') id: string) {
        return this.notificationsService.markRead(id, req.user.sub);
    }
}
