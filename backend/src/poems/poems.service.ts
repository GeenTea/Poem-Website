import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePoemDto } from './dto/create-poem.dto';
import { UpdatePoemDto } from './dto/update-poem.dto';
import { Prisma } from '../../generated/prisma/client'
import type { Poem } from '../../generated/prisma/client'


const poemPublicSelect = {
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

  tags: {
    select: {
      tag: { select: { name: true, slug: true } },
    },
  },

  _count: {
    select: { likes: true, comments: true },
  },
} satisfies Prisma.PoemSelect;

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

        return this.prisma.poem.create({
            data: dto
        });
    };

    async update(id: string, dto: UpdatePoemDto): Promise<Poem> {
        const poem = await this.prisma.poem.findUnique({
            where: { id }
        })

        if (!poem) {
            throw new NotFoundException(`Poem with id ${id} not found`);
        }

        return this.prisma.poem.update({
            where: { id },
            data: dto
        });
    };

    async findAll(tag?:string, q?: string){
        const search = q?.trim()

        return this.prisma.poem.findMany({
            where:{
                status: 'PUBLISHED',
                ...(tag&& {
                    tags:{
                        some:{
                            tag:{slug:tag}
                        }
                    }
                }),
                ...(search && {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { content: { contains: search, mode: 'insensitive' } },
                        { author: { username: { contains: search, mode: 'insensitive' } } },
                        { author: { displayName: { contains: search, mode: 'insensitive' } } },
                    ],
                }),
            },

            orderBy: {
                publishedAt: 'desc'
            },

            select: poemPublicSelect,
        });

    }

    async findOne(id: string){
        const poem = await this.prisma.poem.findUnique({
            where: {
                id,
            },

            select: poemPublicSelect
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
                ...(status === 'PUBLISHED' && !poem.publishedAt && {
                publishedAt: new Date(),
                }),
            }
        })
    }

}
