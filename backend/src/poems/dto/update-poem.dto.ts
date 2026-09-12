import {
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { PoemStatus } from 'generated/prisma/client';

export class UpdatePoemDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    content?: string;

    @IsOptional()
    @IsEnum(PoemStatus)
    status?: PoemStatus;
}