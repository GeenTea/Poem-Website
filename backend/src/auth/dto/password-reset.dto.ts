import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Шаг 1: на какой email отправить код
export class ForgotPasswordDto {
    @Transform(trim)
    @IsEmail()
    email!: string;
}

// Шаг 2: проверить код из письма
export class VerifyResetCodeDto {
    @Transform(trim)
    @IsEmail()
    email!: string;

    @Transform(trim)
    @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
    code!: string;
}

// Шаг 3: новый пароль (правила как при регистрации)
export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    resetToken!: string;

    @IsString()
    @MinLength(6)
    @MaxLength(128)
    password!: string;
}
