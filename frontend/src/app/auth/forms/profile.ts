import { Injectable, signal } from '@angular/core';
import { form, required, validate } from '@angular/forms/signals';
import type { UserModel } from '@domain/models/user';

@Injectable({ providedIn: 'root' })
export class ProfileFormService {
  readonly model = signal({
    firstName: '',
    lastName: '',
    phone: '',
  });
  readonly form = form(this.model, (path) => {
    for (const field of [path.firstName, path.lastName]) {
      required(field, { message: 'validation.required' });
      validate(field, ({ value }) => {
        const name = value();
        if (!name) return undefined;
        if (name.trim().length < 2)
          return { kind: 'minlength', message: 'validation.minlength' };
        if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(name))
          return { kind: 'invalidChars', message: 'validation.invalidChars' };
        return undefined;
      });
    }
    required(path.phone, { message: 'validation.required' });
    validate(path.phone, ({ value }) =>
      value() && !/^09\d{9}$/.test(value())
        ? { kind: 'invalidPhone', message: 'validation.invalidPhone' }
        : undefined,
    );
  });

  patchFromUser(user: UserModel) {
    this.model.set({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    });
  }

  resetForm() {
    this.form().reset();
  }
}
