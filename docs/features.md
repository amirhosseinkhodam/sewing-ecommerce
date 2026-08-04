# Features

End-to-end descriptions of every product feature and its user flow. Written in plain language — who does what, in what order, through which screens and API calls.

> This is the living features spec. `PLAN.md` is the roadmap/reference; this file describes how the product actually behaves.

---

## Roles

- **Guest** — no account, can browse everything public.
- **Customer** — logged-in user (`CUSTOMER`), can use cart, checkout, orders, addresses, profile.
- **Admin** — user with `ADMIN` role, manages the shop from `/admin`.

Auth is JWT-based: short-lived access token + 7-day refresh token. On a 401 the frontend refreshes automatically; if that fails the user is logged out and redirected to `/login`.

---

## 1. Guest browsing

Any visitor can browse the catalog, product detail pages, portfolio, and contact/about pages without an account.

**Flow:**
1. Guest lands on `/` (home) → sees featured products and shop intro.
2. Navigates to `/products` → `GET /api/products?page=1` returns a paginated, filterable list (category, price range, search, sort).
3. Opens `/products/:slug` → `GET /api/products/:slug` returns detail with image gallery and size/stock variants.
4. Browsing `/portfolio` and `/portfolio/:slug` shows the tailor's work.

## 2. Registration & login

**Register** (`/register`): customer submits `firstName`, `lastName`, `email`, `password`, `phone` → `POST /api/auth/register` creates a `CUSTOMER` user and returns tokens + user.

**Login** (`/login`): `POST /api/auth/login` verifies credentials → returns `{ accessToken, refreshToken, user }`. Stored in the AuthStore; user lands on their destination or `/`.

Guests can also be redirected to login with a `returnUrl` query param so they come back to where they were after authenticating.

## 3. Profile

Logged-in customer visits `/profile` → `GET /api/auth/me` shows account info; edits via `PATCH /api/auth/profile`. Changes persist server-side.

## 4. Add to cart (guest → customer handoff)

1. Guest on a product detail page clicks "Add to Cart" with no JWT.
2. Redirected to `/login?returnUrl=/products/:slug&autoAdd=1&variantId=...`.
3. After login, `LoginPage` redirects back to the product page.
4. `ProductDetailPage` reads `autoAdd` + `variantId`, calls `POST /api/cart/items { productId, variantId, quantity: 1 }`, shows an "Added to cart" notification, then clears the URL params.

## 5. Cart

Cart is server-side (one per customer).

- `/cart` → `GET /api/cart` lists items with quantity and line totals.
- Quantity changes → `PATCH /api/cart/items/:id`.
- Remove item → `DELETE /api/cart/items/:id`.
- Navbar shows a live cart count badge.

## 6. Checkout (multi-step)

`/checkout` requires auth. Four steps:

1. **Address** — choose a saved address (radio) or add a new one via an inline form (`POST /api/addresses`). Default address auto-selected if present.
2. **Shipping** — pick POST (پست) or COURIER (پیک); shows estimated time + cost.
3. **Payment** — default `CARD_TO_CARD` (کارت به کارت): shows the shop's bank card info + transfer instructions. (Phase 8 adds Zarinpal.)
4. **Review** — order summary (items, address, shipping, payment method, total) → "Place Order" calls `POST /api/orders`, which converts the cart into an order.

## 7. Orders & card-to-card payment

1. Order placed → status `PENDING`, paymentStatus `PENDING`. Cart is emptied.
2. Redirect to `/orders/:id` → shows bank card details + amount + receipt upload form.
3. Customer transfers money externally, uploads a receipt screenshot.
4. Admin reviews the receipt and confirms or rejects from the admin orders page.
5. On confirm → status `CONFIRMED`, paymentStatus `PAID`.

**Status lifecycle** (only admin can transition):

```
PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
  |          |
  |          +-> CANCELLED
  +-> CANCELLED
```

Customers see their history at `/orders` (`GET /api/orders`) and detail at `/orders/:id`.

## 8. Admin panel

Lives under `/admin` (AdminGuard — role must be `ADMIN`). Sidebar + header layout. Includes:

- **Dashboard** — stats (orders, revenue, customers, products), recent orders.
- **Products** — list, create/edit form with image upload, variants (size + stock + optional price).
- **Categories** — CRUD.
- **Orders** — list + detail; change status; confirm/reject card-to-card receipts.
- **Portfolio** — CRUD of portfolio projects.
- **Customers** — list of registered users.
- **Messages** — contact form submissions; mark read, delete.
- **Settings** — shop name, business hours, bank card info, shipping rates.

## 9. Contact

`/contact` → `POST /api/contact` submits name/email/phone/message; stored as a `ContactMessage` the admin reads in the admin panel.

## 10. Payment (Phase 8)

Zarinpal as an alternative to card-to-card: `POST /api/payment/request` → redirect → `GET /api/payment/callback` → `POST /api/payment/verify`. SMS notifications (Kavenegar) on order status changes.
