import { Component, input, output, forwardRef, signal } from '@angular/core';
import {
  FormsModule,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

export interface SelectOption {
  value: number | string;
  label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  readonly disabled = input<boolean>(false);
  readonly cssClass = input<string>();
  readonly clearable = input<boolean>(true);
  readonly searchable = input<boolean>(false);
  readonly variant = input<'default' | 'error' | 'disabled'>('default');
  readonly value = input<number | string | null>(null);
  readonly options = input.required<SelectOption[]>();
  readonly placeholder = input<string>();
  readonly label = input<string>();

  readonly change = output<number | string | null>({ alias: 'selectChange' });
  readonly blur = output<void>({ alias: 'selectBlur' });
  readonly focus = output<void>({ alias: 'selectFocus' });
  readonly keydown = output<KeyboardEvent>({ alias: 'selectKeydown' });

  #onChange: (value: number | string | null) => void = () => {};
  #onTouched: () => void = () => {};
  readonly innerValue = signal<number | string | null>(null);

  onChange(event: SelectOption | null) {
    const value = event?.value ?? null;
    this.innerValue.set(value);
    this.#onChange(value);
    this.change.emit(value);
  }

  onBlur() {
    this.#onTouched();
    this.blur.emit();
  }

  onFocus() {
    this.focus.emit();
  }

  writeValue(value: number | string | null): void {
    this.innerValue.set(value);
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
