import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comments.dto';
import { UpdateCommentDto } from './dto/update-comments.dto';

@Injectable()
export class CommentsService {
    constructor(private readonly prisma: PrismaService) {}


}