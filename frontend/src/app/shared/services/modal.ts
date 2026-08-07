import { inject, Injectable } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Observable } from 'rxjs';
import { ModalComponent } from '../components/modal';
import type { ModalDataModel } from '../models/modal';

@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly #dialog = inject(MatDialog);
  readonly #bottomSheet = inject(MatBottomSheet);
  readonly #breakpointObserver = inject(BreakpointObserver);

  open(data: ModalDataModel): Observable<boolean> {
    if (this.#breakpointObserver.isMatched('(max-width: 767px)')) {
      return this.#bottomSheet
        .open(ModalComponent, { data })
        .afterDismissed();
    }
    return this.#dialog.open(ModalComponent, { data }).afterClosed();
  }
}
