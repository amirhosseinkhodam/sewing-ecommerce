import { Injectable, signal } from "@angular/core";
import type {
  NotificationModel,
  NotificationType,
} from "../models/notification";

@Injectable({ providedIn: "root" })
export class NotificationService {
  readonly #notification = signal<NotificationModel | null>(null);
  readonly #timer = signal<ReturnType<typeof setTimeout> | null>(null);
  readonly #duration = 3000;

  readonly notification = this.#notification.asReadonly();

  show(message: string, type: NotificationType = "error"): void {
    const existing = this.#timer();
    if (existing) clearTimeout(existing);

    this.#notification.set({ message, type });

    this.#timer.set(
      setTimeout(() => {
        this.#notification.set(null);
        this.#timer.set(null);
      }, this.#duration),
    );
  }

  dismiss(): void {
    const timer = this.#timer();
    if (timer) clearTimeout(timer);
    this.#notification.set(null);
    this.#timer.set(null);
  }
}
