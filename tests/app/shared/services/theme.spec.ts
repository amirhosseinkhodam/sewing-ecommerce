import { TestBed } from '@angular/core/testing';
import { ThemeService } from '../../../../src/app/shared/services/theme';

describe('ThemeService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    jest.restoreAllMocks();
  });

  it('initial state — no localStorage → isDark is false', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(false);
  });

  it('toggle() — from light to dark sets isDark true and persists to localStorage', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    const service = TestBed.inject(ThemeService);

    service.toggle();

    expect(service.isDark()).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('app-theme', 'dark');
  });

  it('toggle() — from dark to light sets isDark false and persists to localStorage', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    const service = TestBed.inject(ThemeService);

    service.toggle();
    service.toggle();

    expect(service.isDark()).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalledWith('app-theme', 'light');
  });
});
