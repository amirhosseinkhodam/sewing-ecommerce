import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon';
import Location01Icon from '@hugeicons/core-free-icons/Location01Icon';
import Scissor01Icon from '@hugeicons/core-free-icons/Scissor01Icon';
import SmartPhone01Icon from '@hugeicons/core-free-icons/SmartPhone01Icon';

import { ButtonComponent } from '@shared/components/button';
import { CardComponent } from '@shared/components/card';
import { TranslatePipe } from '@shared/pipes/translate';
import { injectShopSettingsQuery } from '../../settings/query/settings';

/**
 * Static content page. Copy lives in the i18n dictionaries (owner's decision);
 * Phase 6's SettingsPage is where it becomes admin-editable.
 */
@Component({
  selector: 'app-about',
  imports: [
    ButtonComponent,
    CardComponent,
    HugeiconsIconComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3">
        <span
          class="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500"
        >
          <hugeicons-icon
            [icon]="icons.Scissor01Icon"
            [size]="22"
            color="currentColor"
            [strokeWidth]="1.5"
          />
        </span>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {{ 'aboutUs' | translate }}
        </h1>
      </div>

      <div class="flex flex-col gap-4 mt-6">
        <p class="text-slate-600 dark:text-slate-300 leading-relaxed">
          {{ 'aboutIntro' | translate }}
        </p>
        <p class="text-slate-600 dark:text-slate-300 leading-relaxed">
          {{ 'aboutStory' | translate }}
        </p>
        <p class="text-slate-600 dark:text-slate-300 leading-relaxed">
          {{ 'aboutQuality' | translate }}
        </p>
      </div>

      <app-card variant="bordered" cssClass="mt-8">
        <h2 class="font-bold text-slate-900 dark:text-slate-100 mb-4">
          {{ 'getInTouch' | translate }}
        </h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="flex items-start gap-3">
            <hugeicons-icon
              [icon]="icons.Location01Icon"
              [size]="18"
              color="currentColor"
              [strokeWidth]="1.5"
              class="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0"
            />
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ 'address' | translate }}
              </p>
              <p class="text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                {{ shop()?.shopAddress }}
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <hugeicons-icon
              [icon]="icons.SmartPhone01Icon"
              [size]="18"
              color="currentColor"
              [strokeWidth]="1.5"
              class="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0"
            />
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ 'phoneNumber' | translate }}
              </p>
              <p
                class="text-sm text-slate-900 dark:text-slate-100 mt-0.5"
                dir="ltr"
              >
                {{ shop()?.shopPhone }}
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <hugeicons-icon
              [icon]="icons.Clock01Icon"
              [size]="18"
              color="currentColor"
              [strokeWidth]="1.5"
              class="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0"
            />
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ 'workingHours' | translate }}
              </p>
              <p class="text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                {{ shop()?.businessHours }}
              </p>
            </div>
          </div>
        </div>
      </app-card>

      <div class="flex flex-wrap gap-3 mt-8">
        <app-button variant="primary" (buttonClick)="onPortfolio()">
          {{ 'ourWork' | translate }}
        </app-button>
        <app-button variant="secondary" (buttonClick)="onContact()">
          {{ 'contactUs' | translate }}
        </app-button>
      </div>
    </div>
  `,
})
export class AboutComponent {
  readonly icons = {
    Scissor01Icon,
    Location01Icon,
    SmartPhone01Icon,
    Clock01Icon,
  };
  /** Shop details are admin-editable, so they are read from settings. */
  readonly #settingsQuery = injectShopSettingsQuery();
  readonly shop = computed(() => this.#settingsQuery.data() ?? null);

  readonly #router = inject(Router);

  onPortfolio() {
    void this.#router.navigate(['/portfolio']);
  }

  onContact() {
    void this.#router.navigate(['/contact']);
  }
}
