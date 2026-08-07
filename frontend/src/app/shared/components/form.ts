import {
  ChangeDetectorRef,
  Component,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";

@Component({
  selector: "app-form",
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form
      [formGroup]="formGroup()!"
      (ngSubmit)="onSubmit($event)"
      [class]="computedClasses()"
    >
      <ng-content></ng-content>
    </form>
  `,
})
export class FormComponent {
  readonly formGroup = input.required<FormGroup>();
  readonly cssClass = input<string>();
  readonly variant = input<"default" | "inline" | "vertical" | "horizontal">(
    "default",
  );

  readonly formSubmitted = signal(false);
  readonly submitted = output<FormGroup>({ alias: "formSubmit" });

  readonly #cdr = inject(ChangeDetectorRef);

  onSubmit(event: Event): void {
    this.formSubmitted.set(true);
    const form = this.formGroup();
    form.markAllAsTouched();
    Object.values(form.controls).forEach((control) => {
      control.updateValueAndValidity({ onlySelf: false, emitEvent: true });
    });
    this.#cdr.markForCheck();
    if (form.invalid) return;
    this.submitted.emit(form);
  }

  reset(): void {
    this.formSubmitted.set(false);
    this.formGroup().reset();
  }

  readonly computedClasses = () => {
    const base = "";

    const variants = {
      default: "",
      inline: "flex gap-4 items-end",
      vertical: "",
      horizontal: "flex gap-4 items-center",
    };

    return [base, variants[this.variant()], this.cssClass()]
      .filter(Boolean)
      .join(" ");
  };
}
