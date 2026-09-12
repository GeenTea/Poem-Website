import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreatePoemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsUUID()
  authorId!: string;
}
