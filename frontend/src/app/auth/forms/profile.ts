import { Injectable, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import type { UserModel } from '@domain/models/user';
import { phoneRule, personNameRule } from '@shared/forms/rules';

@Injectable({ providedIn: 'root' })
export class ProfileFormService {
  readonly model = signal({
    firstName: '',
    lastName: '',
    phone: '',
  });
  readonly form = form(this.model, (path) => {
    personNameRule(path.firstName);
    personNameRule(path.lastName);
    phoneRule(path.phone);
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
