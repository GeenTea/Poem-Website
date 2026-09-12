import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePoemDto } from './dto/create-poem.dto';
import { UpdatePoemDto } from './dto/update-poem.dto';
import type { Poem } from '../../generated/prisma/client'

@Injectable()
export  class PoemsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreatePoemDto): Promise<Poem> {
        const author = await this.prisma.user.findFirst({
            where: { 
                id: dto.authorId
            }
        })

        if(!author) {
            throw new NotFoundException(`Author with id ${dto.authorId} not found`);
        }

        // const poem = await this.prisma.poem.create({
        //     data: {
        //         title: dto.title,
        //         content: dto.content,
        //         authorId: dto.authorId
        //     }
        // })

        return this.prisma.poem.create({
            data: dto
        });
    };

    async update(id: string, dto: UpdatePoemDto): Promise<Poem> {
        const poem = await this.prisma.poem.findUnique({
            where: { id }
        })

        if (!poem) {
            throw new Error(`Poem with id ${id} not found`);
        }

        return this.prisma.poem.update({
            where: { id },
            data: dto
        });
    };

    async findAll(){
        return this.prisma.poem.findMany({
            where:{
                status: 'PUBLISHED'
            },

            orderBy: {
                publishedAt: 'desc'
            },

            select: {
                id: true,
                title: true,
                content: true,
                status: true,
                viewCount: true,
                publishedAt: true,
                createdAt: true,
                updatedAt: true,

                author: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        });

    }

    async findOne(id: string){
        const poem = await this.prisma.poem.findUnique({
            where: {
                id,
            },

            select: {
                id: true,
                title: true,
                content: true,
                status: true,
                viewCount: true,
                publishedAt: true,
                createdAt: true,
                updatedAt: true,

                author: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        })
        if(!poem){
            throw new NotFoundException(`Poem with id ${id} not found`);
        }
        return poem;
    }

    async delete(id: string){
        const poem = await this.prisma.poem.findUnique({
            where: {
                id,
            }
        })

        if(!poem){
            throw new NotFoundException(`Poem with id ${id} not found`);
        }

        return this.prisma.poem.delete({
            where: {
                id,
            }
        })
    }

    async updateStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
        const poem = await this.prisma.poem.findUnique({
            where: {
                id,
            }
        })

        if(!poem){
                throw new NotFoundException(`Poem with id ${id} not found`);
        }

        return this.prisma.poem.update({
            where: {
                id,
            },
            data: {
                status,
            }
        })
    }

}
