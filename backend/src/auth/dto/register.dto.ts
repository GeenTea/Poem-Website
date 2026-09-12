import { IsString, IsEmail, IsNotEmpty, IsOptional, MinLength, MaxLength } from "class-validator";

export class RegisterDto{
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