import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { Prisma } from "generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class FollowsService{
    constructor(private readonly prisma: PrismaService){}

    async startFollow(currentUserId: string, targetUserId: string){
        if(currentUserId === targetUserId){
            throw new BadRequestException('You cannot follow yoursalf')
        }


        await this.ensureUserExists(targetUserId)

        try{
            await this.prisma.follow.create({
                data:{
                    followerId: currentUserId,
                    followingId: targetUserId
                },
            });
        }catch(e){
            if(e instanceof Prisma.PrismaClientKnownRequestError && e.code ==='P2002'){
                throw new ConflictException('Already following')
            }
            throw e;
        }

        return { following:true}
    }

    async unfollow(currentUserId: string, targetUserId: string){
        const { count } = await this.prisma.follow.deleteMany({
            where:{
                followerId: currentUserId,
                followingId:targetUserId
            }
        })

        if(count === 0) {
            throw new NotFoundException('You are not following this user')
        }

        return { following: false}
    }

    async getFollowers(userId: string){
        await this.ensureUserExists(userId);

        const rows = await this.prisma.follow.findMany({
            where: { followingId: userId},
            orderBy: { createAt: 'desc'},
            select: {
                follower: {
                    select:{
                        id:true,
                        username:true,
                        displayName:true,
                        avatarUrl:true
                    }
                },
            },
        })

        return rows.map((r) => r.follower)
    }

    async getFollowing(userId: string) {
        await this.ensureUserExists(userId);

        const rows = await this.prisma.follow.findMany({
            where: { followerId: userId },
            orderBy: { createAt: 'desc' },
            select: {
                following: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            },
        });

        return rows.map((r) => r.following);
    }



    async isFollowing(currentUserId: string, targetUserId: string){
        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {followerId: currentUserId, followingId: targetUserId}
            },
        })

        return{ following: !!follow}
    }

    private async ensureUserExists(userId: string){
        const user = await this.prisma.user.findUnique({
                where: { id: userId},
                select: {id: true}
            }
        )

        if(!user){
            throw new NotFoundException('User dont found')
        }
    }
}