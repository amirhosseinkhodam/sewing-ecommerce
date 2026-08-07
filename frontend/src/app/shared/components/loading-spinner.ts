import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <span [class]="containerClasses()">
      <span [class]="dotClasses()" style="animation-delay: -0.32s"></span>
      <span [class]="dotClasses()" style="animation-delay: -0.16s"></span>
      <span [class]="dotClasses()"></span>
    </span>
  `,
})
export class LoadingSpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('sm');
  readonly cssClass = input<string>();

  readonly containerClasses = () => {
    const gaps = { sm: 'gap-1', md: 'gap-1.5', lg: 'gap-2' };
    return [
      'inline-flex items-center justify-center',
      gaps[this.size()],
      this.cssClass(),
    ]
      .filter(Boolean)
      .join(' ');
  };

  readonly dotClasses = () => {
    const sizes = { sm: 'w-1 h-1', md: 'w-1.5 h-1.5', lg: 'w-2 h-2' };
    return [
      'rounded-full bg-current animate-bounce-dot',
      sizes[this.size()],
    ].join(' ');
  };
}
