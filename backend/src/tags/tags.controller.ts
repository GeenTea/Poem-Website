import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guards';
import { AddTagsDto } from './dto/add-tags.dto';
import { TagsService } from './tags.service';
import type { RequestWithUser } from 'src/auth/types/request-with-user';

@Controller()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('tags')
  getAllTags() {
    return this.tagsService.getAllTags();
  }

  @Get('poems/:poemId/tags')
  getPoemTags(@Param('poemId') poemId: string) {
    return this.tagsService.getPoemTags(poemId);
  }

  @UseGuards(AuthGuard)
  @Post('poems/:poemId/tags')
  addTags(@Req() req: RequestWithUser, @Param('poemId') poemId: string, @Body() dto: AddTagsDto) {
    return this.tagsService.addTagsToPoem(req.user.sub, poemId, dto.slugs);
  }

  @UseGuards(AuthGuard)
  @Delete('poems/:poemId/tags/:slug')
  removeTag(@Req() req: RequestWithUser, @Param('poemId') poemId: string, @Param('slug') slug: string) {
    return this.tagsService.removeTagFromPoem(req.user.sub, poemId, slug);
  }
}