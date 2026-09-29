import { Service, inject, InjectionToken } from '@angular/core';
import { BrnDialogService } from '@spartan-ng/brain/dialog';
import { take } from 'rxjs';
import type { ModalDataModel } from '../models/modal';
import { ModalComponent } from '../components/modal';

export const DIALOG_DATA = new InjectionToken<ModalDataModel>('DIALOG_DATA');

/**
 * Confirm dialog on top of Spartan's `BrnDialog` (CDK Dialog underneath):
 * it owns focus trapping, focus restore, Escape/backdrop/outside dismissal
 * and the `role="dialog"` + `aria-modal` wiring, while `ModalComponent` keeps
 * the existing `app-*` markup and Tailwind styling. `open()` still resolves
 * `true` only when the confirm button was pressed.
 */
@Service()
export class ModalService {
  readonly #dialog = inject(BrnDialogService);

  open(data: ModalDataModel): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const ref = this.#dialog.open<Record<string, unknown>, boolean>(
        ModalComponent,
        undefined,
        undefined,
        {
          hasBackdrop: true,
          backdropClass: 'cdk-overlay-dark-backdrop',
          panelClass: 'modal-panel',
          providers: [{ provide: DIALOG_DATA, useValue: data }],
        },
      );

      ref.closed$.pipe(take(1)).subscribe((result) => resolve(result ?? false));
    });
  }
}
