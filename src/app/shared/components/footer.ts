import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LanguageService } from "../services/language";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-slate-900 dark:bg-slate-950 text-slate-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="col-span-1 md:col-span-2">
            <h3 class="text-lg font-bold text-white mb-4">
              {{ t("appName") }}
            </h3>
            <p class="text-sm text-slate-400 leading-relaxed max-w-md">
              {{ t("aboutUs") }}
            </p>
          </div>

          <div>
            <h4
              class="text-sm font-semibold text-white uppercase tracking-wider mb-4"
            >
              {{ t("quickLinks") }}
            </h4>
            <ul class="space-y-2">
              <li>
                <a
                  routerLink="/products"
                  class="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {{ t("products") }}
                </a>
              </li>
              <li>
                <a
                  routerLink="/portfolio"
                  class="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {{ t("portfolio") }}
                </a>
              </li>
              <li>
                <a
                  routerLink="/about"
                  class="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {{ t("about") }}
                </a>
              </li>
              <li>
                <a
                  routerLink="/contact"
                  class="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {{ t("contact") }}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4
              class="text-sm font-semibold text-white uppercase tracking-wider mb-4"
            >
              {{ t("contactUs") }}
            </h4>
            <ul class="space-y-2">
              <li class="flex items-center gap-2 text-sm text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {{ t("address") }}
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {{ t("phoneNumber") }}
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t border-slate-800">
          <p class="text-center text-sm text-slate-500">
            &copy; {{ currentYear }} {{ t("appName") }}.
            {{ t("allRightsReserved") }}
          </p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  readonly #languageService = inject(LanguageService);
  readonly currentYear = new Date().getFullYear();

  t(key: string): string {
    return this.#languageService.translate(key);
  }
}
