import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { injectShopSettingsQuery } from './features/settings/query/settings';
import { FooterComponent } from './shared/components/footer';
import { NavbarComponent } from './shared/components/navbar';
import { NotificationComponent } from './shared/components/notification';
import { SeoService, type PageSeoModel } from './shared/services/seo';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    NotificationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <app-navbar />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-footer
        [phone]="shop()?.shopPhone ?? ''"
        [address]="shop()?.shopAddress ?? ''"
      />
      <app-notification />
    </div>
  `,
})
export class AppComponent {
  readonly #settingsQuery = injectShopSettingsQuery();
  readonly shop = computed(() => this.#settingsQuery.data() ?? null);

  readonly #router = inject(Router);
  readonly #activatedRoute = inject(ActivatedRoute);
  readonly #seo = inject(SeoService);

  constructor() {
    // Child route data wins over a parent's (e.g. an admin page's own
    // titleKey over the `/admin` shell's bare `noindex`), so data objects
    // along the active chain are merged outer to inner before being applied.
    const subscription = this.#router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.#seo.setPage(this.#resolvePageSeo()));
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());

    // The route is already active on first load, so run once immediately —
    // NavigationEnd only fires on subsequent navigations.
    this.#seo.setPage(this.#resolvePageSeo());
  }

  #resolvePageSeo(): PageSeoModel {
    let route = this.#activatedRoute.root;
    let data: Record<string, unknown> = {};
    while (route.firstChild) {
      route = route.firstChild;
      data = { ...data, ...route.snapshot.data };
    }
    return {
      titleKey: (data['titleKey'] as string) ?? 'appName',
      descriptionKey: (data['descriptionKey'] as string) ?? 'seo.home',
      noindex: Boolean(data['noindex']),
    };
  }
}
