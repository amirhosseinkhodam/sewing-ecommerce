export function passwordErrors(password: string) {
  if (!password) return undefined;

  const errors = [];
  if (password.length < 8)
    errors.push({
      kind: 'weakPasswordMinLength',
      message: 'validation.weakPasswordMinLength',
    });
  if (!/[A-Z]/.test(password))
    errors.push({
      kind: 'weakPasswordUppercase',
      message: 'validation.weakPasswordUppercase',
    });
  if (!/[a-z]/.test(password))
    errors.push({
      kind: 'weakPasswordLowercase',
      message: 'validation.weakPasswordLowercase',
    });
  if (!/\d/.test(password))
    errors.push({
      kind: 'weakPasswordNumber',
      message: 'validation.weakPasswordNumber',
    });
  return errors;
}
