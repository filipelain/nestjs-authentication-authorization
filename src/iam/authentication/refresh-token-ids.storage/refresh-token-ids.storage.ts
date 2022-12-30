import {HttpException, Injectable, OnApplicationBootstrap, OnApplicationShutdown} from "@nestjs/common";
import Redis from "ioredis";

export class InvalidatedRefreshTokenError extends HttpException {
    constructor(response, status = 401) {
        super(response,status);
    }
}
@Injectable()
export class RefreshTokenIdsStorage implements OnApplicationBootstrap, OnApplicationShutdown {
    private redisClient: Redis;

    onApplicationBootstrap(): any {
        this.redisClient = new Redis({
            host: 'localhost',
            port: 6379
        })
    }

    onApplicationShutdown(signal?: string): any {
        this.redisClient.quit()
    }

    async insert(userID: number, tokenId: string): Promise<void> {
        await this.redisClient.set(this.getKey(userID), tokenId);
    }

    async validate(userID: number, tokenId: string): Promise<boolean> {
        const storeId = await this.redisClient.get(this.getKey(userID))
        if(storeId !== tokenId){
            throw new InvalidatedRefreshTokenError('Access Denied')
        }
        return
    }

    async invalidate(userID: number): Promise<void> {
        await this.redisClient.del(this.getKey(userID))
    }

    getKey(userID: number): string {
        return `user-${userID}`
    }
}
