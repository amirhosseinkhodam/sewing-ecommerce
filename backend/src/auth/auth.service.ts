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
import type { UserModel } from '../../../shared/models/user';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './jwt.strategy';

const USER_OMIT = {
  password: true,
  createdAt: true,
  updatedAt: true,
} as const;

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
      data: { ...dto, password },
      omit: USER_OMIT,
    });

    return {
      ...(await this.#signTokens(user)),
      user,
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

    const { password, createdAt, updatedAt, ...publicUser } = user;
    return {
      ...(await this.#signTokens(user)),
      user: publicUser,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.#jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.#config.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.#prisma.user.findUnique({
        where: { id: payload.sub },
        omit: USER_OMIT,
      });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return {
        ...(await this.#signTokens(user)),
        user,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async me(userId: string): Promise<UserModel> {
    const user = await this.#prisma.user.findUnique({
      where: { id: userId },
      omit: USER_OMIT,
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserModel> {
    const data: Prisma.UserUpdateInput = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.#prisma.user.update({
      where: { id: userId },
      data,
      omit: USER_OMIT,
    });
    return user;
  }

  async #signTokens(
    user: Pick<User, 'id' | 'email' | 'role'>,
  ): Promise<TokenPair> {
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
}
