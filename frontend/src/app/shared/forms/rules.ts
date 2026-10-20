import { required, validate, type SchemaPath } from '@angular/forms/signals';

/** Iranian mobile number, e.g. 09123456789. Mirrors the backend DTO rule. */
const PHONE_PATTERN = /^09\d{9}$/;
const NAME_PATTERN = /^[؀-ۿa-zA-Z\s]+$/;

/** Required Iranian mobile number. */
export function phoneRule(path: SchemaPath<string>): void {
  required(path, { message: 'validation.required' });
  validate(path, ({ value }) =>
    value() && !PHONE_PATTERN.test(value())
      ? { kind: 'invalidPhone', message: 'validation.invalidPhone' }
      : undefined,
  );
}

/** Required first/last name: at least 2 characters, Persian or Latin letters. */
export function personNameRule(path: SchemaPath<string>): void {
  required(path, { message: 'validation.required' });
  validate(path, ({ value }) => {
    const name = value();
    if (!name) return undefined;
    if (name.trim().length < 2)
      return { kind: 'minlength', message: 'validation.minlength' };
    if (!NAME_PATTERN.test(name))
      return { kind: 'invalidChars', message: 'validation.invalidChars' };
    return undefined;
  });
}
