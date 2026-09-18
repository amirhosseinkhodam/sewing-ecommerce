import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language';
import { TranslatePipe } from './translate-pipe';
import en from './en.json';
import fa from './fa.json';

@Component({
  imports: [TranslatePipe],
  template: `
    <h1>{{ 'cart' | translate: i18n.language() }}</h1>
    @if (true) {
      <p>{{ 'validation.minlength' | translate: i18n.language() : { required: 8 } }}</p>
    }
  `,
})
class TranslationExample {
  readonly i18n = inject(LanguageService);
}

describe('TranslatePipe in a zoneless template', () => {
  beforeEach(() => localStorage.clear());

  it('updates unchanged keys and interpolated messages on every language switch', async () => {
    const fixture = TestBed.createComponent(TranslationExample);
    const i18n = fixture.componentInstance.i18n;
    const element: HTMLElement = fixture.nativeElement;

    for (const language of ['fa', 'en', 'fa'] as const) {
      i18n.set(language);
      await fixture.whenStable();
      expect(element.querySelector('h1')?.textContent).toBe(i18n.translate('cart'));
      expect(element.querySelector('p')?.textContent).toBe(
        i18n.translate('validation.minlength', { required: 8 }),
      );
    }
  });

  it('keeps both dictionaries at key parity, including nested validation keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fa).sort());
    expect(Object.keys(en.validation).sort()).toEqual(Object.keys(fa.validation).sort());
  });
});
