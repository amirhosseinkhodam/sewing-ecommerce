import { INestApplication } from '@nestjs/common';
import { existsSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { Role } from '../src/generated/prisma/client';
import { createSession } from './helpers/auth';
import { createTestApp, resetDatabase } from './helpers/app';

const UPLOADS_DIR = join(process.cwd(), 'uploads');
const MAX_BYTES = 5 * 1024 * 1024;
const PNG = Buffer.from('89504e470d0a1a0a', 'hex');

describe('upload', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let bearer: string;
  const created: string[] = [];

  const http = () => request(app.getHttpServer());
  const filesOnDisk = () =>
    existsSync(UPLOADS_DIR) ? readdirSync(UPLOADS_DIR) : [];

  /** Remembers stored files so afterAll can delete exactly what the tests wrote. */
  const track = (urls: string[]) => {
    for (const url of urls) created.push(url.replace('/uploads/', ''));
  };

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDatabase(prisma);
    ({ bearer } = await createSession(app, prisma, Role.CUSTOMER));
  });

  afterAll(async () => {
    for (const name of created) rmSync(join(UPLOADS_DIR, name), { force: true });
    await app.close();
  });

  it('requires authentication', async () => {
    const before = filesOnDisk();

    const res = await http()
      .post('/api/upload')
      .attach('file', PNG, 'a.png');

    expect(res.status).toBe(401);
    expect(filesOnDisk()).toEqual(before);
  });

  it('stores an image under a random name and returns a relative /uploads URL', async () => {
    const res = await http()
      .post('/api/upload')
      .set('Authorization', bearer)
      .attach('file', PNG, { filename: 'Photo.PNG', contentType: 'image/png' });
    track([res.body.url]);

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);
    expect(res.body.url).not.toContain('Photo');
    expect(filesOnDisk()).toContain(res.body.url.replace('/uploads/', ''));
  });

  it('accepts jpeg, webp and gif too', async () => {
    const cases = [
      ['a.jpg', 'image/jpeg'],
      ['a.jpeg', 'image/jpeg'],
      ['a.webp', 'image/webp'],
      ['a.gif', 'image/gif'],
    ] as const;

    for (const [filename, contentType] of cases) {
      const res = await http()
        .post('/api/upload')
        .set('Authorization', bearer)
        .attach('file', PNG, { filename, contentType });
      track([res.body.url]);

      expect(res.status).toBe(201);
    }
  });

  it.each([
    ['a script', 'evil.js', 'application/javascript'],
    ['an html page', 'page.html', 'text/html'],
    ['an svg', 'logo.svg', 'image/svg+xml'],
    ['a pdf', 'doc.pdf', 'application/pdf'],
    ['an allowed type with a bad extension', 'photo.exe', 'image/png'],
    ['an allowed extension with a bad type', 'photo.png', 'text/html'],
  ])('rejects %s with 400 and writes nothing', async (_label, filename, contentType) => {
    const before = filesOnDisk();

    const res = await http()
      .post('/api/upload')
      .set('Authorization', bearer)
      .attach('file', PNG, { filename, contentType });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'Only JPEG, PNG, WebP or GIF images are allowed',
    );
    expect(filesOnDisk()).toEqual(before);
  });

  it('rejects a file over 5 MB with 413', async () => {
    const before = filesOnDisk();

    const res = await http()
      .post('/api/upload')
      .set('Authorization', bearer)
      .attach('file', Buffer.alloc(MAX_BYTES + 1), {
        filename: 'big.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(413);
    expect(filesOnDisk()).toEqual(before);
  });

  // A file of exactly MAX_BYTES is refused too: multer's limit is exclusive.
  it('accepts a file just under 5 MB', async () => {
    const res = await http()
      .post('/api/upload')
      .set('Authorization', bearer)
      .attach('file', Buffer.alloc(MAX_BYTES - 1), {
        filename: 'limit.png',
        contentType: 'image/png',
      });
    if (res.body.url) track([res.body.url]);

    expect(res.status).toBe(201);
  });

  it('returns { url: null } when no file is sent', async () => {
    const res = await http().post('/api/upload').set('Authorization', bearer);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ url: null });
  });

  describe('POST /api/upload/multiple', () => {
    it('requires authentication', async () => {
      const res = await http()
        .post('/api/upload/multiple')
        .attach('files', PNG, 'a.png');

      expect(res.status).toBe(401);
    });

    it('stores several images and returns their URLs in order', async () => {
      const res = await http()
        .post('/api/upload/multiple')
        .set('Authorization', bearer)
        .attach('files', PNG, { filename: 'a.png', contentType: 'image/png' })
        .attach('files', PNG, { filename: 'b.gif', contentType: 'image/gif' });
      track(res.body.urls ?? []);

      expect(res.status).toBe(201);
      expect(res.body.urls).toHaveLength(2);
      expect(res.body.urls[0]).toMatch(/\.png$/);
      expect(res.body.urls[1]).toMatch(/\.gif$/);
    });

    it('rejects more than 10 files', async () => {
      const before = filesOnDisk();
      let req = http().post('/api/upload/multiple').set('Authorization', bearer);
      for (let i = 0; i < 11; i += 1) {
        req = req.attach('files', PNG, {
          filename: `f${i}.png`,
          contentType: 'image/png',
        });
      }

      const res = await req;

      expect(res.status).toBe(400);
      expect(filesOnDisk().length).toBeLessThanOrEqual(before.length + 10);
    });

    it('rejects the whole batch when one file has a bad type', async () => {
      const res = await http()
        .post('/api/upload/multiple')
        .set('Authorization', bearer)
        .attach('files', PNG, { filename: 'ok.png', contentType: 'image/png' })
        .attach('files', PNG, {
          filename: 'bad.js',
          contentType: 'application/javascript',
        });

      expect(res.status).toBe(400);
    });

    it('returns an empty list when no files are sent', async () => {
      const res = await http()
        .post('/api/upload/multiple')
        .set('Authorization', bearer);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ urls: [] });
    });
  });
});
