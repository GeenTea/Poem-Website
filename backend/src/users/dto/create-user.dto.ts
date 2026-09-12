import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional} from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    username!: string;

    @IsNotEmpty()
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @MaxLength(128)
    password!: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    displayName?: string;
}