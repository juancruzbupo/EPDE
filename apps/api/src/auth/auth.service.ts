import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { BCRYPT_SALT_ROUNDS } from '@epde/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
    return user;
  }

  async login(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
    });

    const fullUser = await this.usersService.findById(user.id);
    const { passwordHash: _, ...userWithoutPassword } = fullUser;
    void _;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findById(payload.sub);

      const newPayload = { sub: user.id, email: user.email, role: user.role };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedException('Token de refresco inválido');
    }
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
