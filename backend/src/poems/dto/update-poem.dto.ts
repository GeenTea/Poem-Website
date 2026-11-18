import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { EDITABLE_POEM_STATUSES, trim } from './create-poem.dto';
import type { EditablePoemStatus } from './create-poem.dto';

// Те же правила, что в CreatePoemDto, но все поля необязательны.
// (PartialType из @nestjs/mapped-types сделал бы это за нас, но пакет не установлен.)
export class UpdatePoemDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content?: string;

  // Передали массив — набор тегов стиха заменяется ровно на него ([] — убрать все теги)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  tagSlugs?: string[];

  @IsOptional()
  @IsIn(EDITABLE_POEM_STATUSES)
  status?: EditablePoemStatus;
}
