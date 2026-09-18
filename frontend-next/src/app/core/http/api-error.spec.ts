import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './api-error';

describe('apiErrorMessage', () => {
  it('uses a backend message or validation message list', () => {
    expect(
      apiErrorMessage(
        new HttpErrorResponse({ error: { message: 'Already registered' } }),
        'Fallback',
      ),
    ).toBe('Already registered');
    expect(
      apiErrorMessage(
        new HttpErrorResponse({ error: { message: ['Invalid email', 'Invalid phone'] } }),
        'Fallback',
      ),
    ).toBe('Invalid email, Invalid phone');
  });

  it.each([null, {}, { message: '' }, { message: [] }, { message: [{}] }, '<html>Error</html>'])(
    'uses the fallback for malformed bodies: %j',
    (error) => {
      expect(apiErrorMessage(new HttpErrorResponse({ error }), 'Fallback')).toBe('Fallback');
    },
  );

  it('uses the fallback for network and non-HTTP errors', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 0 }), 'Fallback')).toBe('Fallback');
    expect(apiErrorMessage(new Error('Internal error'), 'Fallback')).toBe('Fallback');
  });
});
