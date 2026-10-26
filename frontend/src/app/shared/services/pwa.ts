import {
  DestroyRef,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const IOS_HINT_KEY = 'pwa-ios-hint-dismissed';

@Injectable({ providedIn: 'root' })
export class PwaService {
  readonly #swUpdate = inject(SwUpdate);

  readonly #online = signal(navigator.onLine);
  readonly #updateReady = signal(false);
  readonly #installEvent = signal<BeforeInstallPromptEvent | null>(null);
  readonly #iosHintDismissed = signal(
    localStorage.getItem(IOS_HINT_KEY) === '1',
  );

  readonly online = this.#online.asReadonly();
  readonly updateReady = this.#updateReady.asReadonly();
  readonly canInstall = computed(() => this.#installEvent() !== null);
  readonly showIosHint = computed(
    () => this.#isIos() && !this.#isStandalone() && !this.#iosHintDismissed(),
  );

  constructor() {
    const goOnline = () => this.#online.set(true);
    const goOffline = () => this.#online.set(false);
    const captureInstall = (event: Event) => {
      event.preventDefault();
      this.#installEvent.set(event as BeforeInstallPromptEvent);
    };
    const clearInstall = () => this.#installEvent.set(null);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener('beforeinstallprompt', captureInstall);
    window.addEventListener('appinstalled', clearInstall);

    const subscription = this.#swUpdate.isEnabled
      ? this.#swUpdate.versionUpdates.subscribe((event) => {
          if (event.type === 'VERSION_READY') this.#updateReady.set(true);
        })
      : null;

    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('beforeinstallprompt', captureInstall);
      window.removeEventListener('appinstalled', clearInstall);
      subscription?.unsubscribe();
    });
  }

  async install(): Promise<void> {
    const event = this.#installEvent();
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    this.#installEvent.set(null);
  }

  async applyUpdate(): Promise<void> {
    await this.#swUpdate.activateUpdate();
    location.reload();
  }

  dismissIosHint(): void {
    localStorage.setItem(IOS_HINT_KEY, '1');
    this.#iosHintDismissed.set(true);
  }

  #isIos(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  #isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }
}
