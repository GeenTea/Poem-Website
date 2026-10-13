import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

const MAX_TAGS_PER_POEM = 5;

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  // Все доступные теги (для выпадающего списка на фронте)
  async getAllTags() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        _count: { select: { poems: true } }, // сколько стихов с этим тегом
      },
    });
  }

  // Добавить теги к стиху
  async addTagsToPoem(currentUserId: string, poemId: string, slugs: string[]) {
    await this.ensurePoemOwner(currentUserId, poemId);

    const uniqueSlugs = [...new Set(slugs)];

    // Проверяем, что все теги существуют
    const tags = await this.prisma.tag.findMany({
      where: { slug: { in: uniqueSlugs } },
      select: { id: true, slug: true },
    });

    if (tags.length !== uniqueSlugs.length) {
      const found = tags.map((t) => t.slug);
      const missing = uniqueSlugs.filter((s) => !found.includes(s));
      throw new BadRequestException(`Unknown tags: ${missing.join(', ')}`);
    }

    await this.prisma.$transaction(async (tx) => {
      // Какие теги уже есть у стиха
      const existing = await tx.poemTag.findMany({
        where: { poemId },
        select: { tagId: true },
      });
      const existingIds = new Set(existing.map((e) => e.tagId));

      const newTags = tags.filter((t) => !existingIds.has(t.id));

      if (existingIds.size + newTags.length > MAX_TAGS_PER_POEM) {
        throw new BadRequestException(
          `A poem can have at most ${MAX_TAGS_PER_POEM} tags`,
        );
      }

      await tx.poemTag.createMany({
        data: newTags.map((t) => ({ poemId, tagId: t.id })),
        skipDuplicates: true,
      });
    });

    return this.getPoemTags(poemId);
  }

  // Убрать один тег у стиха
  async removeTagFromPoem(currentUserId: string, poemId: string, slug: string) {
    await this.ensurePoemOwner(currentUserId, poemId);

    const { count } = await this.prisma.poemTag.deleteMany({
      where: { poemId, tag: { slug } },
    });

    if (count === 0) {
      throw new NotFoundException('This poem does not have this tag');
    }

    return this.getPoemTags(poemId);
  }

  // Теги конкретного стиха
  async getPoemTags(poemId: string) {
    const rows = await this.prisma.poemTag.findMany({
      where: { poemId },
      select: { tag: { select: { id: true, slug: true, name: true } } },
    });
    return rows.map((r) => r.tag);
  }

  private async ensurePoemOwner(currentUserId: string, poemId: string) {
    const poem = await this.prisma.poem.findUnique({
      where: { id: poemId },
      select: { authorId: true },
    });

    if (!poem) {
      throw new NotFoundException('Poem not found');
    }
    if (poem.authorId !== currentUserId) {
      throw new ForbiddenException('You can only edit tags of your own poems');
    }
  }
}