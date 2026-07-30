import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LanguageService } from "../../../shared/services/language";
import { CardComponent } from "../../../shared/components/card";
import { ButtonComponent } from "../../../shared/components/button";
import { AuthStore } from "../store/auth";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [RouterLink, CardComponent, ButtonComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-8">
      @if (store.user(); as user) {
        <app-card variant="bordered">
          <div class="flex flex-col gap-6">
            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-500 dark:text-slate-400"
              >
                {{ user.firstName[0] }}{{ user.lastName[0] }}
              </div>
              <div>
                <h1
                  class="text-xl font-bold text-slate-900 dark:text-slate-100"
                >
                  {{ user.firstName }} {{ user.lastName }}
                </h1>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  {{ user.email }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ t("firstName") }}
                </p>
                <p
                  class="text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  {{ user.firstName }}
                </p>
              </div>
              <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ t("lastName") }}
                </p>
                <p
                  class="text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  {{ user.lastName }}
                </p>
              </div>
              <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ t("email") }}
                </p>
                <p
                  class="text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  {{ user.email }}
                </p>
              </div>
              <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ t("phone") }}
                </p>
                <p
                  class="text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  {{ user.phone }}
                </p>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <app-button variant="secondary" routerLink="/orders">
                {{ t("myOrders") }}
              </app-button>
              <app-button variant="secondary" routerLink="/addresses">
                {{ t("myAddresses") }}
              </app-button>
              <app-button variant="destructive" (buttonClick)="store.logout()">
                {{ t("logout") }}
              </app-button>
            </div>
          </div>
        </app-card>
      } @else if (store.loading()) {
        <div class="flex items-center justify-center py-20">
          <p class="text-slate-500 dark:text-slate-400">{{ t("loading") }}</p>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <p class="text-slate-500 dark:text-slate-400">
            {{ t("loginRequired") }}
          </p>
          <app-button variant="primary" routerLink="/login">
            {{ t("login") }}
          </app-button>
        </div>
      }
    </div>
  `,
})
export class ProfileComponent {
  readonly #languageService = inject(LanguageService);
  readonly store = inject(AuthStore);

  t(key: string): string {
    return this.#languageService.translate(key);
  }
}
