import { IsString, IsEmail, IsNotEmpty, IsOptional, MinLength, MaxLength, Matches } from "class-validator";
import { Transform } from "class-transformer";
import { USERNAME_PATTERN, USERNAME_RULE_MESSAGE, normalizeUsername } from "src/common/username";

export class RegisterDto{
    // Как в настройках: a–z, 0–9, "_" и ".", 3–20 символов, в нижнем регистре
    @Transform(normalizeUsername)
    @IsNotEmpty()
    @IsString()
    @Matches(USERNAME_PATTERN, { message: USERNAME_RULE_MESSAGE })
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