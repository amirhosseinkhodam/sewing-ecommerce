# Tailor Ecommerce — Complete Plan

## Overview

A Persian-first, mobile-responsive tailor shop ecommerce website with guest browsing, customer cart/checkout, admin panel for full management, and Zarinpal payment integration.

---

## 1. System Architecture

```
Frontend (Angular 19 + Tailwind CSS + SignalStore)
       │  HTTP (JSON + JWT)
Backend (NestJS + Prisma + PostgreSQL)
       │  SQL
Database (PostgreSQL)
```

**Other services:** Zarinpal (payment), Kavenegar (SMS), local filesystem (images)

---

## 2. Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Angular 19 standalone + Tailwind + NgRx SignalStore | Already set up, modern, zoneless |
| Backend | NestJS + TypeScript | Same language as frontend, structured, scalable |
| ORM | Prisma | Type-safe, auto-generated types, migrations |
| Database | PostgreSQL | Reliable, JSON support, full-text search |
| Auth | JWT (access + refresh) | Stateless, standard |
| Payment | Zarinpal | Most popular Iranian gateway |
| Styling | Tailwind CSS + tailwindcss-rtl | Mobile-first, RTL ready |
| CDN | ArvanCloud (production) | Iranian CDN |

---

## 3. Database Schema

```
User
├── id (uuid, PK)
├── firstName / lastName / email / phone
├── password (bcrypt)
├── role: CUSTOMER | ADMIN
├── createdAt / updatedAt
├── addresses: Address[]
├── orders: Order[]
└── cart: Cart?

Category
├── id (uuid, PK)
├── name / slug (unique) / description / image
├── sortOrder / isActive
├── createdAt / updatedAt
├── products: Product[]
└── portfolio: Portfolio[]

Product
├── id (uuid, PK)
├── name / slug (unique) / description / price
├── fabric / images (JSON string[])
├── categoryId (FK -> Category)
├── isActive / isFeatured
├── createdAt / updatedAt
├── variants: ProductVariant[]
└── cartItems: CartItem[]

ProductVariant
├── id (uuid, PK)
├── productId (FK -> Product)
├── size: STRING (XS/S/M/L/XL)
├── stock: INT
├── price: DECIMAL (nullable, fallback to product.price)
├── createdAt / updatedAt

Portfolio
├── id (uuid, PK)
├── title / slug (unique) / description
├── images (JSON string[])
├── categoryId (FK -> Category, nullable)
├── isActive
├── createdAt / updatedAt

Cart (one per user)
├── id (uuid, PK)
├── userId (FK -> User, unique)
├── items: CartItem[]
├── createdAt / updatedAt

CartItem
├── id (uuid, PK)
├── cartId (FK -> Cart)
├── productId (FK -> Product)
├── variantId (FK -> ProductVariant)
├── quantity: INT
├── createdAt / updatedAt

Address
├── id (uuid, PK)
├── userId (FK -> User)
├── label / province / city / fullAddress
├── postalCode / phone
├── isDefault
├── createdAt / updatedAt

Order
├── id (uuid, PK)
├── userId (FK -> User)
├── items: OrderItem[]
├── totalAmount: DECIMAL
├── status: PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED
├── shippingMethod: POST | COURIER
├── shippingAddressId (FK -> Address)
├── paymentMethod: ZARINPAL | CARD_TO_CARD
├── paymentStatus: PENDING | PAID | FAILED | REFUNDED
├── zarinpalAuthority
├── trackingCode
├── notes
├── createdAt / updatedAt

OrderItem (snapshot)
├── id (uuid, PK)
├── orderId (FK -> Order)
├── productId (FK -> Product)
├── productName / productImage / size
├── quantity / unitPrice / totalPrice

ContactMessage
├── id (uuid, PK)
├── name / email / phone
├── message
├── isRead
├── createdAt / updatedAt
```

---

## 4. Frontend Routes

```
Public (guest)
────────────────────────────
/                 HomePage
/products         CatalogPage (grid + filters + pagination)
/products/:slug   ProductDetailPage (images, sizes, add-to-cart)
/portfolio        PortfolioPage (gallery grid)
/portfolio/:slug  PortfolioDetailPage
/about            AboutPage
/contact          ContactPage
/login            LoginPage
/register         RegisterPage

Protected (customer)
────────────────────────────
/cart             CartPage
/checkout         CheckoutPage (multi-step: address -> shipping -> payment -> review)
/orders           OrderHistoryPage
/orders/:id       OrderDetailPage
/profile          ProfilePage
/addresses        AddressManagementPage

Admin (admin role)
────────────────────────────
/admin                    DashboardPage (stats, charts)
/admin/products           ProductListPage
/admin/products/new       ProductFormPage (create)
/admin/products/:id/edit  ProductFormPage (edit)
/admin/categories         CategoryListPage
/admin/orders             OrderListPage
/admin/orders/:id         OrderDetailPage (admin view)
/admin/portfolio          PortfolioListPage
/admin/portfolio/new      PortfolioFormPage
/admin/customers          CustomerListPage
/admin/messages           MessagesPage
/admin/settings           SettingsPage
```

