import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form
      [formGroup]="formGroup()!"
      (ngSubmit)="formSubmit.emit($event)"
      [class]="computedClasses()"
    >
      <ng-content></ng-content>
    </form>
  `,
})
export class FormComponent {
  readonly formGroup = input<FormGroup>();
  readonly cssClass = input<string>();
  readonly variant = input<'default' | 'inline' | 'vertical' | 'horizontal'>(
    'default',
  );

  readonly formSubmit = output<Event>({ alias: 'ngSubmit' });

  readonly computedClasses = () => {
    const base = '';

    const variants = {
      default: '',
      inline: 'flex gap-4 items-end',
      vertical: '',
      horizontal: 'flex gap-4 items-center',
    };

    return [base, variants[this.variant()], this.cssClass()]
      .filter(Boolean)
      .join(' ');
  };
}
