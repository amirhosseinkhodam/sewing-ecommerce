import { ChangeDetectorRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { TranslatePipe } from "../../../../src/app/shared/pipes/translate";
import { LanguageService } from "../../../../src/app/shared/services/language";

describe("TranslatePipe", () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ChangeDetectorRef, useValue: { markForCheck: jest.fn() } },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("transforms known key to English translation", () => {
    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());
    expect(pipe.transform("appName")).toBe("My App");
  });

  it("returns new language translation after language change", () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    jest.spyOn(Storage.prototype, "setItem").mockImplementation();

    const languageService = TestBed.inject(LanguageService);
    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());

    expect(pipe.transform("appName")).toBe("My App");

    languageService.toggle();
    expect(pipe.transform("appName")).toBe("اپلیکیشن من");
  });
});
