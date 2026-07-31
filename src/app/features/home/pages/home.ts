import { Component } from "@angular/core";
import { ButtonComponent } from "../../../shared/components/button";
import { CardComponent } from "../../../shared/components/card";
import { LanguageToggleComponent } from "../../../shared/components/language-toggle";
import { ThemeToggleComponent } from "../../../shared/components/theme-toggle";
import { TranslatePipe } from "../../../shared/pipes/translate";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CardComponent,
    ButtonComponent,
    ThemeToggleComponent,
    LanguageToggleComponent,
    TranslatePipe,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6">
      <app-card variant="bordered" [cssClass]="'max-w-md w-full'">
        <div class="flex flex-col items-center gap-6">
          <div class="flex gap-3">
            <app-theme-toggle />
            <app-language-toggle />
          </div>

          <div class="text-center">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ 'appName' | translate }}
            </h1>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Angular 19 + Tailwind + i18n + Dark Mode
            </p>
          </div>

          <div class="flex gap-3">
            <app-button variant="primary" (buttonClick)="onGetStarted()">
              {{ 'home' | translate }}
            </app-button>
            <app-button variant="secondary" (buttonClick)="onSettings()">
              {{ 'settings' | translate }}
            </app-button>
          </div>
        </div>
      </app-card>
    </div>
  `,
})
export class HomeComponent {
  onGetStarted(): void {
    // Add your navigation or logic here
  }

  onSettings(): void {
    // Add your navigation or logic here
  }
}
