import { uniqueId } from '@shared/utils/unique-id';

describe('uniqueId', () => {
  it('keeps the prefix and never repeats', () => {
    const ids = Array.from({ length: 50 }, () => uniqueId('field'));

    expect(new Set(ids).size).toBe(50);
    expect(ids.every((id) => id.startsWith('field-'))).toBe(true);
  });
});
