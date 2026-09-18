import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { LanguageService } from '@core/i18n/language';
import { ThemeService } from '@core/theme';
import { appConfig } from './app.config';

describe('Application startup', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('dir');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('restores preferences before rendering and configures query defaults', async () => {
    localStorage.setItem('app-language', 'en');
    localStorage.setItem('app-theme', 'dark');
    TestBed.configureTestingModule({ providers: appConfig.providers });
    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(TestBed.inject(QueryClient).getDefaultOptions()).toEqual({
      queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
      mutations: { retry: false },
    });

    TestBed.inject(LanguageService).toggle();
    TestBed.inject(ThemeService).toggle();
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('app-language')).toBe('fa');
    expect(localStorage.getItem('app-theme')).toBe('light');
  });
});
