import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { NotificationsModule } from "src/notifications/notifications.module";
import { FollowController } from "./follows.controller";
import { FollowsService } from "./follows.service";

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers:[FollowController],
    providers:[FollowsService]
})

export class FollowsModule{

}