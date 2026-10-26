import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PwaService } from '../services/pwa';
import { TranslatePipe } from '../pipes/translate';

@Component({
  selector: 'app-pwa-banner',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="fixed bottom-4 inset-x-4 z-50 mx-auto flex max-w-md flex-col gap-2 empty:hidden"
      aria-live="polite"
    >
      @if (!pwa.online()) {
        <div
          role="status"
          class="rounded-lg border border-amber-200 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-700 shadow-lg dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          {{ 'pwa.offline' | translate }}
        </div>
      }
      @if (pwa.updateReady()) {
        <div
          role="status"
          class="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-100 px-4 py-3 text-sm text-blue-700 shadow-lg dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        >
          <span class="flex-1 font-medium">{{
            'pwa.updateReady' | translate
          }}</span>
          <button
            type="button"
            class="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white cursor-pointer"
            (click)="pwa.applyUpdate()"
          >
            {{ 'pwa.reload' | translate }}
          </button>
        </div>
      }
      @if (pwa.canInstall()) {
        <div
          role="status"
          class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <span class="flex-1 font-medium">{{
            'pwa.installPrompt' | translate
          }}</span>
          <button
            type="button"
            class="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white cursor-pointer dark:bg-slate-100 dark:text-slate-900"
            (click)="pwa.install()"
          >
            {{ 'pwa.install' | translate }}
          </button>
        </div>
      }
      @if (pwa.showIosHint()) {
        <div
          role="status"
          class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <span class="flex-1">{{ 'pwa.iosHint' | translate }}</span>
          <button
            type="button"
            class="text-lg leading-none opacity-60 hover:opacity-100 cursor-pointer"
            [attr.aria-label]="'pwa.dismiss' | translate"
            (click)="pwa.dismissIosHint()"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `,
})
export class PwaBannerComponent {
  readonly pwa = inject(PwaService);
}
