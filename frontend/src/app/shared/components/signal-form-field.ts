import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { TranslatePipe } from '../pipes/translate';

@Component({
  selector: 'app-signal-form-field',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (field()().touched()) {
      @for (error of field()().errors(); track error.kind) {
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{
            error.message!
              | translate
                : (error.kind === 'minlength'
                    ? { required: requiredLength() }
                    : undefined)
          }}
        </p>
      }
    }
  `,
})
export class SignalFormFieldComponent {
  readonly field = input.required<FieldTree<string>>();
  readonly requiredLength = input<number>();
}
