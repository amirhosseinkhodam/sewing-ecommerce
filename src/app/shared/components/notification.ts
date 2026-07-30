import { Component, inject } from "@angular/core";
import { NotificationService } from "../services/notification";

@Component({
  selector: "app-notification",
  standalone: true,
  template: `
    @if (notification(); as notif) {
      <div
        class="fixed top-4 left-1/2 -translate-x-1/2 z-50 cursor-pointer rounded-lg"
        [class]="typeClasses[notif.type]"
        (click)="dismiss()"
      >
        <div
          class="flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md"
        >
          <span class="text-sm font-medium">{{ notif.message }}</span>
          <button
            class="ms-auto text-current opacity-60 hover:opacity-100 text-lg leading-none"
            (click)="dismiss(); $event.stopPropagation()"
          >
            &times;
          </button>
        </div>
      </div>
    }
  `,
})
export class NotificationComponent {
  readonly #notificationService = inject(NotificationService);
  readonly notification = this.#notificationService.notification;

  readonly typeClasses: Record<string, string> = {
    error:
      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
    success:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
    warning:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
  };

  dismiss(): void {
    this.#notificationService.dismiss();
  }
}
