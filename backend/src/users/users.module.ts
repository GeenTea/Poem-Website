import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';
import { AccountService } from './account.service';


@Module({
    imports: [PrismaModule, MailModule],
    controllers: [UsersController],
    providers: [UsersService, AccountService],
    exports:[UsersService],
})
export class UsersModule {}
