import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      [class]="computedClasses()"
      (click)="onClick()"
      (keydown.enter)="onEnter($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
})
export class ButtonComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly cssClass = input<string>();
  readonly variant = input<
    | 'primary'
    | 'secondary'
    | 'destructive'
    | 'ghost'
    | 'warning'
    | 'success'
    | 'outline'
    | 'icon'
    | 'mat'
    | 'mat-raised'
    | 'mat-flat'
    | 'mat-stroked'
    | 'mat-text'
  >('secondary');
  readonly color = input<'primary' | 'accent' | 'warn' | 'basic'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly focusRing = input<boolean>(false);

  readonly click = output<void>({ alias: 'buttonClick' });

  onClick() {
    if (!this.disabled()) {
      this.click.emit();
    }
  }

  onEnter(event: KeyboardEvent) {
    event.preventDefault();
    if (!this.disabled()) {
      this.click.emit();
    }
  }

  readonly computedClasses = () => {
    const focusClasses = this.focusRing()
      ? 'focus:ring-2 focus:ring-slate-500 focus:ring-offset-2'
      : 'focus:outline-none';
    const base = `inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${focusClasses} disabled:cursor-not-allowed disabled:opacity-50`;

    const sizes = {
      sm: 'px-3 py-1.5 text-xs min-h-[36px]',
      md: 'px-4 py-2 text-sm min-h-[40px]',
      lg: 'px-6 py-3 text-base min-h-[44px]',
    };

    const isMat = this.variant().startsWith('mat');

    const variants: Record<string, string> = {
      primary:
        'bg-slate-900 dark:bg-slate-600 text-white hover:bg-slate-800 dark:hover:bg-slate-500',
      secondary:
        'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
      destructive:
        'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600',
      ghost:
        'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
      icon: 'text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400',
      warning: 'bg-amber-500 text-white hover:bg-amber-600',
      success: 'bg-green-600 text-white hover:bg-green-700',
      outline:
        'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
    };

    if (isMat) {
      const color = this.color();
      const appearance = this.variant();

      const colorClasses = {
        primary: {
          base: 'bg-blue-600 dark:bg-blue-500 text-white',
          hover: 'hover:bg-blue-700 dark:hover:bg-blue-600',
          focus: 'focus:ring-blue-500',
        },
        accent: {
          base: 'bg-pink-600 dark:bg-pink-500 text-white',
          hover: 'hover:bg-pink-700 dark:hover:bg-pink-600',
          focus: 'focus:ring-pink-500',
        },
        warn: {
          base: 'bg-red-600 dark:bg-red-500 text-white',
          hover: 'hover:bg-red-700 dark:hover:bg-red-600',
          focus: 'focus:ring-red-500',
        },
        basic: {
          base: 'bg-slate-600 dark:bg-slate-500 text-white',
          hover: 'hover:bg-slate-700 dark:hover:bg-slate-600',
          focus: 'focus:ring-slate-500',
        },
      };

      const c = colorClasses[color];

      if (appearance === 'mat-raised' || appearance === 'mat-flat') {
        return [
          base,
          sizes[this.size()],
          c.base,
          c.hover,
          c.focus,
          'shadow-sm hover:shadow',
          this.cssClass(),
        ]
          .filter(Boolean)
          .join(' ');
      }

      if (appearance === 'mat-stroked') {
        const strokeColors = {
          primary:
            'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
          accent:
            'border-pink-600 dark:border-pink-500 text-pink-600 dark:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20',
          warn: 'border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
          basic:
            'border-slate-600 dark:border-slate-500 text-slate-600 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/20',
        };
        return [
          base,
          sizes[this.size()],
          strokeColors[color],
          c.focus,
          this.cssClass(),
        ]
          .filter(Boolean)
          .join(' ');
      }

      if (appearance === 'mat-text') {
        const hoverBg = {
          primary: 'hover:bg-blue-100 dark:hover:bg-blue-900/20',
          accent: 'hover:bg-pink-100 dark:hover:bg-pink-900/20',
          warn: 'hover:bg-red-100 dark:hover:bg-red-900/20',
          basic: 'hover:bg-slate-100 dark:hover:bg-slate-900/20',
        };
        return [
          base.replace('rounded-lg', 'rounded'),
          sizes[this.size()].replace('px-4 py-2', 'px-3 py-1.5'),
          c.base.replace('bg-', 'text-').replace('text-white', ''),
          hoverBg[color],
          c.focus,
          this.cssClass(),
        ]
          .filter(Boolean)
          .join(' ');
      }

      // mat (default) = raised
      return [
        base,
        sizes[this.size()],
        c.base,
        c.hover,
        c.focus,
        'shadow-sm hover:shadow',
        this.cssClass(),
      ]
        .filter(Boolean)
        .join(' ');
    }

    return [base, sizes[this.size()], variants[this.variant()], this.cssClass()]
      .filter(Boolean)
      .join(' ');
  };
}
