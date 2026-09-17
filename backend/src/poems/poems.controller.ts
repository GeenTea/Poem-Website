import { Post, Delete, Get, Body, Param, Patch } from '@nestjs/common';
import { CreatePoemDto } from './dto/create-poem.dto';
import { UpdatePoemDto } from './dto/update-poem.dto';
import { Controller } from '@nestjs/common';
import { PoemsService } from './poems.service';

@Controller('poems')
export class PoemsController {
    constructor(private readonly poemsService: PoemsService) {}

    @Post('createPoem')
    create(@Body() dto: CreatePoemDto) {
        return this.poemsService.create(dto)
    }

    @Get('/findall')
    findAll() {
        return this.poemsService.findAll()
    }

    @Get("/findPoem/:id")
    findOne(@Param('id') id: string,) {
        return this.poemsService.findOne(id)
    }

    @Patch('/:id')
    update(@Param('id') id: string, @Body() dto: UpdatePoemDto) {
        return this.poemsService.update(id, dto)
    }

    @Delete('/:id')
    delete(@Param('id') id: string) {
        return this.poemsService.delete(id)
    }

    @Patch('/status/:id/publish')
    publish(@Param('id') id: string) {
        return this.poemsService.updateStatus(id, 'PUBLISHED')
    }

    @Patch('/status/:id/archive')
    archive(@Param('id') id: string) {
        return this.poemsService.updateStatus(id, 'ARCHIVED')
    }
}
