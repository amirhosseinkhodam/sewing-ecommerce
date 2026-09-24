/**
 * Every TanStack Query cache key in the app.
 *
 * Invalidation crosses feature boundaries — an admin write invalidates the
 * public read — so the keys live in one place rather than as inline strings.
 */
export const QUERY_KEYS = {
  cart: 'cart',
  addresses: 'addresses',
  categories: 'categories',
  products: 'products',
  product: 'product',
  portfolio: 'portfolio',
  portfolioItem: 'portfolio-item',
  orders: 'orders',
  order: 'order',
  adminCategories: 'admin-categories',
  adminProducts: 'admin-products',
  adminProduct: 'admin-product',
  adminPortfolio: 'admin-portfolio',
  adminPortfolioItem: 'admin-portfolio-item',
  adminOrders: 'admin-orders',
  adminOrder: 'admin-order',
  adminMessages: 'admin-messages',
} as const;

export type QueryKey = (typeof QUERY_KEYS)[keyof typeof QUERY_KEYS];
