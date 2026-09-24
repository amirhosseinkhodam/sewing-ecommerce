export interface BankCardModel {
  readonly cardNumber: string;
  readonly cardHolder: string;
}

/**
 * Destination card for card-to-card transfers, shown on the order detail page.
 * Placeholder values until Phase 6 makes these editable from admin settings.
 */
export const BANK_CARD: BankCardModel = {
  cardNumber: '6037-9911-2233-4455',
  cardHolder: 'فروشگاه خیاطی',
};
