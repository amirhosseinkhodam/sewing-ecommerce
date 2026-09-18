import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';

/**
 * Root shell. Composes the persistent chrome around the routed outlet and holds
 * no business logic of its own.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <div class="flex min-h-screen flex-col">
      <main class="flex-1">
        <router-outlet />
      </main>
    </div>
  `,
})
export class App {
  constructor() {
    // Material Symbols (loaded in index.html) replaces the old Hugeicons
    // dependency, so every <mat-icon> resolves against it by default.
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
  }
}
