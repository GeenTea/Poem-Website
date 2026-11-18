import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guards';
import type { RequestWithUser } from 'src/auth/types/request-with-user';
import { CreatePoemDto } from './dto/create-poem.dto';
import { UpdatePoemDto } from './dto/update-poem.dto';
import { PoemsService } from './poems.service';

// Права «автор / модератор» зависят от конкретного стиха, поэтому проверяются в сервисе.
// Контроллер только требует вход (AuthGuard) и передаёт id пользователя из токена.
@Controller('poems')
export class PoemsController {
    constructor(private readonly poemsService: PoemsService) {}

    @UseGuards(AuthGuard)
    @Post()
    create(@Body() dto: CreatePoemDto, @Req() req: RequestWithUser) {
        return this.poemsService.create(dto, req.user.sub);
    }

    @Get('findall')
    findAll(@Query('tag') tag?: string, @Query('q') q?: string) {
        return this.poemsService.findAll(tag, q);
    }

    // Статические пути объявляем раньше путей с :id
    @UseGuards(AuthGuard)
    @Get('mine')
    findMine(@Req() req: RequestWithUser) {
        return this.poemsService.findMine(req.user.sub);
    }

    @Get('findPoem/:id')
    findOne(@Param('id') id: string) {
        return this.poemsService.findOne(id);
    }

    @UseGuards(AuthGuard)
    @Get(':id/private')
    findPrivate(@Param('id') id: string, @Req() req: RequestWithUser) {
        return this.poemsService.findPrivate(id, req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Patch(':id/hide')
    hide(@Param('id') id: string, @Req() req: RequestWithUser) {
        return this.poemsService.hide(id, req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Patch(':id/unhide')
    unhide(@Param('id') id: string, @Req() req: RequestWithUser) {
        return this.poemsService.unhide(id, req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePoemDto, @Req() req: RequestWithUser) {
        return this.poemsService.update(id, dto, req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Delete(':id')
    delete(@Param('id') id: string, @Req() req: RequestWithUser) {
        return this.poemsService.delete(id, req.user.sub);
    }
}
