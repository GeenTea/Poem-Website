import { Controller } from '@nestjs/common';
import { Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    create(@Body() dto: CreateUserDto){
        return this.usersService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto:UpdateUserDto){
        return this.usersService.update(id, dto);
    }

    @Delete(':id')
    delete(@Param('id') id:string){
        return this.usersService.delete(id);
    }

    @Get()
    findAll(){
        return this.usersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string){
        return this.usersService.findById(id)
    }

    @Get(':username')
    findUsername(@Param('username') username: string){
        return this.usersService.findByUsername(username)
    }

    @Get(':email')
    findEmail(@Param('email') email: string){
        return this.usersService.findByUsername(email)
    }

    @Get(':email')
    findsomeServiceMethod(@Param('email') email: string){
        return this.usersService.someServiceMethod(email)
    }
}
