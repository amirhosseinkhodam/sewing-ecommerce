import { Service, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { LanguageService } from './language';

export interface PageSeoModel {
  /** i18n key for the browser tab title and `og:title`. */
  readonly titleKey: string;
  /** i18n key for `<meta name="description">` and `og:description`. */
  readonly descriptionKey: string;
  /** Admin screens: no reason for a crawler to index them. */
  readonly noindex?: boolean;
}

const SHOP_NAME_KEY = 'appName';

/**
 * Writes the document title and meta tags for the current route. This is a
 * pure SPA (no SSR), so these tags help the browser tab and JS-executing
 * crawlers; they are not present in the HTML a non-JS scraper would see —
 * `index.html`'s static fallback tags cover that case instead.
 */
@Service()
export class SeoService {
  readonly #title = inject(Title);
  readonly #meta = inject(Meta);
  readonly #language = inject(LanguageService);

  setPage(page: PageSeoModel): void {
    const shopName = this.#language.translate(SHOP_NAME_KEY);
    const title = this.#language.translate(page.titleKey);
    const description = this.#language.translate(page.descriptionKey);
    const fullTitle = `${title} | ${shopName}`;

    this.#title.setTitle(fullTitle);
    this.#meta.updateTag({ name: 'description', content: description });
    this.#meta.updateTag({ property: 'og:title', content: fullTitle });
    this.#meta.updateTag({ property: 'og:description', content: description });
    this.#meta.updateTag({
      property: 'og:locale',
      content: this.#language.currentLanguage() === 'fa' ? 'fa_IR' : 'en_US',
    });
    this.#meta.updateTag({
      name: 'robots',
      content: page.noindex ? 'noindex, nofollow' : 'index, follow',
    });
  }
}
