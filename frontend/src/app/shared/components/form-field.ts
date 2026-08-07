import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  DoCheck,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { AbstractControl, ValidationErrors } from "@angular/forms";
import { merge } from "rxjs";
import { TranslatePipe } from "../pipes/translate";

const ERROR_TO_TRANSLATION: Record<string, string> = {
  required: "validation.required",
  email: "validation.email",
  minlength: "validation.minlength",
  invalidChars: "validation.invalidChars",
  invalidPhone: "validation.invalidPhone",
  invalidNationalCode: "validation.invalidNationalCode",
  weakPassword: "validation.weakPasswordMinLength",
  passwordsMismatch: "validation.passwordsMismatch",
};

const ERROR_PRIORITY = [
  "required",
  "email",
  "minlength",
  "invalidChars",
  "invalidPhone",
  "invalidNationalCode",
  "weakPassword",
  "passwordsMismatch",
];

interface ErrorMessage {
  readonly key: string;
  readonly params?: Record<string, unknown>;
}

@Component({
  selector: "app-form-field",
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (errors().length > 0) {
      <div class="mt-1 text-sm text-red-600 dark:text-red-400">
        @for (error of errors(); track error.key) {
          <p>{{ error.key | translate: error.params }}</p>
        }
      </div>
    }
  `,
})
export class FormFieldComponent implements OnInit, DoCheck {
  readonly control = input.required<AbstractControl>();

  readonly errors = signal<ErrorMessage[]>([]);

  readonly #cdr = inject(ChangeDetectorRef);
  readonly #destroyRef = inject(DestroyRef);

  ngOnInit() {
    const sub = merge(
      this.control().statusChanges,
      this.control().valueChanges,
    ).subscribe(() => {
      this.#syncErrors();
    });
    this.#destroyRef.onDestroy(() => sub.unsubscribe());
  }

  ngDoCheck() {
    this.#syncErrors();
  }

  #syncErrors() {
    const ctrl = this.control();
    const newErrors = this.#computeErrors(ctrl);

    if (this.#errorsDiffer(newErrors)) {
      this.errors.set(newErrors);
      this.#cdr.markForCheck();
    }
  }

  #computeErrors(ctrl: AbstractControl): ErrorMessage[] {
    if (ctrl.valid || !ctrl.touched || !ctrl.errors) {
      return [];
    }
    return this.#mapErrors(ctrl.errors);
  }

  #errorsDiffer(newErrors: ErrorMessage[]): boolean {
    const current = this.errors();
    if (current.length !== newErrors.length) return true;
    return current.some(
      (e, i) =>
        e.key !== newErrors[i].key ||
        JSON.stringify(e.params) !== JSON.stringify(newErrors[i].params),
    );
  }

  #mapErrors(validationErrors: ValidationErrors): ErrorMessage[] {
    const messages: ErrorMessage[] = [];

    for (const errorKey of ERROR_PRIORITY) {
      if (validationErrors[errorKey]) {
        if (
          errorKey === "weakPassword" &&
          Array.isArray(validationErrors[errorKey])
        ) {
          for (const subError of validationErrors[errorKey] as string[]) {
            const capitalized =
              subError.charAt(0).toUpperCase() + subError.slice(1);
            messages.push({ key: `validation.weakPassword${capitalized}` });
          }
        } else {
          const translationKey = ERROR_TO_TRANSLATION[errorKey];
          const params = this.#getParams(
            errorKey,
            validationErrors[errorKey],
          );
          messages.push({ key: translationKey, params });
        }
      }
    }

    return messages;
  }

  #getParams(
    errorKey: string,
    errorValue: unknown,
  ): Record<string, unknown> | undefined {
    if (
      errorKey === "minlength" &&
      typeof errorValue === "object" &&
      errorValue !== null
    ) {
      return {
        required: (errorValue as { requiredLength: number }).requiredLength,
      };
    }
    return undefined;
  }
}
