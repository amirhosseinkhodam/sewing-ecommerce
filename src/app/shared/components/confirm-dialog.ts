import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from '../services/language';
import { ButtonComponent } from './button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, ButtonComponent],
  template: `
    <h2 mat-dialog-title>{{ t('confirm') }}</h2>
    <mat-dialog-content>
      {{ t('confirm') }}
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <app-button variant="primary" (buttonClick)="onCancel()">
        {{ t('cancel') }}
      </app-button>
      <app-button variant="mat-raised" color="warn" (buttonClick)="onConfirm()">
        {{ t('delete') }}
      </app-button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  readonly #dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  readonly #languageService = inject(LanguageService);

  t(key: string): string {
    return this.#languageService.translate(key);
  }

  onConfirm(): void {
    this.#dialogRef.close(true);
  }

  onCancel(): void {
    this.#dialogRef.close(false);
  }
}
