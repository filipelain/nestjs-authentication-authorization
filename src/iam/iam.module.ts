import {Module} from '@nestjs/common';
import {HashingService} from './hashing/hashing.service';
import {BcryptService} from './hashing/bcrypt.service';
import {AuthenticationController} from './authentication/authentication.controller';
import {AuthenticationService} from './authentication/authentication.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "../users/entities/user.entity";
import {JwtModule} from "@nestjs/jwt";
import jwtConfig from "./config/jwt.config";
import {ConfigModule} from "@nestjs/config";
import {APP_GUARD} from "@nestjs/core";
import {AuthenticationGuard} from "./authentication/guards/authentication/authentication.guard";
import {AccessTokenGuard} from "./authentication/guards/access-token/access-token.guard";
import {RefreshTokenIdsStorage} from "./authentication/refresh-token-ids.storage/refresh-token-ids.storage";
import {PolicyHandlersStorage} from "./authorization/policies/policy-handlers.storage";
import {FrameworkContributorPolicyHandler} from "./authorization/policies/framework-contributor.policy";
import {PoliciesGuard} from "./authorization/guards/policies/policies.guard";
import { ApiKeysService } from './authentication/api-keys.service';
import {ApiKey} from "../users/api-keys/entities/api-key.entity/api-key.entity";
import {ApiKeyGuard} from "./authentication/guards/api-key/api-key.guard";

@Module({
    imports: [
        TypeOrmModule.forFeature([User,ApiKey]),
        JwtModule.registerAsync(jwtConfig.asProvider()),
        ConfigModule.forFeature(jwtConfig)
    ],
    providers: [{
        provide: HashingService,
        useClass: BcryptService,
    }, {
        provide: APP_GUARD,
        useClass: AuthenticationGuard,
    }, {
        provide: APP_GUARD,
        useClass: PoliciesGuard // PermissionsGuard, //RolesGuard,
    },
        ApiKeyGuard,
        FrameworkContributorPolicyHandler,
        PolicyHandlersStorage,
        RefreshTokenIdsStorage,
        AuthenticationService,
        AccessTokenGuard,
        ApiKeysService],
    controllers: [AuthenticationController]
})
export class IamModule {
}
