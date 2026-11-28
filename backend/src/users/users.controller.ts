import { Controller, Header, HttpCode, HttpStatus, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService, type UploadedImage } from './users.service';
import { AccountService } from './account.service';
import {
    ChangeEmailDto,
    ChangePasswordDto,
    ChangeUsernameDto,
    DeleteAccountDto,
    VerifyEmailCodeDto,
} from './dto/account.dto';
import { AuthGuard } from 'src/auth/guards/auth.guards';
import type { RequestWithUser } from 'src/auth/types/request-with-user';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 МБ

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly accountService: AccountService,
    ) {}

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

    // ---------- Настройки аккаунта (страница /settings) ----------

    @Patch('/me/password')
    @UseGuards(AuthGuard)
    changePassword(@Req() req: RequestWithUser, @Body() dto: ChangePasswordDto) {
        return this.accountService.changePassword(req.user.sub, req.user.sessionId, dto.currentPassword, dto.newPassword);
    }

    @Patch('/me/username')
    @UseGuards(AuthGuard)
    changeUsername(@Req() req: RequestWithUser, @Body() dto: ChangeUsernameDto) {
        return this.accountService.changeUsername(req.user.sub, dto.username);
    }

    // Смена почты: 1) код на текущую почту → 2) проверка кода → 3) новая почта
    @Post('/me/email/code')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    sendEmailCode(@Req() req: RequestWithUser) {
        return this.accountService.sendEmailCode(req.user.sub);
    }

    @Post('/me/email/verify')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    verifyEmailCode(@Req() req: RequestWithUser, @Body() dto: VerifyEmailCodeDto) {
        return this.accountService.verifyEmailCode(req.user.sub, dto.code);
    }

    @Patch('/me/email')
    @UseGuards(AuthGuard)
    changeEmail(@Req() req: RequestWithUser, @Body() dto: ChangeEmailDto) {
        return this.accountService.changeEmail(req.user.sub, req.user.sessionId, dto.emailToken, dto.newEmail);
    }

    // ---------- Мои данные: экспорт стихов и удаление аккаунта ----------

    // @Header задаёт заголовки ответа: Content-Disposition: attachment — браузер скачает файл poems.md
    @Get('/me/export')
    @UseGuards(AuthGuard)
    @Header('Content-Type', 'text/markdown; charset=utf-8')
    @Header('Content-Disposition', 'attachment; filename="poems.md"')
    @Header('Cache-Control', 'no-store')
    exportPoems(@Req() req: RequestWithUser) {
        return this.accountService.exportPoems(req.user.sub);
    }

    // Удалить свой аккаунт (подтверждение паролем). Объявлен ДО DELETE '/:id'
    @Delete('/me')
    @UseGuards(AuthGuard)
    deleteMe(@Req() req: RequestWithUser, @Body() dto: DeleteAccountDto) {
        return this.accountService.deleteAccount(req.user.sub, dto.password);
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
