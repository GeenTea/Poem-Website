import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength} from 'class-validator';

export class UpdateCommentDto{
    @Transform(({value})=> typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content!: string;
}