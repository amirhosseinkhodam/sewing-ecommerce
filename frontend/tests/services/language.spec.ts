import { TestBed } from '@angular/core/testing';
import { LanguageService } from '@shared/services/language';

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');
  });

  const create = () => TestBed.inject(LanguageService);

  it('defaults to English, left-to-right', () => {
    const service = create();
    TestBed.tick();

    expect(service.currentLanguage()).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('restores a saved language and its direction', () => {
    localStorage.setItem('app-language', 'fa');

    const service = create();
    TestBed.tick();

    expect(service.currentLanguage()).toBe('fa');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('ignores a saved language it does not know', () => {
    localStorage.setItem('app-language', 'de');

    expect(create().currentLanguage()).toBe('en');
  });

  it('toggles between languages, updating <html> and storage', () => {
    const service = create();
    TestBed.tick();

    service.toggle();
    TestBed.tick();

    expect(service.currentLanguage()).toBe('fa');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('fa');
    expect(localStorage.getItem('app-language')).toBe('fa');

    service.toggle();
    TestBed.tick();
    expect(service.currentLanguage()).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('translates nested keys per language', () => {
    const service = create();

    const english = service.translate('apiErrors.insufficientStock');
    service.currentLanguage.set('fa');
    const persian = service.translate('apiErrors.insufficientStock');

    expect(english).not.toBe('apiErrors.insufficientStock');
    expect(persian).not.toBe('apiErrors.insufficientStock');
    expect(persian).not.toBe(english);
  });

  it('returns the key itself when no language has it', () => {
    expect(create().translate('no.such.key')).toBe('no.such.key');
    expect(create().translate('apiErrors')).toBe('apiErrors');
  });

  it('exposes the option for the current language', () => {
    const service = create();

    expect(service.getCurrentLanguageOption().code).toBe('en');
    service.currentLanguage.set('fa');
    expect(service.getCurrentLanguageOption()).toMatchObject({
      code: 'fa',
      rtl: true,
    });
  });
});
