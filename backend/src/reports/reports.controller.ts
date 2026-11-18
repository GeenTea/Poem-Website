import { Controller,  } from '@nestjs/common';
import { ReportsService } from './reports.service';
import {
    Get,
    Post,
    Body,
    Delete,
    Param,
    UseGuards,
    Req,
    Query,
    DefaultValuePipe,
    ParseIntPipe
} from '@nestjs/common';
import type { RequestWithUser } from 'src/auth/types/request-with-user';
import { AuthGuard } from 'src/auth/guards/auth.guards';
import { CreateReportDto } from './dto/create-reports.dto';
import {RolesGuard} from 'src/auth/guards/roles.guards';
import { Roles } from 'src/auth/decorators/roles.decorator';


@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Post()
    @UseGuards(AuthGuard)
    createReport(
        @Body() dto: CreateReportDto,
        @Req() req: RequestWithUser
    ) {
        return this.reportsService.createReport(dto, req.user.sub);
    }

    @Get()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('ADMIN', 'MODERATOR')
    getReports(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
    ){
        return this.reportsService.getReports(page, limit);
    }

    @Get(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('ADMIN', 'MODERATOR')
    getReportById(
        @Param('id') id: string
    ){
        return this.reportsService.getReportById(id);
    }

    @Delete(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('ADMIN', 'MODERATOR')
    deleteReport(
        @Param('id') id: string
    ){
        return this.reportsService.deleteReport(id);
    }
}
