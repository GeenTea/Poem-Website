import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from 'src/prisma/prisma.service'; 
import { RequestWithUser } from 'src/auth/types/request-with-user';
import { Role } from 'generated/prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService, // Инжектим призму для проверки по базе
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. Получаем роли, указанные в декораторе @Roles(...)
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Если роли не заданы, значит защита по ролям не требуется
        if (!requiredRoles) {
            return true;
        }

        // 2. Получаем объект запроса и пользователя, которого туда записал AuthGuard
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const user = request.user;

        if (!user || !user.sub) {
            throw new UnauthorizedException('User is not authenticated');
        }

        // 3. Запрос в базу данных для получения актуальной роли пользователя
        // (Предполагаем, что у модели User в Prisma есть поле role, например 'ADMIN', 'MODERATOR', 'USER')
        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.sub },
            select: { role: true },
        });

        if (!dbUser) {
            throw new ForbiddenException('User not found in the database');
        }

        // 4. Проверяем, входит ли роль пользователя в список разрешенных
        const hasRole = requiredRoles.includes(dbUser.role);

        if (!hasRole) {
            throw new ForbiddenException('Not enough permissions to access this resource');
        }

        return true;
    }
}