import { IsString, IsEmail, IsNotEmpty, IsOptional, MinLength, MaxLength } from "class-validator";

export class LoginDto{
    @IsOptional()
    @IsEmail()
    email!: string;
    
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @MaxLength(128)
    password!: string;
}