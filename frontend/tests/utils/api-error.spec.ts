import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from '@shared/utils/api-error';

const translate = (key: string) => `t:${key}`;
const failure = (status: number, message?: unknown) =>
  new HttpErrorResponse({
    status,
    error: message === undefined ? null : { message },
  });

describe('apiErrorMessage', () => {
  it('translates a known server message', () => {
    expect(
      apiErrorMessage(failure(400, 'Insufficient stock'), 'fb', translate),
    ).toBe('t:apiErrors.insufficientStock');
  });

  it('translates order status transitions whatever the statuses are', () => {
    const error = failure(
      400,
      'Cannot change order status from SHIPPED to PENDING',
    );

    expect(apiErrorMessage(error, 'fb', translate)).toBe(
      't:apiErrors.invalidTransition',
    );
  });

  it('prefers the status for 429 and 413', () => {
    expect(apiErrorMessage(failure(429), 'fb', translate)).toBe(
      't:apiErrors.tooManyRequests',
    );
    expect(apiErrorMessage(failure(413), 'fb', translate)).toBe(
      't:apiErrors.fileTooLarge',
    );
  });

  it('joins validation message arrays and falls back when unknown', () => {
    const error = failure(400, ['phone must be valid', 'password too short']);

    expect(apiErrorMessage(error, 'fallback', translate)).toBe('fallback');
  });

  it('never leaks an unknown raw English message', () => {
    expect(
      apiErrorMessage(failure(500, 'boom: stack trace'), 'fallback', translate),
    ).toBe('fallback');
  });

  it('falls back for a missing or empty body', () => {
    expect(apiErrorMessage(failure(500), 'fallback', translate)).toBe(
      'fallback',
    );
    expect(apiErrorMessage(failure(400, ''), 'fallback', translate)).toBe(
      'fallback',
    );
    expect(apiErrorMessage(failure(400, [' ', 3]), 'fallback', translate)).toBe(
      'fallback',
    );
  });

  it('falls back for anything that is not an HttpErrorResponse', () => {
    expect(apiErrorMessage(new Error('x'), 'fallback', translate)).toBe(
      'fallback',
    );
    expect(apiErrorMessage('x', 'fallback', translate)).toBe('fallback');
    expect(apiErrorMessage(null, 'fallback', translate)).toBe('fallback');
  });
});
