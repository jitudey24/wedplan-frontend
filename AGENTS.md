<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# WedPlan Client — Agent Notes

Plan first, code second. This file holds only durable, verified context — decisions and gotchas that took real work to learn. Append new ones and strike claims that no longer match the code; don't add play-by-play task logs.

## Verify before finishing (exact commands)

- `npx tsc --noEmit` — there is **no `typecheck` script**. Must exit 0.
- `npm run lint` — script is bare `eslint` (flat config, whole repo). Expected: **0 errors**, 7 known `@next/next/no-img-element` `<img>` warnings (pre-existing; leave alone).
- `npm run build` — passes; check the route list after touching `src/app/`.
- Order: `tsc --noEmit` → `lint` → `build`.
- **No test runner exists in this repo** (no test files, no test script). The backend has `npm run smoke-test` (see `../WedPlan_Server`).
- After deleting `.next`: if `tsc` says `Cannot find name 'LayoutProps'`, run `npx next typegen` — layouts use the generated global `LayoutProps<"/route">` from `.next/types`.

## Stack facts (verified in config, do not re-discover)

- Next.js **16.4.6** App Router; `next.config.ts` enables `cacheComponents`, `partialPrefetching`, `reactCompiler`, `experimental.agentFeedback`. Breaking changes vs. training data — read `node_modules/next/dist/docs/` before using any Next API (see auto-generated block above; `next dev` re-adds it, keep it).
- Tailwind CSS v4, CSS-first config in `src/app/globals.css` (no `tailwind.config`).
- UI: shadcn style **base-nova** (`components.json`) on `@base-ui/react`, **not Radix** → there is **no `asChild`**; use Base UI's `render={<Component />}` prop (e.g. `<DropdownMenuTrigger render={<Button />}>`).
- `cn` comes from the `"cn"` package (`@/lib/utils` re-exports it) — match import style in `src/components/ui/*`.
- `lucide-react` has **no brand icons** (Facebook/Instagram/…) — inline SVGs for social icons.
- Path alias `@/*` → `src/*`.

## Two-repo layout & wiring

- Backend is the sibling **`../WedPlan_Server`** (npm package name `wedplan-server`): Express 5, CommonJS, MongoDB, port 5000. Scripts: `npm start` (`node index.js`), `npm run dev` (nodemon), `npm run smoke-test`.
- **All API calls use `apiRequest` from `@/lib/api`** — attaches the Better Auth JWT (`authClient.token()`) + `credentials: "include"`; base URL `NEXT_PUBLIC_API_URL || NEXT_PUBLIC_API_BASE_URL || http://localhost:5000`.
- `src/lib/api-client.ts` + `src/lib/auth-session.ts` (localStorage `wedplan.auth`) are **legacy, imported by nothing** — auth is Better Auth cookies only; don't build on them.
- Auth = Better Auth (`src/lib/auth-client.ts`, plugins `adminClient` + `jwtClient`). Single source of truth for UI state: `useAuth()` from `@/hooks/use-auth` (bridges `authClient.useSession()`); `AuthProvider` wraps the root layout so Navbar updates instantly on login/logout.
- Route guard: `<ProtectedRoute allowedRoles={[...]} />` (`src/components/auth/ProtectedRoute.tsx`) — redirects to `/signin?callbackURL=…`, wrong role → `siteConfig.dashboards[role]`. Applied in `/dashboard` layout (`["customer"]` only — admins/vendors are bounced out), the `/vendor` and `/admin` shells, `/profile`, `/payment`, `/services/new`.
- `src/config/site.ts` = single source for routes, brand, contact, and post-login landing per role (`dashboards.{admin,vendor,customer}`).
- Role routes: customer `/dashboard` (+ `budget`/`checklist`/`bookings`), vendor `/vendor/{dashboard,services,services/new,bookings,subscription,profile}`, admin `/admin/{dashboard,services,users,transactions}`; shared `/`, `/services`, `/services/[id]`, `/profile`, `/auth/callback` (Google OAuth lands here, then role-redirects), `/payment` (in-app Stripe checkout page).

## Backend contract gotchas (cost real debugging time)