---

## 5. Frontend Feature Tree

```
src/app/
├── main.ts / app.ts / main.route.ts
│
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── admin.guard.ts
│   ├── interceptors/
│   │   └── auth.interceptor.ts
│   └── services/
│       └── api.service.ts (exists)
│
├── features/
│   ├── auth/
│   │   ├── pages/login.ts, register.ts
│   │   ├── store/auth.ts
│   │   ├── forms/login.ts, register.ts
│   │   ├── models/auth.ts
│   │   └── services/auth.ts
│   ├── products/
│   │   ├── pages/catalog.ts, product-detail.ts
│   │   ├── models/product.ts
│   │   ├── services/product.ts
│   │   └── components/product-card.ts, product-filter.ts, size-selector.ts
│   ├── cart/
│   │   ├── pages/cart.ts
│   │   ├── services/cart.ts
│   │   └── components/cart-item.ts, cart-summary.ts
│   ├── orders/
│   │   ├── pages/checkout.ts, order-history.ts, order-detail.ts
│   │   ├── models/order.ts
│   │   ├── services/order.ts
│   │   └── components/order-summary.ts, address-selector.ts, payment-method.ts
│   ├── portfolio/
│   │   ├── pages/portfolio.ts, portfolio-detail.ts
│   │   ├── models/portfolio.ts
│   │   └── services/portfolio.ts
│   ├── contact/
│   │   ├── pages/about.ts, contact.ts
│   │   ├── models/contact.ts
│   │   └── services/contact.ts
│   └── admin/
│       ├── pages/dashboard.ts, products-list.ts, product-form.ts
│       ├── pages/categories.ts, orders-list.ts, order-detail.ts
│       ├── pages/portfolio-list.ts, portfolio-form.ts
│       ├── pages/customers.ts, messages.ts, settings.ts
│       └── components/admin-layout.ts, data-table.ts, stat-card.ts
│
├── i18n/
│   ├── en.json (~150 keys)
│   └── fa.json (~150 keys)
│
└── shared/
    ├── index.ts (exists)
    ├── components/ (10 exist: button, card, input, select, textarea, form, confirm-dialog, confirm-bottom-sheet, theme-toggle, language-toggle)
    ├── services/theme.ts, language.ts (exist)
    ├── pipes/translate.ts, localized-date.ts (exist)
    ├── forms/password.ts (exist)
    ├── const/http-methods.ts (exist)
    └── models/index.ts (exists — ApiErrorResponse)
```

---

## 6. API Endpoints

**Auth**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`

**Products (public)**
- `GET /api/products` — paginated, filterable
- `GET /api/products/:slug` — detail
- `GET /api/products/:slug/variants` — sizes with stock

**Categories (public)**
- `GET /api/categories` — all active

**Cart (auth)**
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:id`
- `DELETE /api/cart/items/:id`

**Orders (auth)**
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders` — from cart

**Addresses (auth)**
- `GET /api/addresses`
- `POST /api/addresses`
- `PATCH /api/addresses/:id`
- `DELETE /api/addresses/:id`

**Payment**
- `POST /api/payment/request`
- `GET /api/payment/callback`
- `POST /api/payment/verify`

**Portfolio (public)**
- `GET /api/portfolio`
- `GET /api/portfolio/:slug`

**Contact (public)**
- `POST /api/contact`

**Admin**
- `GET /POST /api/admin/products`
- `GET /PATCH/DELETE /api/admin/products/:id`
- `GET /POST /api/admin/categories`
- `PATCH/DELETE /api/admin/categories/:id`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/status`
- `GET /POST /api/admin/portfolio`
- `PATCH/DELETE /api/admin/portfolio/:id`
- `GET /api/admin/customers`
- `GET /api/admin/messages`
- `PATCH /api/admin/messages/:id/read`
- `DELETE /api/admin/messages/:id`
- `GET /api/admin/dashboard/stats`

**Upload**
- `POST /api/upload` — single
- `POST /api/upload/multiple` — multiple

---

## 7. Key Workflows

