import { HttpErrorResponse } from '@angular/common/http';

const API_MESSAGE_KEYS: Readonly<Record<string, string>> = {
  'Address not found': 'apiErrors.addressNotFound',
  'Cannot delete a category that still has portfolio items':
    'apiErrors.categoryHasPortfolio',
  'Cannot delete a category that still has products':
    'apiErrors.categoryHasProducts',
  'Cart is empty': 'apiErrors.cartEmpty',
  'Cart item not found': 'apiErrors.cartItemNotFound',
  'Category not found': 'apiErrors.categoryNotFound',
  'Insufficient stock': 'apiErrors.insufficientStock',
  'Invalid credentials': 'apiErrors.invalidCredentials',
  'Invalid refresh token': 'apiErrors.sessionExpired',
  'Message not found': 'apiErrors.messageNotFound',
  'Online payment is not available': 'apiErrors.onlinePaymentUnavailable',
  'Only JPEG, PNG, WebP or GIF images are allowed':
    'apiErrors.invalidImageType',
  'Order can no longer be cancelled': 'apiErrors.orderNotCancellable',
  'Order is already paid': 'apiErrors.orderAlreadyPaid',
  'Order is cancelled': 'apiErrors.orderCancelled',
  'Order is not an online-payment order': 'apiErrors.notOnlineOrder',
  'Order not found': 'apiErrors.orderNotFound',
  'Payment attempt not found': 'apiErrors.paymentAttemptNotFound',
  'Phone already registered': 'apiErrors.phoneRegistered',
  'Portfolio item not found': 'apiErrors.portfolioNotFound',
  'Product not found': 'apiErrors.productNotFound',
  'Product variant not found': 'apiErrors.variantNotFound',
  'Receipts apply to card-to-card orders only': 'apiErrors.receiptCardOnly',
  'Shop settings not found': 'apiErrors.settingsNotFound',
  'Slug already in use': 'apiErrors.slugInUse',
  'User not found': 'apiErrors.userNotFound',
  'File too large': 'apiErrors.fileTooLarge',
  'Too Many Requests': 'apiErrors.tooManyRequests',
  'ThrottlerException: Too Many Requests': 'apiErrors.tooManyRequests',
  'Internal server error': 'apiErrors.serverError',
  Unauthorized: 'apiErrors.unauthorized',
  Forbidden: 'apiErrors.forbidden',
};

const ORDER_STATUS_CHANGE = /^Cannot change order status from /;

function knownKey(message: string): string | null {
  if (ORDER_STATUS_CHANGE.test(message)) return 'apiErrors.invalidTransition';
  return API_MESSAGE_KEYS[message] ?? null;
}

/**
 * Maps a server message to a translated one. Known messages get their
 * translation; anything else (validation details, unexpected errors) falls
 * back to the caller's translated text so raw English never reaches the user.
 */
export function apiErrorMessage(
  error: unknown,
  fallback: string,
  translate: (key: string) => string,
): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 429) return translate('apiErrors.tooManyRequests');
  if (error.status === 413) return translate('apiErrors.fileTooLarge');
  const raw = serverMessage(error);
  if (raw === null) return fallback;
  const key = knownKey(raw);
  return key ? translate(key) : fallback;
}

function serverMessage(error: HttpErrorResponse): string | null {
  const message = (error.error as { message?: unknown } | null)?.message;
  if (typeof message === 'string' && message.length > 0) return message;
  if (Array.isArray(message)) {
    const messages = message.filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0,
    );
    if (messages.length > 0) return messages.join(', ');
  }
  return null;
}
