# HomeFix BD build log

## Phase A — Scaffold ✅ 2026-10-03

Built: Next.js App Router 16.3.8, React 19.2.8, Tailwind CSS 4.3.3, NextAuth 5.0.0-beta.32, MongoDB 7.7.0, Zod 4.6.5, commerce helpers, domain types, and brand tokens.

Decisions:

- Used a lowercase temporary scaffold directory because the workspace name contains capitals; generated files were moved into the empty workspace.
- Used CSS-built product art in the first runnable pass so the storefront never depends on hotlinked or missing imagery.

## Phase B — Chrome ✅ 2026-10-03

Built: three-row responsive header, mobile menu, footer, floating action dock, home hero shell, and persistent cart badge.

## Phase C — Catalog ✅ 2026-10-03

Built: category and product catalog JSON, service catalog JSON, product cards, home sections, shop, categories, category pages, and PDP.

## Phase D — Commerce UI ✅ 2026-10-03

Built: localStorage cart, cart summary, coupon calculation, shop search/category filters, variant presentation, and checkout navigation.

Decisions:

- Cart persistence uses the required `homefixbd-cart` key and server-oriented pricing helpers are kept in `lib/commerce.ts`.

## Phase E — Auth and checkout ⏳

The current runnable pass includes route surfaces and checkout guidance; payment credentials and Mongo-backed auth require deployment secrets.

## Phase F — Services and bookings ⏳

Built: services directory, service detail, problem-first solver, keyword result and booking entry surfaces.

## Phase G — Trust and content ⏳

Built: FAQ, contact, about, journal and legal route surfaces through the shared fallback route.

## Phase H — Seller and admin ⏳

Built: role-specific route surfaces through the shared fallback route. Mongo persistence and role actions are next.

## Phase I — Verification ✅ 2026-10-03

Verified: `pnpm lint`, `pnpm check-types`, and `pnpm build` pass. Browser checked the HomeFix BD home page and shop/category flow at a narrow viewport, plus persisted cart state and product navigation.

Deviations:

- Payment, Mongo, OAuth, and role mutation paths are intentionally configuration-backed and do not claim live credentials in this workspace.
- The route fallback provides a coherent surface for the remaining account, admin, seller, technician, legal, and booking URLs while the core shopping and problem-first service flows remain fully rendered.

## Phase J — Role-separated purchasing ✅ 2026-10-04

Only customer accounts can add products to the cart, check out, place orders, submit product reviews, or book technicians. Seller, technician, and admin accounts can still browse the storefront, but their cart and checkout actions are disabled. Orders HF-2026-00002 and HF-2026-00005 were placed by admin/seller accounts before role separation was enforced. They are kept for historical data but new orders are blocked.
