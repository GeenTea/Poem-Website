import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateUserDto {

    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    username?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    @MaxLength(128)
    password?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    displayName?: string;

    
    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    bio?: string;
}