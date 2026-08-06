import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { FooterComponent } from "./shared/components/footer";
import { NavbarComponent } from "./shared/components/navbar";
import { NotificationComponent } from "./shared/components/notification";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    NotificationComponent,
  ],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <app-navbar />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-footer />
      <app-notification />
    </div>
  `,
})
export class AppComponent {}
