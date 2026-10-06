import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  ServeStaticModule,
  ServeStaticModuleOptions,
} from '@nestjs/serve-static';
import { ServerResponse } from 'http';
import { existsSync } from 'fs';
import { join } from 'path';
import { AddressesModule } from './addresses/addresses.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { CategoriesModule } from './categories/categories.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ContactModule } from './contact/contact.module';
import { CustomersModule } from './customers/customers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentModule } from './payment/payment.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { ProductsModule } from './products/products.module';
import { SettingsModule } from './settings/settings.module';
import { UploadModule } from './upload/upload.module';

const FRONTEND_ROOT = join(process.cwd(), 'dist', 'frontend', 'browser');

/**
 * `/uploads`, plus the production Angular build when one exists (it doesn't
 * under `npm run start:backend`, where the Angular dev server owns the UI).
 */
function staticRoots(): ServeStaticModuleOptions[] {
  const uploads: ServeStaticModuleOptions = {
    rootPath: join(process.cwd(), 'uploads'),
    serveRoot: '/uploads',
    // No index.html fallback here: a missing upload should be a plain 404,
    // not an ENOENT message that leaks the server's filesystem path.
    exclude: ['/uploads/{*path}'],
  };
  if (!existsSync(join(FRONTEND_ROOT, 'index.html'))) return [uploads];

  // Same origin as the API. Unknown paths fall back to index.html so
  // client-side routes deep-link; /api, /uploads, and /docs stay with Nest so
  // they 404 as JSON instead.
  const frontend: ServeStaticModuleOptions = {
    rootPath: FRONTEND_ROOT,
    exclude: ['/api/{*path}', '/uploads/{*path}', '/docs/{*path}'],
    serveStaticOptions: {
      setHeaders: (res: ServerResponse, path: string) => {
        // Hashed bundles can be cached forever; index.html must be revalidated
        // so a deploy is picked up on the next load.
        res.setHeader(
          'Cache-Control',
          path.endsWith('.html')
            ? 'no-cache'
            : 'public, max-age=31536000, immutable',
        );
      },
    },
  };
  return [uploads, frontend];
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot(...staticRoots()),
    PrismaModule,
    AuthModule,
    UploadModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    AddressesModule,
    OrdersModule,
    PaymentModule.register(),
    PortfolioModule,
    ContactModule,
    SettingsModule,
    CustomersModule,
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
