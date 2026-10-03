import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength, IsOptional} from 'class-validator';

export class CreateCommentDto{
    @Transform(({value})=> typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content!: string;

    @IsOptional()
    @IsString()
    parentId?: string;
}