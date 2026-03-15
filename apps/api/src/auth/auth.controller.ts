import type {
  CurrentUser as CurrentUserPayload,
  LoginInput,
  RefreshInput,
  SetPasswordInput,
} from '@epde/shared';
import {
  CLIENT_TYPE_HEADER,
  CLIENT_TYPES,
  loginSchema,
  refreshSchema,
  setPasswordSchema,
  UserRole,
} from '@epde/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';

const ACCESS_COOKIE_NAME = 'access_token';
const REFRESH_COOKIE_NAME = 'refresh_token';

@ApiTags('Autenticación')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private get isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production';
  }

  private get cookieSameSite(): 'strict' | 'lax' | 'none' {
    const value = this.configService.get<string>('COOKIE_SAME_SITE');
    if (value === 'none' || value === 'lax') return value;
    return 'strict';
  }

  private get accessCookieOptions() {
    return {
      httpOnly: true,
      secure: this.isProduction || this.cookieSameSite === 'none',
      sameSite: this.cookieSameSite,
      path: '/api',
      maxAge: 15 * 60 * 1000, // 15 minutes — must match JWT_EXPIRATION
    };
  }

  private get refreshCookieOptions() {
    return {
      httpOnly: true,
      secure: this.isProduction || this.cookieSameSite === 'none',
      sameSite: this.cookieSameSite,
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }

  @Public()
  @UseGuards(AuthGuard('local'))
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) _dto: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as CurrentUserPayload;
    const isMobile = req.headers[CLIENT_TYPE_HEADER] === CLIENT_TYPES.MOBILE;
    const result = await this.authService.login(user, {
      clientType: isMobile ? 'mobile' : 'web',
      ip: req.ip,
    });

    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, this.accessCookieOptions);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, this.refreshCookieOptions);

    if (isMobile) {
      return {
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      };
    }

    return {
      data: {
        user: result.user,
      },
    };
  }

  @Public()
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isMobile = req.headers[CLIENT_TYPE_HEADER] === CLIENT_TYPES.MOBILE;
    const refreshToken = isMobile ? body?.refreshToken : req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException('No se encontró token de refresco');
    }

    const result = await this.authService.refresh(refreshToken);
    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, this.accessCookieOptions);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, this.refreshCookieOptions);

    if (isMobile) {
      return {
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      };
    }

    return { data: { message: 'Token refrescado' } };
  }

  @Post('logout')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: CurrentUserPayload, @Res({ passthrough: true }) res: Response) {
    const ttlSeconds = user.exp ? Math.max(0, user.exp - Math.floor(Date.now() / 1000)) : 0;
    await this.authService.logout(user.id, user.jti, user.family, ttlSeconds);

    res.clearCookie(ACCESS_COOKIE_NAME, {
      path: '/',
      sameSite: this.cookieSameSite,
      secure: this.isProduction || this.cookieSameSite === 'none',
    });
    res.clearCookie(REFRESH_COOKIE_NAME, {
      path: '/api/v1/auth',
      sameSite: this.cookieSameSite,
      secure: this.isProduction || this.cookieSameSite === 'none',
    });
    return { data: { message: 'Sesión cerrada' } };
  }

  @Public()
  @Throttle({ medium: { limit: 3, ttl: 3600000 }, short: { limit: 1, ttl: 5000 } })
  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(@Body(new ZodValidationPipe(setPasswordSchema)) dto: SetPasswordInput) {
    const result = await this.authService.setPassword(dto.token, dto.newPassword);
    return { data: result };
  }

  @Get('me')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getMe(@CurrentUser('id') userId: string) {
    const user = await this.authService.getMe(userId);
    return { data: user };
  }
}
