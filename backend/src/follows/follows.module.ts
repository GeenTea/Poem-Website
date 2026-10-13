import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { FollowController } from "./follows.controller";
import { FollowsService } from "./follows.service";

@Module({
    imports:[PrismaModule],
    controllers:[FollowController],
    providers:[FollowsService]
})

export class FollowsModule{

}