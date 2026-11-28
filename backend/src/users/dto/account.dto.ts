import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { USERNAME_PATTERN, USERNAME_RULE_MESSAGE, normalizeUsername } from 'src/common/username';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Смена пароля: сначала текущий, потом новый (правила как при регистрации)
export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
    currentPassword!: string;

    @IsString()
    @MinLength(6)
    @MaxLength(128)
    newPassword!: string;
}

export class ChangeUsernameDto {
    @Transform(normalizeUsername)
    @IsString()
    @Matches(USERNAME_PATTERN, { message: USERNAME_RULE_MESSAGE })
    username!: string;
}

// Шаг 2 смены почты: код из письма
export class VerifyEmailCodeDto {
    @Transform(trim)
    @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
    code!: string;
}

// Шаг 3: новая почта + токен, полученный за верный код
export class ChangeEmailDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    emailToken!: string;

    @Transform(trim)
    @IsEmail()
    @MaxLength(254)
    newEmail!: string;
}

// Удаление аккаунта: подтверждаем паролем
export class DeleteAccountDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
    password!: string;
}
