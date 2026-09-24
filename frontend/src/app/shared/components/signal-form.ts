import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-signal-form',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <form [class]="cssClass()" (submit)="onSubmit($event)">
      <ng-content />
    </form>
  `,
})
export class SignalFormComponent {
  readonly cssClass = input<string>();
  readonly formSubmit = output<void>();

  onSubmit(event: Event): void {
    event.preventDefault();
    this.formSubmit.emit();
  }
}
