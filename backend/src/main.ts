import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync } from 'fs';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { configureApp } from './common/configure-app';

async function bootstrap() {
  mkdirSync(join(process.cwd(), 'uploads'), { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  configureApp(app);
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  // The frontend is served from this same origin in production (and proxied
  // in dev), so CORS stays closed unless a separate origin is configured.
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) app.enableCors({ origin: corsOrigin.split(',') });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sewing Ecommerce API')
    .setDescription('REST API for the sewing shop ecommerce.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { tagsSorter: 'alpha', operationsSorter: 'alpha' },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`API running on http://localhost:${port}/api`);
}
void bootstrap();
