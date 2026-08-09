import {
  Component,
  input,
  output,
  forwardRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [],
  template: `
    @if (label()) {
      <label
        class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
      >
        {{ label() }}
      </label>
    }
    <input
      #inputElement
      [type]="type()"
      [placeholder]="placeholder()"
      [disabled]="disabled()"
      [class]="computedClasses()"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [autocomplete]="autocomplete()"
      (input)="onInput($event)"
      (blur)="onBlur()"
      (focus)="onFocus()"
      (keydown)="keydown.emit($event)"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
  readonly type = input<
    'text' | 'email' | 'password' | 'number' | 'textarea' | 'search'
  >('text');
  readonly placeholder = input<string>();
  readonly disabled = input<boolean>(false);
  readonly cssClass = input<string>();
  readonly focusRing = input<boolean>(false);
  readonly autocomplete = input<string>();
  readonly variant = input<'default' | 'error' | 'disabled'>('default');
  readonly min = input<string | number>();
  readonly max = input<string | number>();
  readonly step = input<string | number>();
  readonly error = input<boolean>(false);
  readonly label = input<string>();

  readonly input = output<string>({ alias: 'inputChange' });
  readonly blur = output<void>({ alias: 'inputBlur' });
  readonly focus = output<void>({ alias: 'inputFocus' });
  readonly keydown = output<KeyboardEvent>({ alias: 'inputKeydown' });

  @ViewChild('inputElement', { static: true })
  inputElement!: ElementRef<HTMLInputElement>;
  #onChange: (value: string) => void = () => {};
  #onTouched: () => void = () => {};

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.#onChange(value);
    this.input.emit(value);
  }

  onBlur() {
    this.#onTouched();
    this.blur.emit();
  }

  onFocus() {
    this.focus.emit();
  }

  writeValue(value: string): void {
    if (this.inputElement) {
      this.inputElement.nativeElement.value = value ?? '';
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.#onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.inputElement) {
      this.inputElement.nativeElement.disabled = isDisabled;
    }
  }

  readonly computedClasses = () => {
    const focusClasses = this.focusRing()
      ? 'focus:ring-2 focus:ring-slate-500 focus:ring-offset-2'
      : 'focus:outline-none';
    const base = `w-full rounded-lg border px-3 py-2 transition-colors ${focusClasses} placeholder:text-slate-400 dark:placeholder:text-slate-500`;

    const variants = {
      default:
        'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100',
      error:
        'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100',
      disabled:
        'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-50',
    };

    const errorClass = this.error() ? 'ring-red-500 border-red-500' : '';

    return [base, variants[this.variant()], errorClass, this.cssClass()]
      .filter(Boolean)
      .join(' ');
  };
}
