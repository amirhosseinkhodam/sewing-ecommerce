import { Component, inject } from "@angular/core";
import {
  MatBottomSheetModule,
  MatBottomSheetRef,
} from "@angular/material/bottom-sheet";
import { TranslatePipe } from "../pipes/translate";
import { ButtonComponent } from "./button";

@Component({
  selector: "app-confirm-bottom-sheet",
  standalone: true,
  imports: [MatBottomSheetModule, ButtonComponent, TranslatePipe],
  template: `
    <h3 class="mat-body-large mb-2 font-bold">
      {{ 'confirm' | translate }}
    </h3>
    <p class="mat-body-medium text-slate-500 dark:text-slate-400 mb-4">
      {{ 'confirm' | translate }}
    </p>
    <div class="flex gap-2 justify-end">
      <app-button variant="primary" (buttonClick)="onCancel()">
        {{ 'cancel' | translate }}
      </app-button>
      <app-button variant="mat-raised" color="warn" (buttonClick)="onConfirm()">
        {{ 'delete' | translate }}
      </app-button>
    </div>
  `,
})
export class ConfirmBottomSheetComponent {
  readonly #bottomSheetRef = inject(
    MatBottomSheetRef<ConfirmBottomSheetComponent>,
  );

  onConfirm(): void {
    this.#bottomSheetRef.dismiss(true);
  }

  onCancel(): void {
    this.#bottomSheetRef.dismiss(false);
  }
}
