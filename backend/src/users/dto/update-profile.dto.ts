import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/**
 * Что пользователь может менять в своём профиле через PATCH /users/me.
 * username, email и пароль здесь намеренно отсутствуют — лишние поля
 * ValidationPipe (forbidNonWhitelisted) отклонит с 400.
 */
export class UpdateProfileDto {
    @IsOptional()
    @Transform(trim)
    @IsString()
    @MinLength(1)
    @MaxLength(40)
    displayName?: string;

    // Пустая строка — «очистить bio» (в БД станет null)
    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(300)
    bio?: string;
}
