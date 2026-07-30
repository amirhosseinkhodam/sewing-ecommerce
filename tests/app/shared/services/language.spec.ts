import { TestBed } from "@angular/core/testing";
import { LanguageService } from "../../../../src/app/shared/services/language";

describe("LanguageService", () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    jest.restoreAllMocks();
  });

  it('default language is "en"', () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const service = TestBed.inject(LanguageService);
    expect(service.currentLanguage()).toBe("en");
  });

  it("translate() — known key returns English translation", () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const service = TestBed.inject(LanguageService);
    expect(service.translate("appName")).toBe("My App");
  });

  it("translate() — unknown key returns the key itself", () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const service = TestBed.inject(LanguageService);
    expect(service.translate("nonexistentKey123")).toBe("nonexistentKey123");
  });

  it('toggle() — en → fa sets currentLanguage to "fa"', () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const service = TestBed.inject(LanguageService);
    service.toggle();
    expect(service.currentLanguage()).toBe("fa");
  });

  it('toggle() — fa → en sets currentLanguage to "en"', () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const service = TestBed.inject(LanguageService);
    service.toggle();
    service.toggle();
    expect(service.currentLanguage()).toBe("en");
  });

  it('getLanguageOption("en") — returns correct option with rtl: false', () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const service = TestBed.inject(LanguageService);
    const option = service.getLanguageOption("en");
    expect(option).toEqual({
      code: "en",
      name: "English",
      nativeName: "English",
      rtl: false,
    });
  });

  it("getCurrentLanguageOption() — returns current language option", () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const service = TestBed.inject(LanguageService);
    const option = service.getCurrentLanguageOption();
    expect(option.code).toBe("en");
    expect(option.rtl).toBe(false);
  });

  it('getLanguageOption("fa") — returns correct option with rtl: true', () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const service = TestBed.inject(LanguageService);
    const option = service.getLanguageOption("fa");
    expect(option).toEqual({
      code: "fa",
      name: "Persian",
      nativeName: "فارسی",
      rtl: true,
    });
  });
});
