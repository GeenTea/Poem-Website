import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comments.dto';
import { UpdateCommentDto } from './dto/update-comments.dto';

@Injectable()
export class CommentsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(poemId: string, sub: string, dto: CreateCommentDto){
        const poem = await this.prisma.poem.findUnique({
            select: { id: true },
            where: { 
                id: poemId,
                status: 'PUBLISHED'
            }
        })

        if(!poem){
            throw new NotFoundException(`Poem with id ${poemId} not found`);
        }

        if(dto.parentId){
            const parent = await this.prisma.comment.findUnique({
                where: {
                    id: dto.parentId,
                },
                select: {
                    id: true, 
                    poemId: true, 
                    parentId: true
                }
            })

            if(!parent || parent.poemId !== poemId){
                throw new NotFoundException(`Parent comment with id ${dto.parentId} not found`);
            }

            if(parent.parentId){
                throw new BadRequestException(`Cannot reply to a comment that is already a reply`);
            }
        }

        return this.prisma.comment.create({
            data: {
                content: dto.content,
                parentId: dto.parentId,
                poemId: poem.id,
                authorId:sub
            }
        })
    }
}