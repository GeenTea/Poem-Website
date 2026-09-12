import { Module } from '@nestjs/common';
import { PoemsController } from './poems.controller';
import { PoemsService } from './poems.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [PoemsController],
  providers: [PoemsService],
  imports: [PrismaModule],
})
export class PoemsModule {}
