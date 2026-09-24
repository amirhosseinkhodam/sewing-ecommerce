import {
  Component,
  computed,
  input,
  model,
  output,
  forwardRef,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormsModule,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import type { FormValueControl } from '@angular/forms/signals';
import { NgSelectModule } from '@ng-select/ng-select';
import { SelectOption } from '../models/select';

@Component({
  selector: 'app-select',
  imports: [FormsModule, NgSelectModule],
  template: `
    @if (label()) {
      <label
        class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
      >
        {{ label() }}
      </label>
    }
    <ng-select
      [items]="options()"
      [bindLabel]="'label'"
      [bindValue]="'value'"
      [placeholder]="placeholder() || ''"
      [disabled]="disabled()"
      [class]="computedClasses()"
      [ngModel]="innerValue()"
      (change)="onChange($event)"
      (blur)="onBlur()"
      (focus)="onFocus()"
      (keydown)="keydown.emit($event)"
      [clearable]="clearable()"
      [searchable]="searchable()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent
  implements ControlValueAccessor, FormValueControl<string | number | null>
{
  /**
   * Signal Forms writes through this model; the `[value]` callers and the CVA
   * both feed `innerValue`, so the two APIs stay independent.
   */
  readonly value = model<string | number | null>(null);
  readonly touch = output<void>();
  readonly disabled = input<boolean>(false);
  readonly cssClass = input<string>();
  readonly clearable = input<boolean>(true);
  readonly searchable = input<boolean>(false);
  readonly variant = input<'default' | 'error' | 'disabled'>('default');
  readonly options = input.required<SelectOption[]>();
  readonly placeholder = input<string>();
  readonly label = input<string>();

  readonly change = output<number | string | null>({ alias: 'selectChange' });
  readonly blur = output<void>({ alias: 'selectBlur' });
  // Named `focusChange`, not `focus`: Signal Forms' FormValueControl reserves
  // `focus` for a method. The public `selectFocus` alias is unchanged.
  readonly focusChange = output<void>({ alias: 'selectFocus' });
  readonly keydown = output<KeyboardEvent>({ alias: 'selectKeydown' });

  #onChange: (value: number | string | null) => void = () => {};
  #onTouched: () => void = () => {};
  /** Set by `writeValue` for CVA callers; ignored once `value` is bound. */
  readonly #writtenValue = signal<number | string | null>(null);

  readonly innerValue = computed(() => this.value() ?? this.#writtenValue());

  onChange(event: SelectOption | null) {
    const value = event?.value ?? null;
    this.#writtenValue.set(value);
    this.value.set(value);
    this.#onChange(value);
    this.change.emit(value);
  }

  onBlur() {
    this.#onTouched();
    this.touch.emit();
    this.blur.emit();
  }

  onFocus() {
    this.focusChange.emit();
  }

  writeValue(value: number | string | null): void {
    this.#writtenValue.set(value);
  }

  registerOnChange(fn: (value: number | string | null) => void): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.#onTouched = fn;
  }

  setDisabledState(): void {
    // Handled by ng-select via [disabled]
  }

  readonly computedClasses = () => {
    const base = 'w-full';

    const variants = {
      default: '',
      error: 'ng-select-error',
      disabled: 'ng-select-disabled',
    };

    return [base, variants[this.variant()], this.cssClass()]
      .filter(Boolean)
      .join(' ');
  };
}
