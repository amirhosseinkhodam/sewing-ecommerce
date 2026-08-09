import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [],
  template: `
    <div [class]="computedClasses()">
      <ng-content></ng-content>
    </div>
  `,
})
export class CardComponent {
  readonly cssClass = input<string>();
  readonly variant = input<'default' | 'bordered'>('default');
  readonly padding = input<'none' | 'sm' | 'md' | 'lg'>('md');

  readonly computedClasses = () => {
    const base = 'rounded-card shadow-card';
    const variants = {
      default: 'bg-white dark:bg-slate-800',
      bordered:
        'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    };
    const padding = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };
    return [
      base,
      variants[this.variant()],
      padding[this.padding()],
      this.cssClass(),
    ]
      .filter(Boolean)
      .join(' ');
  };
}
