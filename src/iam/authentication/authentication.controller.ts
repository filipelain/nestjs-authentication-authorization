import {Body, Controller, HttpCode, HttpStatus, Post, Res} from '@nestjs/common';
import {AuthenticationService} from "./authentication.service";
import {SignUpDto} from "./dto/sign-up.dto";
import {SignInDto} from "./dto/sign-in.dto";
import {Response} from "express";
import {Auth} from "./decorators/auth.decorator";
import {AuthType} from "./enums/auth-type.enum";
import {RefreshTokenDto} from "./dto/refresh-token.dto";


@Auth(AuthType.None)
@Controller('authentication')
export class AuthenticationController {
    constructor(private readonly  authenticationService: AuthenticationService) {
    }

    @Post('sign-up')
    signUp(@Body() signUpDto:SignUpDto){
        return this.authenticationService.signUp(signUpDto)
    }
    @HttpCode(HttpStatus.OK)
    @Post('sign-in')
    signIn(@Body() signInDto: SignInDto){
        return this.authenticationService.signIn(signInDto)
    }

    @HttpCode(HttpStatus.OK)
    @Post('refresh-token')
    refreshToken(@Body() refreshToken: RefreshTokenDto){
        return this.authenticationService.refreshTokens(refreshToken)
    }


    @Post('sign-in-cookie')
    async signInCookie(@Res({passthrough: true}) response: Response, @Body() signInDto: SignInDto) {
        const accessToken = await this.authenticationService.signIn(signInDto);
        response.cookie('accessToken', accessToken, {
            secure: true,
            httpOnly: true,
            sameSite: true,
        })
    }

}
