import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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

    async delete(commentId: string, sub: string, poemId: string){
        const poem = await this.prisma.poem.findUnique({
            where: { 
                id: poemId,
                status: 'PUBLISHED'
            }
        })

        if(!poem){
            throw new NotFoundException(`Poem with id ${poemId} not found`);
        }

        const user = await this.prisma.user.findUnique({
            where: {
                id: sub
            },
            select: {
                role: true
            }
        })

        if(!user){
            throw new NotFoundException(`User with id ${sub} not found`);
        }

        const comment = await this.prisma.comment.findUnique({
            where: { 
                id: commentId,
                poemId: poemId
            }
        })

        if(!comment){
            throw new NotFoundException(`Comment with id ${commentId} not found`);
        }

        const canModerate = user.role === 'ADMIN' || user.role === 'MODERATOR';

        if(!canModerate && comment.authorId !== sub){
            throw new ForbiddenException(`You are not authorized to delete this comment`);
        }

        return this.prisma.comment.delete({
            where: { 
                id: commentId,
                poemId: poemId
            }
        })
    }

    async update(commentId: string, sub: string, poemId: string, dto: UpdateCommentDto){
        const poem = await this.prisma.poem.findUnique({
            where: { 
                id: poemId,
                status: 'PUBLISHED'
            }
        })

        if(!poem){
            throw new NotFoundException(`Poem with id ${poemId} not found`);
        }

        const comment = await this.prisma.comment.findUnique({
            where: {
                id: commentId,
                poemId: poemId
            }
        })

        if(!comment){
            throw new NotFoundException(`Comment with id ${commentId} not found`);
        }

        if(comment.authorId !== sub){
            throw new ForbiddenException(`You are not authorized to update this comment`);
        }

        return this.prisma.comment.update({
            where: {
                id: commentId,
                poemId: poemId
            },
            data: {
                content: dto.content,
                isEdited: true
            }
        })
    }

    async findAll(poemId: string){
        const poem = await this.prisma.poem.findUnique({
            where: {
                id: poemId,
                status: 'PUBLISHED'
            }
        })

        if(!poem){
            throw new NotFoundException(`Poem with id ${poemId} not found`);
        }

        return this.prisma.comment.findMany({
            where:{
                poemId: poemId,
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    }
}