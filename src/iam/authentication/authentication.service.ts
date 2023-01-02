import {ConflictException, Inject, Injectable, UnauthorizedException} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "../../users/entities/user.entity";
import {Repository} from "typeorm";
import {HashingService} from "../hashing/hashing.service";
import {SignUpDto} from "./dto/sign-up.dto";
import {SignInDto} from "./dto/sign-in.dto";
import {JwtService} from "@nestjs/jwt";
import jwtConfig from "../config/jwt.config";
import {ConfigType} from "@nestjs/config";
import {ActiveUserData} from "../interfaces/active-user-data.interface";
import {RefreshTokenDto} from "./dto/refresh-token.dto";
import {
    InvalidatedRefreshTokenError,
    RefreshTokenIdsStorage
} from "./refresh-token-ids.storage/refresh-token-ids.storage";
import {randomUUID} from 'crypto';

@Injectable()
export class AuthenticationService {
    constructor(
        @InjectRepository(User) private readonly usersRepository: Repository<User>,
        private readonly hashingService: HashingService,
        private readonly jwtService: JwtService,
        @Inject(jwtConfig.KEY)
        private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
        private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
    ) {
    }

    async signUp(signUpDto: SignUpDto) {
        try {
            const user = new User();
            user.email = signUpDto.email;
            user.password = await this.hashingService.hash(signUpDto.password);
            await this.usersRepository.save(user);
        } catch (e) {
            const pgUniqueViolationErrorCode = '23505';
            if (e.code === pgUniqueViolationErrorCode) {
                throw new ConflictException();
            }
            throw e;
        }

    }

    async signIn(signInDto: SignInDto) {
        const user = await this.usersRepository.findOneBy({
            email: signInDto.email
        })
        if (!user) {
            throw new UnauthorizedException('User does not exists');
        }
        const isEqual = await this.hashingService.compare(
            signInDto.password,
            user.password
        );
        if (!isEqual) {
            throw new UnauthorizedException('Password does not match')
        }
        return await this.generateToken(user);
    }


    async generateToken(user: User) {
        const refreshTokenId = randomUUID();
        const [accessToken, refreshToken] = await Promise.all([
            this.signToken<Partial<ActiveUserData>>(user.id,
                this.jwtConfiguration.accessTokenTtl,
                {email: user.email, role: user.role, permissions: user.permissions}
            ),
            this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl, {
                refreshTokenId
            })
        ])
        await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId)
        return {
            accessToken,
            refreshToken
        };
    }

    private async signToken<T>(userID: number, expiresIn: number, payload?: T) {
        return await this.jwtService.signAsync({
            sub: userID,
            ...payload
        }, {
            audience: this.jwtConfiguration.audience,
            issuer: this.jwtConfiguration.issuer,
            secret: this.jwtConfiguration.secret,
            expiresIn,
        });
    }

    async refreshTokens(refreshToken: RefreshTokenDto) {
        try {
            const {sub, refreshTokenId} = await this.jwtService
                .verifyAsync<Pick<ActiveUserData, 'sub'> & { refreshTokenId: string }>(refreshToken.refreshToken, {
                    audience: this.jwtConfiguration.audience,
                    issuer: this.jwtConfiguration.issuer,
                    secret: this.jwtConfiguration.secret,
                });

            const user = await this.usersRepository.findOneByOrFail({id: sub});

            const isValid = await this.refreshTokenIdsStorage.validate(user.id, refreshTokenId)
            if (!isValid) {
                throw new InvalidatedRefreshTokenError('Refresh token is invalid')
            }
            await this.refreshTokenIdsStorage.invalidate(user.id);
            return this.generateToken(user);
        } catch (err) {
            if (err instanceof InvalidatedRefreshTokenError) {
                throw new InvalidatedRefreshTokenError('Access Denied')
            }
            throw new UnauthorizedException();
        }


    }
}
