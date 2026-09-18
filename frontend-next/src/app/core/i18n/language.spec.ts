import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language';

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('dir');
    TestBed.configureTestingModule({});
  });

  it('defaults to Persian with rtl direction', () => {
    const i18n = TestBed.inject(LanguageService);

    expect(i18n.language()).toBe('fa');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('switches to Persian and sets rtl on <html>', () => {
    const i18n = TestBed.inject(LanguageService);

    i18n.set('en');
    i18n.set('fa');

    expect(i18n.language()).toBe('fa');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('fa');
    expect(localStorage.getItem('app-language')).toBe('fa');
  });

  it('translates a key per active language', () => {
    const i18n = TestBed.inject(LanguageService);
    i18n.set('en');

    expect(i18n.translate('cart')).toBe('Cart');

    i18n.set('fa');

    expect(i18n.translate('cart')).toBe('سبد خرید');
  });

  it('resolves dotted keys from the nested validation group', () => {
    const i18n = TestBed.inject(LanguageService);
    i18n.set('en');

    expect(i18n.translate('validation.required')).toBe('This field is required');
  });

  it('interpolates parameters', () => {
    const i18n = TestBed.inject(LanguageService);
    i18n.set('en');

    expect(i18n.translate('validation.minlength', { required: 8 })).toContain('8');
  });

  it('falls back to English, then to the key itself', () => {
    const i18n = TestBed.inject(LanguageService);
    i18n.set('fa');

    expect(i18n.translate('definitely-not-a-key')).toBe('definitely-not-a-key');
  });
});
