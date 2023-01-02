import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import {Observable} from 'rxjs';
import {Request} from "express";
import {ApiKeysService} from "../../api-keys.service";
import {InjectRepository} from "@nestjs/typeorm";
import {ApiKey} from "../../../../users/api-keys/entities/api-key.entity/api-key.entity";
import {Repository} from "typeorm";
import {REQUEST_USER_KEY} from "../access-token/iam.constants";
import {ActiveUserData} from "../../../interfaces/active-user-data.interface";

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly apiKeysService: ApiKeysService,
                @InjectRepository(ApiKey) private readonly apiKeysRepository: Repository<ApiKey>) {
    }

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const apiKey = this.extractKeyFromHeader(request);
        if (!apiKey) throw new UnauthorizedException();

        const apiKeyEntityId = this.apiKeysService.extractIdFromApiKey(apiKey);
        try {
            const apiEntity = await this.apiKeysRepository.findOne({
                where: {uuid: apiKeyEntityId},
                relations: {user: true}
            })
            await this.apiKeysService.validate(apiKey, apiEntity.key);
            const {user} = apiEntity
            request[REQUEST_USER_KEY] = {
                sub: user.id,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
            } as ActiveUserData;
        } catch (e) {
            throw new UnauthorizedException()
        }

        return true;
    }

    private extractKeyFromHeader(req: Request): string | undefined {
        const [type, key] = req.headers.authorization?.split(' ') ?? []
        return type === 'ApiKey' ? key : undefined
    }

}
