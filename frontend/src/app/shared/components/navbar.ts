import { Component, inject, signal } from "@angular/core";
import { NgClass } from "@angular/common";
import { RouterLink } from "@angular/router";
import { HugeiconsIconComponent } from "@hugeicons/angular";
import {
  ShoppingCart01Icon,
  Cancel01Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import { TranslatePipe } from "../pipes/translate";
import { ThemeToggleComponent } from "./theme-toggle";
import { LanguageToggleComponent } from "./language-toggle";
import { AuthStore } from "../../features/auth/store/auth";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [
    NgClass,
    RouterLink,
    HugeiconsIconComponent,
    TranslatePipe,
    ThemeToggleComponent,
    LanguageToggleComponent,
  ],
  template: `
    <nav
      class="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-8">
            <a
              routerLink="/"
              class="text-xl font-bold text-slate-900 dark:text-white"
            >
              {{ 'appName' | translate }}
            </a>

            <div class="hidden md:flex items-center gap-6">
              <a
                routerLink="/products"
                class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {{ 'products' | translate }}
              </a>
              <a
                routerLink="/portfolio"
                class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {{ 'portfolio' | translate }}
              </a>
              <a
                routerLink="/about"
                class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {{ 'about' | translate }}
              </a>
              <a
                routerLink="/contact"
                class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {{ 'contact' | translate }}
              </a>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <app-theme-toggle />
            <app-language-toggle />

            <a
              routerLink="/cart"
              class="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              [attr.aria-label]="'cart' | translate"
            >
              <hugeicons-icon
                [icon]="icons.ShoppingCart01Icon"
                [size]="24"
                color="currentColor"
                [strokeWidth]="1.5"
              />
              @if (store.isLoggedIn() && cartCount() > 0) {
                <span
                  class="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full"
                >
                  {{ cartCount() > 99 ? "99+" : cartCount() }}
                </span>
              }
            </a>

            @if (store.isLoggedIn()) {
              <div class="relative">
                <button
                  type="button"
                  class="flex items-center gap-2 p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  (click)="profileDropdownOpen.set(!profileDropdownOpen())"
                >
                  <div
                    class="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    {{ userInitials() }}
                  </div>
                </button>

                @if (profileDropdownOpen()) {
                  <div
                    class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50"
                    (click)="profileDropdownOpen.set(false)"
                  >
                    @if (store.user(); as user) {
                      <div
                        class="px-4 py-2 border-b border-slate-200 dark:border-slate-700"
                      >
                        <p
                          class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate"
                        >
                          {{ user.firstName }} {{ user.lastName }}
                        </p>
                        <p
                          class="text-xs text-slate-500 dark:text-slate-400 truncate"
                        >
                          {{ user.email }}
                        </p>
                      </div>
                    }
                    <a
                      routerLink="/profile"
                      class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      {{ 'profile' | translate }}
                    </a>
                    <a
                      routerLink="/orders"
                      class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      {{ 'orders' | translate }}
                    </a>
                    @if (store.isAdmin()) {
                      <a
                        routerLink="/admin"
                        class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        {{ 'admin' | translate }}
                      </a>
                    }
                    <hr class="my-1 border-slate-200 dark:border-slate-700" />
                    <button
                      type="button"
                      class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      (click)="store.logout()"
                    >
                      {{ 'logout' | translate }}
                    </button>
                  </div>
                }
              </div>
            } @else {
              <a
                routerLink="/login"
                class="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {{ 'login' | translate }}
              </a>
              <a
                routerLink="/register"
                class="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-600 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors"
              >
                {{ 'register' | translate }}
              </a>
            }

            <button
              type="button"
              class="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              (click)="mobileMenuOpen.set(!mobileMenuOpen())"
              [attr.aria-label]="mobileMenuOpen() ? 'Close menu' : 'Open menu'"
            >
              @if (mobileMenuOpen()) {
                <hugeicons-icon
                  [icon]="icons.Cancel01Icon"
                  [size]="24"
                  color="currentColor"
                  [strokeWidth]="1.5"
                />
              } @else {
                <hugeicons-icon
                  [icon]="icons.Menu01Icon"
                  [size]="24"
                  color="currentColor"
                  [strokeWidth]="1.5"
                />
              }
            </button>
          </div>
        </div>

        <div
          class="md:hidden absolute top-16 inset-x-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-lg z-40 origin-top transition-all duration-300 ease-in-out"
          [ngClass]="
            mobileMenuOpen()
              ? 'opacity-100 scale-y-100 pointer-events-auto'
              : 'opacity-0 scale-y-0 pointer-events-none'
          "
        >
          <div class="flex flex-col gap-1 py-3 px-4">
            <a
              routerLink="/products"
              class="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              (click)="mobileMenuOpen.set(false)"
            >
              {{ 'products' | translate }}
            </a>
            <a
              routerLink="/portfolio"
              class="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              (click)="mobileMenuOpen.set(false)"
            >
              {{ 'portfolio' | translate }}
            </a>
            <a
              routerLink="/about"
              class="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              (click)="mobileMenuOpen.set(false)"
            >
              {{ 'about' | translate }}
            </a>
            <a
              routerLink="/contact"
              class="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              (click)="mobileMenuOpen.set(false)"
            >
              {{ 'contact' | translate }}
            </a>
            @if (!store.isLoggedIn()) {
              <div
                class="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2"
              >
                <a
                  routerLink="/login"
                  class="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  (click)="mobileMenuOpen.set(false)"
                >
                  {{ 'login' | translate }}
                </a>
                <a
                  routerLink="/register"
                  class="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  (click)="mobileMenuOpen.set(false)"
                >
                  {{ 'register' | translate }}
                </a>
              </div>
            } @else {
              <div
                class="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2"
              >
                <a
                  routerLink="/profile"
                  class="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  (click)="mobileMenuOpen.set(false)"
                >
                  {{ 'profile' | translate }}
                </a>
                <a
                  routerLink="/orders"
                  class="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  (click)="mobileMenuOpen.set(false)"
                >
                  {{ 'orders' | translate }}
                </a>
                @if (store.isAdmin()) {
                  <a
                    routerLink="/admin"
                    class="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    (click)="mobileMenuOpen.set(false)"
                  >
                    {{ 'admin' | translate }}
                  </a>
                }
                <button
                  type="button"
                  class="w-full text-left px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  (click)="mobileMenuOpen.set(false); store.logout()"
                >
                  {{ 'logout' | translate }}
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  readonly store = inject(AuthStore);

  readonly icons = { ShoppingCart01Icon, Cancel01Icon, Menu01Icon };

  readonly mobileMenuOpen = signal(false);
  readonly profileDropdownOpen = signal(false);
  readonly cartCount = signal(0);

  readonly userInitials = () => {
    const user = this.store.user();
    if (!user) return "";
    return `${user.firstName[0]}${user.lastName[0]}`;
  };
}
