import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app';
import { routes } from './app/main.route';
import { ThemeService } from './app/shared/services/theme';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(),
    provideRouter(routes),
    ThemeService,
  ],
}).catch((error) => console.error(error));
