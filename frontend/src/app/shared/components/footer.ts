import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { HugeiconsIconComponent } from "@hugeicons/angular";
import { MapPinIcon, TelephoneIcon } from "@hugeicons/core-free-icons";
import { TranslatePipe } from "../pipes/translate";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [RouterLink, HugeiconsIconComponent, TranslatePipe],
  template: `
    <footer class="bg-slate-900 dark:bg-slate-950 text-slate-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="col-span-1 md:col-span-2">
            <h3 class="text-lg font-bold text-white mb-4">
              {{ 'appName' | translate }}
            </h3>
            <p class="text-sm text-slate-400 leading-relaxed max-w-md">
              {{ 'aboutUs' | translate }}
            </p>
          </div>

          <div>
            <h4
              class="text-sm font-semibold text-white uppercase tracking-wider mb-4"
            >
              {{ 'quickLinks' | translate }}
            </h4>
            <ul class="space-y-2">
              <li>
                <a
                  routerLink="/products"
                  class="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {{ 'products' | translate }}
                </a>
              </li>
              <li>
                <a
                  routerLink="/portfolio"
                  class="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {{ 'portfolio' | translate }}
                </a>
              </li>
              <li>
                <a
                  routerLink="/about"
                  class="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {{ 'about' | translate }}
                </a>
              </li>
              <li>
                <a
                  routerLink="/contact"
                  class="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {{ 'contact' | translate }}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4
              class="text-sm font-semibold text-white uppercase tracking-wider mb-4"
            >
              {{ 'contactUs' | translate }}
            </h4>
            <ul class="space-y-2">
              <li class="flex items-center gap-2 text-sm text-slate-400">
                <hugeicons-icon
                  [icon]="icons.MapPinIcon"
                  [size]="16"
                  color="currentColor"
                  [strokeWidth]="1.5"
                  class="shrink-0"
                />
                {{ 'address' | translate }}
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-400">
                <hugeicons-icon
                  [icon]="icons.TelephoneIcon"
                  [size]="16"
                  color="currentColor"
                  [strokeWidth]="1.5"
                  class="shrink-0"
                />
                {{ 'phoneNumber' | translate }}
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t border-slate-800">
          <p class="text-center text-sm text-slate-500">
            &copy; {{ currentYear }} {{ 'appName' | translate }}.
            {{ 'allRightsReserved' | translate }}
          </p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();

  readonly icons = { MapPinIcon, TelephoneIcon };
}
