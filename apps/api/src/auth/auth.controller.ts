import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { loginSchema, setPasswordSchema } from '@epde/shared';
import type { LoginInput, SetPasswordInput } from '@epde/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE_NAME = 'access_token';
const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 15 * 60 * 1000, // 15 minutes — must match JWT_EXPIRATION
};

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    const user = req.user as { id: string; email: string; role: string };
    const isMobile = req.headers['x-client-type'] === 'mobile';
    const result = await this.authService.login(user, {
      clientType: isMobile ? 'mobile' : 'web',
      ip: req.ip,
    });

    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

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
  @Throttle({ medium: { limit: 30, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: { refreshToken?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isMobile = req.headers['x-client-type'] === 'mobile';
    const refreshToken = isMobile ? body?.refreshToken : req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No se encontró token de refresco',
      });
      return;
    }

    const result = await this.authService.refresh(refreshToken);
    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

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
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: { id: string; jti?: string; family?: string; exp?: number },
    @Res({ passthrough: true }) res: Response,
  ) {
    const ttlSeconds = user.exp ? Math.max(0, user.exp - Math.floor(Date.now() / 1000)) : 0;
    await this.authService.logout(user.id, user.jti, user.family, ttlSeconds);

    res.clearCookie(ACCESS_COOKIE_NAME, { path: '/' });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
    return { data: { message: 'Sesión cerrada' } };
  }

  @Public()
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(@Body(new ZodValidationPipe(setPasswordSchema)) dto: SetPasswordInput) {
    const result = await this.authService.setPassword(dto.token, dto.newPassword);
    return { data: result };
  }

  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    const user = await this.authService.getMe(userId);
    return { data: user };
  }
}