### Guest browsing -> Add to cart -> Checkout

1. Guest visits `/products` -> `GET /api/products?page=1`
2. Clicks product -> `GET /api/products/:slug` -> detail with sizes + "Add to Cart"
3. Clicks "Add to Cart" -> no JWT -> redirect to `/login?returnUrl=/products/:slug&variantId=...`
4. Logs in -> `POST /api/auth/login` -> JWT stored in AuthStore
5. Redirected back -> `POST /api/cart/items { productId, variantId, quantity: 1 }`
6. Goes to `/cart` -> `GET /api/cart` -> reviews items, updates qty
7. "Proceed to Checkout" -> multi-step: address -> shipping -> payment -> review
8. "Place Order" -> `POST /api/orders` -> `{ status: PENDING }`
9. Redirect to Zarinpal -> callback -> `POST /api/payment/verify`
10. On success -> `/orders/:id` with status CONFIRMED

### Auth flow

- Guest browsing = no JWT -> can view all public pages
- Login required for cart, checkout, orders, profile
- AuthGuard checks JWT, redirects to `/login?returnUrl=...` if missing
- AuthInterceptor attaches `Authorization: Bearer <token>` to all HTTP requests
- On 401 -> attempt refresh token -> if fails, logout + redirect

### Admin flow

- Login as admin -> AuthStore stores user with `role: ADMIN`
- AdminGuard: `canActivate` checks `store.role() === 'ADMIN'`
- Admin layout: sidebar navigation + header + content area
- All admin pages are lazy-loaded under `/admin` route
- Product CRUD, Order status management, Portfolio management, Customer list, Messages

### Order status lifecycle

```
PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
  |          |
  |          +-> CANCELLED
  +-> CANCELLED
```

Each transition sends SMS to customer.

---

## 8. Implementation Phases

### Phase 0 — Backend Foundation (3 days)
- [ ] Initialize NestJS project with Prisma + PostgreSQL
- [ ] Define all Prisma models + run migrations + seed
- [ ] Auth module: JWT, bcrypt, Passport strategies
- [ ] File upload module (Multer)
- [ ] Global guards, filters, pipes
- [ ] Swagger/OpenAPI docs

### Phase 1 — Auth Frontend (2 days)
- [ ] LoginPage + RegisterPage
- [ ] AuthStore (SignalStore, `providedIn: 'root'`)
- [ ] AuthGuard + AdminGuard
- [ ] AuthInterceptor (attach JWT + handle 401)
- [ ] ProfilePage

### Phase 2 — Products + Categories (4 days)
- [ ] Backend: Category CRUD
- [ ] Backend: Product CRUD + variants + image upload
- [ ] Admin: CategoryListPage
- [ ] Admin: ProductListPage + ProductFormPage
- [ ] Public: CatalogPage (grid, filters, pagination, search)
- [ ] Public: ProductDetailPage (gallery, sizes, add-to-cart)

### Phase 3 — Cart + Checkout (4 days)
- [ ] Backend: Cart CRUD
- [ ] Backend: Address CRUD
- [ ] Frontend: AddressManagementPage
- [ ] Frontend: CartPage
- [ ] Frontend: CheckoutPage (multi-step stepper)
- [ ] Cart count badge in navbar

### Phase 4 — Orders + Payment (3 days)
- [ ] Backend: Order creation from cart
- [ ] Backend: Zarinpal integration (request + verify)
- [ ] Frontend: OrderHistoryPage + OrderDetailPage
- [ ] Admin: OrderListPage + status management + tracking
- [ ] SMS notification service (Kavenegar)

### Phase 5 — Portfolio + Contact (2 days)
- [ ] Backend: Portfolio CRUD
- [ ] Admin: PortfolioListPage + PortfolioFormPage
- [ ] Public: PortfolioPage + PortfolioDetailPage
- [ ] Public: AboutPage
- [ ] Public: ContactPage
- [ ] Admin: MessagesPage

### Phase 6 — Admin Dashboard (2 days)
- [ ] Backend: Dashboard stats endpoint
- [ ] Frontend: DashboardPage (stats cards, charts, recent orders)
- [ ] Frontend: CustomerListPage
- [ ] Frontend: SettingsPage
- [ ] Admin layout (sidebar + header)

### Phase 7 — Polish + Launch (3 days)
- [ ] SEO meta tags for all pages
- [ ] Complete i18n pass (all Persian text verified)
- [ ] Loading states, error boundaries, empty states
- [ ] Responsive audit (mobile/tablet/desktop)
- [ ] Image lazy loading, code splitting
- [ ] Build + deploy

**Total estimate: ~23 working days**

