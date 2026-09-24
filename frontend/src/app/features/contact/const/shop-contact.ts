export interface ShopContactModel {
  readonly address: string;
  readonly phone: string;
  readonly email: string;
}

/**
 * Shop contact details for the Contact and About pages. Placeholders until
 * Phase 6's SettingsPage makes them admin-editable (see PLAN.md §8).
 */
export const SHOP_CONTACT: ShopContactModel = {
  address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
  phone: '021-12345678',
  email: 'info@sewing.local',
};
