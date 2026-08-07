import { Component, inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import type { ModalDataModel } from '../models/modal';
import { TranslatePipe } from '../pipes/translate';
import { ButtonComponent } from './button';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [
    MatDialogModule,
    MatBottomSheetModule,
    ButtonComponent,
    TranslatePipe,
  ],
  template: `
    <div
      class="p-4"
      role="dialog"
      [attr.aria-labelledby]="titleId"
      [attr.aria-describedby]="descId"
    >
      <h2 [id]="titleId" class="text-lg font-bold text-slate-900 mb-2">
        {{ data.title | translate }}
      </h2>
      <p [id]="descId" class="text-slate-500 mb-4">
        {{ data.description | translate }}
      </p>
      <div class="flex gap-2 justify-center">
        <app-button variant="primary" (buttonClick)="onCancel()">
          {{ data.cancelLabel ?? 'cancel' | translate }}
        </app-button>
        <app-button
          variant="mat-raised"
          [color]="data.confirmCssClass ? 'success' : 'warn'"
          (buttonClick)="onConfirm()"
        >
          {{ data.confirmLabel ?? 'confirm' | translate }}
        </app-button>
      </div>
    </div>
  `,
})
export class ModalComponent {
  readonly data: ModalDataModel =
    inject(MAT_DIALOG_DATA, { optional: true }) ??
    inject(MAT_BOTTOM_SHEET_DATA, { optional: true });

  readonly #dialogRef = inject(MatDialogRef, { optional: true });
  readonly #bottomSheetRef = inject(MatBottomSheetRef, { optional: true });

  readonly titleId = `modal-title-${Math.random().toString(36).slice(2, 8)}`;
  readonly descId = `modal-desc-${Math.random().toString(36).slice(2, 8)}`;

  onConfirm(): void {
    this.#dialogRef?.close(true);
    this.#bottomSheetRef?.dismiss(true);
  }

  onCancel(): void {
    this.#dialogRef?.close(false);
    this.#bottomSheetRef?.dismiss(false);
  }
}
