import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaModule} from '../prisma/prisma.module';
import { ReportsController } from './reports.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  providers: [ReportsService],
  controllers: [ReportsController],
  imports: [PrismaModule, NotificationsModule],
})
export class ReportsModule {}
