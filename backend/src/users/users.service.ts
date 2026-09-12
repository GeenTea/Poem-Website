import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import  * as argon2  from 'argon2';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateUserDto) {
        const hashedPassword = await argon2.hash(dto.password);

        return this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                passwordHash: hashedPassword,
                displayName: dto.displayName,
            },
    });
    };

    async update(id: string, dto: UpdateUserDto){
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user){
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return this.prisma.user.update({
            where: { id },
            data: {
                username: dto.username,
                email: dto.email,
                displayName: dto.displayName,
                passwordHash: dto.password ? await argon2.hash(dto.password) : undefined,
                avatarUrl: dto.avatarUrl,
                bio: dto.bio,
            },
        });
    }

    async delete(id: string){
        const user = await this.prisma.user.findUnique({
            where: {
                id,
            }
        });

        if (!user){
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return this.prisma.user.delete({
            where: {
                id,
            }
        });
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id }
        });

        if(!user){
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async someServiceMethod(email: string) {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }
        return user;
    }

    async findByUsername(username: string) {
        const user = await this.prisma.user.findUnique({
            where: { username }
        });

        if(!user){
            throw new NotFoundException(`User with username ${username} not found`);
        }

        return user;
    }

    async findAll() {
        return this.prisma.user.findMany();
    }
}
