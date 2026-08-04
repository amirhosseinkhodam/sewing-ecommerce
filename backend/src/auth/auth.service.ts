import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import { Prisma, User } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './jwt.strategy';

interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}

@Injectable()
export class AuthService {
  readonly #prisma: PrismaService;
  readonly #jwt: JwtService;
  readonly #config: ConfigService;

  constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService) {
    this.#prisma = prisma;
    this.#jwt = jwt;
    this.#config = config;
  }

  async register(dto: RegisterDto) {
    const existing = await this.#prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });
    if (existing) {
      throw new ConflictException('Email or phone already registered');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.#prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        password,
      },
    });

    return {
      ...(await this.#signTokens(user)),
      user: this.#toUserResponse(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.#prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      ...(await this.#signTokens(user)),
      user: this.#toUserResponse(user),
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.#jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.#config.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.#prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return {
        ...(await this.#signTokens(user)),
        user: this.#toUserResponse(user),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async me(userId: string) {
    const user = await this.#prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.#toUserResponse(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.#prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.#toUserResponse(user);
  }

  async #signTokens(user: User): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessExpiresIn =
      this.#config.get<SignOptions['expiresIn']>('JWT_ACCESS_EXPIRES_IN') ??
      '15m';
    const refreshExpiresIn =
      this.#config.get<SignOptions['expiresIn']>('JWT_REFRESH_EXPIRES_IN') ??
      '7d';
    const [accessToken, refreshToken] = await Promise.all([
      this.#jwt.signAsync(payload, {
        secret: this.#config.get<string>('JWT_ACCESS_SECRET')!,
        expiresIn: accessExpiresIn,
      }),
      this.#jwt.signAsync(payload, {
        secret: this.#config.get<string>('JWT_REFRESH_SECRET')!,
        expiresIn: refreshExpiresIn,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  #toUserResponse(user: User) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}
