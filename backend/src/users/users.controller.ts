import { Controller, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService, type UploadedImage } from './users.service';
import { AuthGuard } from 'src/auth/guards/auth.guards';
import type { RequestWithUser } from 'src/auth/types/request-with-user';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 МБ

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('/create-user')
    create(@Body() dto: CreateUserDto){
        return this.usersService.create(dto);
    }

    // ---------- Свой профиль. Объявлены ДО '/:id', иначе 'me' считался бы id ----------

    // Имя и bio текущего пользователя
    @Patch('/me')
    @UseGuards(AuthGuard)
    updateMe(@Req() req: RequestWithUser, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateMyProfile(req.user.sub, dto);
    }

    // Новый аватар: multipart/form-data, поле "avatar".
    // multer держит файл в памяти (buffer) и сам отклоняет файлы больше лимита (413).
    @Post('/me/avatar')
    @UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: MAX_AVATAR_BYTES, files: 1 } }))
    updateMyAvatar(@Req() req: RequestWithUser, @UploadedFile() file?: UploadedImage) {
        return this.usersService.updateMyAvatar(req.user.sub, file);
    }

    // Изменить пользователя может только он сам или ADMIN
    @Patch('/:id')
    @UseGuards(AuthGuard)
    async update(@Req() req: RequestWithUser, @Param('id') id: string, @Body() dto:UpdateUserDto){
        await this.usersService.assertSelfOrAdmin(req.user.sub, id);
        return this.usersService.update(id, dto);
    }

    @Delete('/:id')
    @UseGuards(AuthGuard)
    async delete(@Req() req: RequestWithUser, @Param('id') id:string){
        await this.usersService.assertSelfOrAdmin(req.user.sub, id);
        return this.usersService.delete(id);
    }

    @Get('/find-all-users')
    findAll(){
        return this.usersService.findAll();
    }

    @Get('/find-id/:id')
    findOne(@Param('id') id: string){
        return this.usersService.findById(id)
    }

    @Get('/find-user/:username')
    findUsername(@Param('username') username: string){
        return this.usersService.findByUsername(username)
    }

    @Get('/find-user-by-email/:email')
    findEmail(@Param('email') email: string){
        return this.usersService.findByEmail(email)
    }

    @Get('/findsomemethod/:email')
    findsomeServiceMethod(@Param('email') email: string){
        return this.usersService.someServiceMethod(email)
    }

    // Публичный профиль автора (без email и passwordHash)
    @Get('/:username/profile')
    getProfile(@Param('username') username: string){
        return this.usersService.getProfile(username)
    }
}
