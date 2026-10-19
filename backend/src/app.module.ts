import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PoemsModule } from './poems/poems.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TagsModule } from './tags/tags.module';
import { LikesModule } from './likes/likes.module';
import { CommentsModule } from './comments/comments.module';
import { FollowsModule } from './follows/follows.module';
@Module({
  imports: [PoemsModule, UsersModule, AuthModule,PrismaModule, TagsModule, LikesModule, CommentsModule, FollowsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
