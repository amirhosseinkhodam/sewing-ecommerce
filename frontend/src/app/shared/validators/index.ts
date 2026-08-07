import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function persianNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    if (value.trim().length < 2) {
      return { minlength: { requiredLength: 2, actualLength: value.trim().length } };
    }

    const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
    if (!nameRegex.test(value)) {
      return { invalidChars: true };
    }

    return null;
  };
}

export function iranianPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(value)) {
      return { invalidPhone: true };
    }

    return null;
  };
}

export function nationalCodeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    if (!/^\d{10}$/.test(value)) {
      return { invalidNationalCode: true };
    }

    const digits = value.split('').map(Number);
    const sum = digits
      .slice(0, 9)
      .reduce(
        (acc: number, digit: number, index: number) => acc + digit * (10 - index),
        0,
      );
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? remainder : 11 - remainder;

    if (checkDigit !== digits[9]) {
      return { invalidNationalCode: true };
    }

    return null;
  };
}

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const errors: string[] = [];
    if (value.length < 8) errors.push('minLength');
    if (!/[A-Z]/.test(value)) errors.push('uppercase');
    if (!/[a-z]/.test(value)) errors.push('lowercase');
    if (!/\d/.test(value)) errors.push('number');

    return errors.length ? { weakPassword: errors } : null;
  };
}

export function passwordMatchValidator(
  passwordField: string,
  confirmField: string,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get(passwordField)?.value;
    const confirm = control.get(confirmField)?.value;

    if (!password || !confirm) return null;

    return password === confirm ? null : { passwordsMismatch: true };
  };
}
