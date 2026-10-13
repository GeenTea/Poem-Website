import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class AddTagsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  slugs!: string[];
}