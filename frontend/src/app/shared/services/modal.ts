import {
  Service,
  inject,
  InjectionToken,
  Injector,
  ApplicationRef,
  createComponent,
} from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import type { ModalDataModel } from '../models/modal';
import { ModalComponent } from '../components/modal';

export const DIALOG_DATA = new InjectionToken<ModalDataModel>('DIALOG_DATA');

export class DialogRef {
  close(result?: boolean): void {
    this.#overlayRef.dispose();
    this.#resolve(result ?? false);
  }

  readonly #overlayRef: import('@angular/cdk/overlay').OverlayRef;
  readonly #resolve: (value: boolean) => void;

  constructor(
    overlayRef: import('@angular/cdk/overlay').OverlayRef,
    resolve: (value: boolean) => void,
  ) {
    this.#overlayRef = overlayRef;
    this.#resolve = resolve;
  }
}

@Service()
export class ModalService {
  readonly #overlay = inject(Overlay);
  readonly #appRef = inject(ApplicationRef);
  readonly #parentInjector = inject(Injector);

  open(data: ModalDataModel): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const overlayRef = this.#overlay.create({
        hasBackdrop: true,
        backdropClass: 'cdk-overlay-dark-backdrop',
        panelClass: 'modal-panel',
        positionStrategy: this.#overlay
          .position()
          .global()
          .centerHorizontally()
          .centerVertically(),
        disposeOnNavigation: true,
      });

      const dialogRef = new DialogRef(overlayRef, resolve);

      const injector = Injector.create({
        parent: this.#parentInjector,
        providers: [
          { provide: DIALOG_DATA, useValue: data },
          { provide: DialogRef, useValue: dialogRef },
        ],
      });

      const componentRef = createComponent(ModalComponent, {
        environmentInjector: this.#appRef.injector,
        elementInjector: injector,
      });

      this.#appRef.attachView(componentRef.hostView);
      overlayRef.attach(componentRef.location.nativeElement);

      overlayRef.backdropClick().subscribe(() => dialogRef.close(false));
    });
  }
}
