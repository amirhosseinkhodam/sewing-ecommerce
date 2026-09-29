let counter = 0;

/**
 * Unique id for a form control so a `<label for>` can point at it. The counter
 * restarts on every page load, but an id only has to be unique within a
 * document, which is all a label association needs.
 */
export function uniqueId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
