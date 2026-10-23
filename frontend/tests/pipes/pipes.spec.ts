import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from '@shared/services/language';
import { LocalizedDatePipe } from '@shared/pipes/localized-date';
import { LocalizedNumberPipe } from '@shared/pipes/localized-number';
import { TranslatePipe } from '@shared/pipes/translate';

describe('pipes', () => {
  let language: LanguageService;

  beforeEach(() => {
    localStorage.clear();
    language = TestBed.inject(LanguageService);
  });

  const run = <T>(fn: () => T): T => TestBed.runInInjectionContext(fn);

  describe('LocalizedNumberPipe', () => {
    const pipe = () => run(() => new LocalizedNumberPipe());

    it('groups digits in English', () => {
      expect(pipe().transform(1234567)).toBe('1,234,567');
      expect(pipe().transform('250000')).toBe('250,000');
    });

    it('uses Persian digits in Persian', () => {
      language.currentLanguage.set('fa');

      expect(pipe().transform(1234)).toMatch(/^[۰-۹٬,]+$/);
      expect(pipe().transform(1234)).toContain('۱');
    });

    it('returns empty for null, undefined and empty string', () => {
      expect(pipe().transform(null)).toBe('');
      expect(pipe().transform(undefined)).toBe('');
      expect(pipe().transform('')).toBe('');
    });

    it('echoes back non-numeric text', () => {
      expect(pipe().transform('abc')).toBe('abc');
    });

    it('keeps zero', () => {
      expect(pipe().transform(0)).toBe('0');
    });
  });

  describe('LocalizedDatePipe', () => {
    const pipe = () => run(() => new LocalizedDatePipe());
    const iso = '2026-03-21T12:30:00';

    it('formats Gregorian dates in English', () => {
      expect(pipe().transform(iso, 'yyyy/MM/dd')).toBe('2026/03/21');
      expect(pipe().transform(iso)).toBe('2026/03/21 12:30');
    });

    it('formats Jalali dates in Persian (21 Mar 2026 is 1 Farvardin 1405)', () => {
      language.currentLanguage.set('fa');

      expect(pipe().transform(iso, 'yyyy/MM/dd')).toBe('1405/01/01');
    });

    it('returns empty for missing values', () => {
      expect(pipe().transform(null)).toBe('');
      expect(pipe().transform(undefined)).toBe('');
      expect(pipe().transform('')).toBe('');
    });
  });

  describe('TranslatePipe', () => {
    @Component({
      selector: 'app-host',
      imports: [TranslatePipe],
      template: `<p>{{ key() | translate: params() }}</p>`,
    })
    class HostComponent {
      readonly key = signal('apiErrors.insufficientStock');
      readonly params = signal<Record<string, unknown> | undefined>(undefined);
    }

    const render = () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const text = () => fixture.nativeElement.querySelector('p').textContent;
      return { fixture, host: fixture.componentInstance, text };
    };

    it('translates and re-renders when the language changes', () => {
      const { fixture, text } = render();
      const english = text();

      language.currentLanguage.set('fa');
      fixture.detectChanges();
      TestBed.tick();
      fixture.detectChanges();

      expect(english).not.toBe('apiErrors.insufficientStock');
      expect(text()).not.toBe(english);
    });

    it('renders the key when it is missing', () => {
      const { host, fixture, text } = render();

      host.key.set('missing.key');
      fixture.detectChanges();

      expect(text()).toBe('missing.key');
    });

    it('substitutes every occurrence of a {{param}}', () => {
      vi.spyOn(language, 'translate').mockReturnValue(
        '{{n}} of {{total}}, {{n}}!',
      );
      const { host, fixture, text } = render();

      host.params.set({ n: 2, total: 5 });
      fixture.detectChanges();

      expect(text()).toBe('2 of 5, 2!');
    });
  });
});
