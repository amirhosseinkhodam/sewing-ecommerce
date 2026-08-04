import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const configMock = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return values[key];
    }),
  };

  const jwtMock = {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  const registerDto = {
    firstName: 'Ali',
    lastName: 'Reza',
    email: 'ali@example.com',
    phone: '09120000000',
    password: 'password123',
  };

  const createdUser = {
    id: 'user-1',
    firstName: 'Ali',
    lastName: 'Reza',
    email: 'ali@example.com',
    phone: '09120000000',
    role: 'CUSTOMER' as const,
    password: 'hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('register', () => {
    it('creates a customer and returns tokens + sanitized user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          firstName: 'Ali',
          lastName: 'Reza',
          email: 'ali@example.com',
          phone: '09120000000',
          password: expect.any(String) as string,
        },
      });
      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(result.user).toEqual({
        id: 'user-1',
        firstName: 'Ali',
        lastName: 'Reza',
        email: 'ali@example.com',
        phone: '09120000000',
        role: 'CUSTOMER',
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('throws ConflictException when email or phone already exists', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });
});
