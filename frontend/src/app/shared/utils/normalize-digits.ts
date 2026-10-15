const PERSIAN_ZERO = 0x06f0;
const ARABIC_ZERO = 0x0660;

/** Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits, and the Arabic decimal separator, to ASCII. */
export function normalizeDigits(value: string): string {
  return value
    .replace(/[\u06f0-\u06f9]/g, (char) =>
      String(char.charCodeAt(0) - PERSIAN_ZERO),
    )
    .replace(/[\u0660-\u0669]/g, (char) =>
      String(char.charCodeAt(0) - ARABIC_ZERO),
    )
    .replace(/\u066b/g, '.')
    .replace(/\u066c/g, ',');
}