- `GET /api/v1/bookings` is **admin-only** → vendors must use `/api/v1/bookings/vendor`. Vendor's own services = `/api/v1/services/mine` (public `/api/v1/services` lists everyone's).
- MongoDB IDs: `vendorId`/`serviceId`/`_id` may be ObjectId **or** string — query with `$or` on both and compare via `String(...)`. Backend `src/routes/{services,bookings}.js` already do this; keep the pattern for new routes.
- Profile writes are split: avatar → `PATCH /api/v1/profile`; business fields → `PATCH /api/v1/profile/vendor` (server whitelist, `input: false` — role/approval/subscription can never be changed client-side). Pending vendors must use `[authenticateUser, requireRole("vendor","admin")]`, **not** `requireVendor` (which also demands `vendorApproved === true`).
- API response shapes: auth → `{ success, message?, token, user: { _id|id, name, email, avatarUrl?, role, vendorApproved? } }`; errors → non-2xx + `{ message }` (rendered directly in toasts).
- Free vs Premium: free vendor sees only the **3 most recent bookings** (client-side `.slice`, so status filters still work on the full list); premium sees all. Activation is **server-verified only** (`POST /api/v1/subscription/verify-stripe-session`: unpaid → 400, session for another vendor → 403, Stripe unconfigured → 503; plan + vendorId come from Stripe session `metadata`). Expired premium auto-reports `plan:"free", expired:true`. Checkout is Stripe `mode:"payment"` (one-time); `success_url` must contain the **literal** `{CHECKOUT_SESSION_ID}`.
- The Next route handlers `app/api/checkout_sessions`, `app/api/checkout_session`, `app/checkout_session` are legacy auth-forwarding proxies; the primary flow calls the Express backend directly via `apiRequest`.

## cacheComponents + react-hooks lint rules (hard constraints)

- `new Date()` is **blocked in prerendered passes** (server *and* client components) and crashes `npm run build`. Any "current time" UI must use `CopyrightYear` (`src/components/layout/copyright-year.tsx` — `useSyncExternalStore`, `null` server snapshot). Reuse that pattern.
- `react-hooks/set-state-in-effect` is enforced: never `setState` in an effect (e.g. don't close the mobile drawer on pathname change — close it in click handlers). `carousel.tsx`/`use-mobile.ts` were fixed with `useSyncExternalStore` — keep them that way.
- React compiler: react-hook-form's `form.watch` trips `react-hooks/incompatible-library` → use `useWatch({ control, name })`.
- `useMemo` needs an inline arrow: `useMemo(() => getTomorrowISO(), [])`, never `useMemo(getTomorrowISO, [])`.
- `window.location.assign(url)`, not `window.location.href = url` (`react-hooks/immutability`).

## Env & secrets

- This repo currently has **no `.env`**; everything falls back to `http://localhost:5000` / friendly toasts. When creating it:
  - `NEXT_PUBLIC_API_URL` **and** `NEXT_PUBLIC_API_BASE_URL` — different files read different names; set **both** to the same backend URL.
  - `NEXT_PUBLIC_IMGBB_API_KEY` — image uploads (`src/lib/imgbb.ts` + inline copies in forms); missing key → error toast, app still works.
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — in-app `/payment` page.
- Server-only secrets (`STRIPE_SECRET_KEY`, Mongo creds) belong in `../WedPlan_Server/.env` — **never** `NEXT_PUBLIC_*`.
- ⚠️ Rotate in the dashboards if not already done: a Stripe secret key and the Atlas password were shared in plaintext in earlier sessions, and a `NEXT_PUBLIC_STRIPE_SECRET_KEY` once existed.

## Demo data (frontend-only, replaceable)

- `wedplan.users` (`src/lib/demo-auth.ts`) — SHA-256 demo credentials so sign-in round-trips work.
- `wedplan.bookings` (`src/lib/demo-bookings.ts`) — bookings for demo (non-ObjectId) service IDs, `demo-<uuid>`, created/cancelled locally instead of via API; real services always POST to the backend. Delete both once the backend seeds those records.

## Design language (token-level, no hardcoded colors in components)

- Deep green `--primary`, `--gold`, ivory `--secondary`, gold `--accent` in `globals.css`; headings use `font-heading` (Playfair via `next/font`), body Geist.
- Prices display `৳` (not `$`) across customer and vendor views.
- Home hero background = `/images/Banner.jpg` (CSS `backgroundImage` in `src/app/page.tsx`); `images.remotePatterns` allows `images.unsplash.com` for card fallbacks.
- Logo = `Monogram`/`Logo` in `src/components/layout/logo.tsx` — SVG glyph positions are hand-estimated; nudge x/y/fontSize if the mark looks off, or drop the original PNG in `public/`.

## Operational quirks

- The user's own dev server often already occupies **port 3000** — smoke-test against it or use another port (`next start -p 3100`).
- The `/vendor` shell renders sidebar content for every vendor page; `/vendor/*` pages must NOT add their own page-level `min-h-screen`/sidebar chrome (the shell provides it). Same idea for `/dashboard` and `/admin` shells.
