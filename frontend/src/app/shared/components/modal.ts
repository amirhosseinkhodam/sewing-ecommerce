import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import {
  BrnDialogDescription,
  BrnDialogRef,
  BrnDialogTitle,
} from '@spartan-ng/brain/dialog';
import type { ModalDataModel } from '../models/modal';
import { DIALOG_DATA } from '../services/modal';
import { TranslatePipe } from '../pipes/translate';
import { ButtonComponent } from './button';

@Component({
  selector: 'app-modal',
  imports: [
    TranslatePipe,
    ButtonComponent,
    BrnDialogTitle,
    BrnDialogDescription,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'block p-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full',
  },
  template: `
    <h2
      brnDialogTitle
      class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2"
    >
      {{ data.title | translate }}
    </h2>
    <p brnDialogDescription class="text-slate-500 dark:text-slate-400 mb-4">
      {{ data.description | translate }}
    </p>
    <div class="flex gap-2 justify-center">
      <app-button variant="secondary" (buttonClick)="ref.close(false)">
        {{ data.cancelLabel ?? 'cancel' | translate }}
      </app-button>
      <app-button
        [variant]="data.confirmCssClass ? 'success' : 'destructive'"
        (buttonClick)="ref.close(true)"
      >
        {{ data.confirmLabel ?? 'confirm' | translate }}
      </app-button>
    </div>
  `,
})
export class ModalComponent {
  readonly data = inject<ModalDataModel>(DIALOG_DATA);
  readonly ref = inject(BrnDialogRef);
}
