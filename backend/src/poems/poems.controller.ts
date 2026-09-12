import { Post, Delete, Get, Body, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { CreatePoemDto } from './dto/create-poem.dto';
import { UpdatePoemDto } from './dto/update-poem.dto';
import { Controller } from '@nestjs/common';
import { PoemsService } from './poems.service';

@Controller('poems')
export class PoemsController {
    constructor(private readonly poemsService: PoemsService) {}

    @Post()
    create(@Body() dto: CreatePoemDto) {
        return this.poemsService.create(dto)
    }

    @Get()
    findAll() {
        return this.poemsService.findAll()
    }

    @Get(":id")
    findOne(@Param('id') id: string,) {
        return this.poemsService.findOne(id)
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePoemDto) {
        return this.poemsService.update(id, dto)
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.poemsService.delete(id)
    }

    @Patch(':id/publish')
    publish(@Param('id') id: string) {
        return this.poemsService.updateStatus(id, 'PUBLISHED')
    }

    @Patch(':id/archive')
    archive(@Param('id') id: string) {
        return this.poemsService.updateStatus(id, 'ARCHIVED')
    }
}
