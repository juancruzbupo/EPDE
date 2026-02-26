import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import { AuthAuditService } from './auth-audit.service';
import { BCRYPT_SALT_ROUNDS } from '@epde/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly authAudit: AuthAuditService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.passwordHash) {
      return null;
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }
    if (user.status !== 'ACTIVE') {
      return null;
    }
    return user;
  }

  async login(
    user: { id: string; email: string; role: string },
    meta?: { clientType?: string; ip?: string },
  ) {
    const { accessToken, refreshToken } = await this.tokenService.generateTokenPair(user);

    const fullUser = await this.usersService.findById(user.id);
    const { passwordHash: _, ...userWithoutPassword } = fullUser;
    void _;

    this.authAudit.logLogin(user.id, user.email, meta?.clientType ?? 'web', meta?.ip ?? 'unknown');

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    return this.tokenService.rotateRefreshToken(refreshToken);
  }

  async logout(userId: string, jti?: string, family?: string, ttlSeconds?: number) {
    if (jti && ttlSeconds) {
      await this.tokenService.blacklistAccessToken(jti, ttlSeconds);
    }
    if (family) {
      await this.tokenService.revokeFamily(family);
    }
    this.authAudit.logLogout(userId, jti ?? 'unknown');
  }

  async setPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      if (user.status !== 'INVITED') {
        throw new BadRequestException('El usuario ya tiene contraseña configurada');
      }

      const hash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

      await this.usersService.update(user.id, {
        passwordHash: hash,
        status: 'ACTIVE',
      });

      this.authAudit.logPasswordSet(user.id);

      return { message: 'Contraseña configurada correctamente' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    const { passwordHash: _, ...userWithoutPassword } = user;
    void _;
    return userWithoutPassword;
  }
}
