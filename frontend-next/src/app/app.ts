import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LanguageService } from '@core/i18n/language';
import { AuthSessionStore } from '@core/auth/session';
import { ThemeService } from '@core/theme';

/**
 * Root shell. Composes the persistent chrome around the routed outlet and holds
 * no business logic of its own.
 */
@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, MatButtonModule, MatToolbarModule],
  template: `
    <div class="flex min-h-screen flex-col">
      <mat-toolbar
        ><a matButton routerLink="/">خیاطی</a><span class="flex-1"></span>
        @if (session.isAuthenticated()) {
          <a matButton routerLink="/profile">پروفایل</a>
          <button matButton (click)="logout()">خروج</button>
        } @else {
          <a matButton routerLink="/login">ورود</a> <a matButton routerLink="/register">ثبت نام</a>
        }
        <button matButton (click)="language.toggle()">
          {{ language.language() === 'fa' ? 'English' : 'فارسی' }}</button
        ><button matButton (click)="theme.toggle()">◐</button>
      </mat-toolbar>
      <main class="flex-1">
        <router-outlet />
      </main>
    </div>
  `,
})
export class App {
  readonly session = inject(AuthSessionStore);
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);
  constructor() {
    // Material Symbols (loaded in index.html) replaces the old Hugeicons
    // dependency, so every <mat-icon> resolves against it by default.
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
  }

  logout(): void {
    this.session.clear();
  }
}
