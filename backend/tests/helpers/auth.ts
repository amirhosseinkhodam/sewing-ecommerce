import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { Role } from '../../src/generated/prisma/client';

const PASSWORD = 'password123';
// Cost 4 keeps hashing fast; production uses 10.
const BCRYPT_ROUNDS = 4;

/** Creates a user directly in the DB, logs in through the API, returns the session. */
export async function createSession(
  app: INestApplication,
  prisma: PrismaService,
  role: Role,
  phone = role === Role.ADMIN ? '09120000000' : '09121111111',
) {
  const user = await prisma.user.create({
    data: {
      firstName: role === Role.ADMIN ? 'Admin' : 'Customer',
      lastName: 'Test',
      phone,
      password: await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS),
      role,
    },
  });
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ phone, password: PASSWORD });
  const accessToken: string = res.body.accessToken;
  return { user, accessToken, bearer: `Bearer ${accessToken}` };
}