---

## 9. Backend (NestJS) Structure

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/ (current-user, roles)
│   │   ├── guards/ (jwt-auth, roles)
│   │   ├── filters/ (http-exception)
│   │   └── pipes/ (validation)
│   ├── auth/ (module, controller, service, jwt.strategy, dto)
│   ├── users/ (module, controller, service, dto)
│   ├── products/ (module, controller, service, dto)
│   ├── categories/ (module, controller, service, dto)
│   ├── cart/ (module, controller, service, dto)
│   ├── orders/ (module, controller, service, dto)
│   ├── portfolio/ (module, controller, service, dto)
│   ├── contact/ (module, controller, service, dto)
│   ├── upload/ (module, controller, service)
│   └── payment/ (module, controller, service, dto)
└── uploads/ (gitignored)
```

---

## 10. i18n Keys (~150 per language)

Navigation: `appName, home, products, portfolio, about, contact, cart, orders, profile, logout, login, register, admin, settings, search`

Product: `product(s), category(ies), price, size(s), fabric, addToCart, addedToCart, outOfStock, inStock, relatedProducts, noProductsFound, sortBy, filter, clearFilters, fromPrice, toPrice`

Cart: `cart, cartEmpty, cartEmptyMessage, startShopping, quantity, total, subtotal, shipping, grandTotal, proceedToCheckout, remove, updateCart`

Checkout: `checkout, shippingAddress, selectAddress, addAddress, shippingMethod, post, courier, paymentMethod, zarinpal, cardToCard, placeOrder, reviewOrder`

Order: `order(s), orderDetail, orderNumber, orderDate, orderStatus, orderHistory, status(Pending|Confirmed|Processing|Shipped|Delivered|Cancelled), paymentStatus, payment(Pending|Paid|Failed), trackingCode`

Auth: `email, password, confirmPassword, firstName, lastName, phone, register, login, forgotPassword, loginRequired, loginToAddToCart`

Admin: `dashboard, totalOrders, totalRevenue, totalCustomers, totalProducts, recentOrders, manageProducts, manageOrders, manageCategories, managePortfolio, manageCustomers, messages`

General: `save, cancel, delete, edit, add, refresh, loading, noData, confirm, success, error, couldNotLoadData, couldNotSave, couldNotDelete, darkMode, language, yes, no, submit, back, next, done, search, filter, clear, close, viewAll`

Portfolio: `portfolio, portfolioDetail, viewProject, relatedProjects`

Contact: `contactUs, aboutUs, name, message, sendMessage, messageSent, address, phoneNumber, workingHours`

---

## 11. Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| ORM | Prisma | Type-safe, auto-generated types, migrations, TypeScript-native |
| Auth tokens | JWT (access 15min + refresh 7d) | Standard, stateless, secure |
| Cart | Server-side (PostgreSQL) | Persists across devices, no data loss |
| Image upload | Local + Multer (MVP) | Simple for now, upgrade to CDN later |
| Pagination | Offset-based | Simple, sufficient for this scale |
| Search | `ILIKE %search%` + category filter | Simple for MVP |
| State management | SignalStore for Auth only | Everything else fetched via API service |
| Responsive | Tailwind sm/md/lg breakpoints | Mobile-first design |
| RTL | tailwindcss-rtl plugin | Already configured |
| Testing | Jest (frontend + backend) | Same framework both sides |

---

## 12. Day-by-Day Execution

**Week 1**
- Day 1-2: NestJS init + Prisma schema + migrations + seed
- Day 3: Auth module (register, login, JWT, guards)
- Day 4-5: Auth frontend (LoginPage, RegisterPage, AuthStore, AuthGuard, AuthInterceptor, ProfilePage)

**Week 2**
- Day 1: Categories + Products backend (CRUD, filtering, pagination, image upload)
- Day 2-3: Admin ProductPages (list, form) + CategoryPage
- Day 4-5: Public ProductCatalog + ProductDetail pages

**Week 3**
- Day 1: Cart backend API
- Day 2: CartPage frontend
- Day 3-4: Addresses + Checkout flow
- Day 5: Orders backend + OrderHistory/OrderDetail frontend

**Week 4**
- Day 1: Zarinpal payment integration
- Day 2-3: Portfolio (admin + public) + Contact
- Day 4: Admin Dashboard + Customers + Messages
- Day 5: AboutPage, home page polish, responsive audit

**Week 5**
- Day 1-2: i18n complete pass, SEO meta tags, error/loading/empty states
- Day 3: Testing critical paths (checkout, admin CRUD)
- Day 4: Build + deploy
