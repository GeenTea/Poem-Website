import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Обрезаем пробелы до валидации: "   " превратится в "" и не пройдёт MinLength(1)
export const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Через API можно только сохранить черновик или опубликовать.
// ARCHIVED (скрытие) — отдельные эндпоинты hide/unhide.
export const EDITABLE_POEM_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type EditablePoemStatus = (typeof EDITABLE_POEM_STATUSES)[number];

export class CreatePoemDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content!: string;

  // Автора больше не передаём в теле — он берётся из токена (req.user.sub)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  tagSlugs?: string[];

  @IsIn(EDITABLE_POEM_STATUSES)
  status!: EditablePoemStatus;
}
