import {Injectable} from '@nestjs/common';
import {randomUUID} from "crypto";
import {HashingService} from "../hashing/hashing.service";


export interface GenerateApiKeyPayload {
    apiKey: string;
    hashedKey: string;
}

@Injectable()
export class ApiKeysService {

    constructor(private readonly hashingService: HashingService) {
    }

    async createAndHash(id: number): Promise<GenerateApiKeyPayload> {
        const apiKey = this.generateApiKey(id);
        const hashedKey = await this.hashingService.hash(apiKey);
        return {apiKey, hashedKey}
    }

    async validate(apiKey: string, hashedKey: string): Promise<boolean> {
        return this.hashingService.compare(apiKey,hashedKey);
    }

    extractIdFromApiKey(apiKei: string): string {
        const [id] = Buffer.from(apiKei,'base64').toString('ascii').split(' ')
        return id
    }

    private generateApiKey(id: number): string {
        const apiKey = `${id} ${randomUUID()}`
        return Buffer.from(apiKey).toString('base64');
    }
}
