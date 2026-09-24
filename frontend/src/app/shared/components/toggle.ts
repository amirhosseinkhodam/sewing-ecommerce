import {
  Component,
  forwardRef,
  input,
  model,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { FormCheckboxControl } from '@angular/forms/signals';

@Component({
  selector: 'app-toggle',
  template: `
    <label [class]="computedClasses()">
      @if (label()) {
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
          {{ label() }}
        </span>
      }
      <button
        type="button"
        role="switch"
        [attr.aria-checked]="checked()"
        [disabled]="disabled()"
        [class]="switchClasses()"
        (click)="onToggle()"
      >
        <span [class]="thumbClasses()"></span>
      </button>
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleComponent),
      multi: true,
    },
  ],
})
export class ToggleComponent
  implements ControlValueAccessor, FormCheckboxControl
{
  readonly checked = model(false);
  readonly touch = output<void>();
  readonly label = input<string>();
  readonly disabled = input<boolean>(false);
  readonly cssClass = input<string>();

  readonly change = output<boolean>({ alias: 'toggleChange' });

  #onChange: (value: boolean) => void = () => {};
  #onTouched: () => void = () => {};

  onToggle(): void {
    if (this.disabled()) return;
    this.checked.update((value) => !value);
    this.#onChange(this.checked());
    this.#onTouched();
    this.touch.emit();
    this.change.emit(this.checked());
  }

  writeValue(value: boolean): void {
    this.checked.set(value ?? false);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.#onTouched = fn;
  }

  setDisabledState(): void {
    // Handled by [disabled] on the button
  }

  readonly computedClasses = () => {
    const base = 'inline-flex items-center gap-3 select-none cursor-pointer';
    const disabledClass = this.disabled()
      ? 'opacity-50 cursor-not-allowed'
      : '';
    return [base, disabledClass, this.cssClass()].filter(Boolean).join(' ');
  };

  readonly switchClasses = () => {
    const on = this.checked()
      ? 'bg-slate-900 dark:bg-slate-500'
      : 'bg-slate-300 dark:bg-slate-600';
    return `relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed ${on}`;
  };

  readonly thumbClasses = () => {
    const on = this.checked()
      ? 'translate-x-5 rtl:-translate-x-5'
      : 'translate-x-0';
    return `inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on}`;
  };
}
