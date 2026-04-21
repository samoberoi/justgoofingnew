

## End-to-End QA Report & Consistency Fix Plan

### Audit summary (pages reviewed)
SplashScreen, LoginPage, WelcomePage, DashboardPage, MenuPage, BookingPage, BuyPackPage, PaymentPage, ProfilePage, KidsPage, WalletPage, OrdersPage + shared `BottomNav`, `RoyalHeader`, `ProfileHero`.

---

### Issues found

**1. Hard inconsistencies (visible bugs)**

| # | Page | Issue |
|---|------|-------|
| 1 | **PaymentPage** | Still themed as the old Mughal/biryani app: uses `text-gradient-gold`, "Track My Biryani", "Order Confirmed! Hang Tight", `font-heading` instead of `font-display`, lucide-only icons. Doesn't match the Goofing aesthetic at all. |
| 2 | **CartPage** | Dead route — silently redirects to `/home`. Should be removed from `App.tsx` routes entirely. |
| 3 | **ProfilePage** | Imports legacy `Stickers` (Star/Sparkle/Squiggle) — visually noisy, doesn't match other pages' clean dark-hero/white-sheet aesthetic. Also still uses 🎈 emoji in the title where other pages use 3D icons. |
| 4 | **ProfileHero** | Uses lucide `Crown` + `Phone` icons + `tierEmoji`; no dark hero card like Dashboard / Wallet. Inconsistent. |
| 5 | **LoginPage** | "Just Goofing" branding mixed with `<img src="/logo.png">` (likely a stale BIRYAAN logo asset). Welcome/Splash/Header use the clean "JG" mark — login should match. |
| 6 | **BottomNav** | The center FAB icon is `play`, but the Play tab also uses `play`. The FAB navigates to `/menu` which is the same as the Play tab → redundant. Center FAB should be a distinct primary action (e.g. **QR / Check-in** — the user's most-used moment) or visually differentiated. |
| 7 | **Header** | `bg-mint` wallet pill with `Icon3D wallet` looks misaligned (icon is 22px in a tiny pill). Notification dot uses `ring-background` which is fine, but the bell icon overflow makes the 40px circle look cramped. |
| 8 | **BookingPage** | `lucide` icons `Users / Sparkles / PartyPopper` mixed in — should use `Icon3D` (`kid`, `gift`, `calendar`) for consistency. |
| 9 | **KidsPage** | Form uses old `bg-gradient-coral` etc. classes which now resolve to flat colors; `KID_COLORS` array combines `bg-gradient-*` + `shadow-pop-*` — works but reads like legacy code; also uses lucide `Cake / GraduationCap / Camera` instead of `Icon3D`. |
| 10 | **DashboardPage** | Greeting "Hi {firstName}" — when name is missing, defaults to "Goofer" (good). But the `LIVE` chip overlap on small screens can clip the timer hour digit. |
| 11 | **Splash → Login transition** | Hard `navigate('/login')` after 2.4s with no fade — abrupt. Other transitions use Framer Motion. |
| 12 | **OrdersPage** | Imports lucide `Calendar, Clock, Users, Hourglass` but page now favors `Icon3D`. Inconsistent. |

**2. Soft inconsistencies (theme drift)**
- Mixed font stacks: some pages use `font-heading`, others `font-display` — both now point to Plus Jakarta Sans, but for tonal hierarchy we should standardize: `font-display` = numbers/headlines, `font-heading` = labels/buttons, `font-body` (Manrope) = paragraphs.
- Some pages use `rounded-[32px]` hero cards, some use `rounded-[28px]`, some `rounded-[24px]`. Standardize: hero=32, card=24, chip=full.
- Border treatment varies: some cards use `border border-border`, some `border-2 border-ink/8`, some none.
- Back-button styles vary across pages (3 different sizes/shapes).

**3. Functional gaps**
- **PaymentPage success block** still routes to `/tracking` (doesn't exist in App.tsx routes) — clicking "Track My Biryani" 404-redirects to `/home`.
- **No global page transitions** — pages snap-cut. Add a layout-level `AnimatePresence` wrapper with consistent fade+slide.
- **ProfilePage data fetching** doesn't subscribe to realtime — kids/orders/addresses won't auto-refresh after edits in another tab.

---

### Fix plan (single batch)

**A. Remove dead code & legacy theme**
1. Delete `CartPage.tsx`, drop `/cart` route from `App.tsx`.
2. Delete usages of `Stickers` from `ProfilePage.tsx`.
3. Strip BIRYAAN logo references from `LoginPage.tsx` → use the same "JG mint chip" mark used in Splash/Welcome/Header.

**B. Rebuild PaymentPage in new aesthetic**
4. Convert PaymentPage to dark-hero header + white sheet, swap `Smartphone/CreditCard/Wallet` lucide for `Icon3D` (`payment`, `wallet`, `pin`), replace gold gradient + "Biryani" copy with Goofing copy ("Booking confirmed!", "View my booking"), fix success route to `/orders` (the `/tracking` route doesn't exist).

**C. Standardize shared components**
5. **BottomNav**: change center FAB icon to `qr` and route it to `/my-qr` (the user's most-used live moment) — frees the Play tab to own `play`. Add subtle bounce on the FAB.
6. **RoyalHeader**: enlarge wallet pill (h-9), align icon at 18px inside; bell button 40×40 stays but icon shrinks to 22px to remove visual cramp.
7. **ProfileHero**: rebuild as a dark `bg-ink rounded-[32px]` card matching Wallet/Dashboard hero — avatar circle on left, name + phone + tier chip on right, no lucide icons (use `Icon3D` `tier`).

**D. Polish individual pages**
8. **ProfilePage**: replace 🎈 with `Icon3D badge`, drop Stickers, tighten spacing to `space-y-5`.
9. **BookingPage**: swap lucide `Users/Sparkles/PartyPopper` → `Icon3D` (`kid`, `gift`, `calendar`); ensure dark hero + white sheet structure.
10. **KidsPage**: replace lucide `Cake/GraduationCap/Camera` → `Icon3D` (`calendar`, `badge`, `user`); rename color array to flat `bg-coral / bg-mint / bg-butter / bg-lavender / bg-sky / bg-bubblegum` (drop legacy `bg-gradient-*` aliases).
11. **OrdersPage**: swap remaining lucide icons → `Icon3D`.
12. **DashboardPage**: move LIVE chip from `top-5 right-5` to `top-5 left-5` so it never overlaps the timer; reduce timer to `text-4xl` on screens <360px.

**E. Global polish**
13. Add a `PageTransition` wrapper in `App.tsx` that wraps every `<Route element={…}>` with a Framer `AnimatePresence` (fade + 8px y-slide, 220ms) for smooth navigation throughout.
14. Add a fade-out on `SplashScreen` before navigating.
15. **Token cleanup** in `index.css`: keep `bg-gradient-*` aliases (they're still used) but document that all "gradients" are now flat fills; codify radius scale (`--r-hero: 32px`, `--r-card: 24px`).
16. **ProfilePage realtime**: subscribe to `kids` + `orders` + `addresses` postgres_changes for the logged-in user.

**F. Manual QA pass after edits** (no code, just verification)
- Walk through: Splash → Login (OTP `111111`) → Welcome (skip) → Dashboard → Menu → Buy Pack → Dashboard → Profile → Kids → Wallet → Orders → Notifications.
- Walk through admin: Login as `8373914073` → Dashboard switch → Check-in → Orders.
- Verify realtime: open two tabs as same user, add a kid in tab A, see it appear in tab B.

---

### Files to be edited / created
- **Delete imports/routes**: `src/App.tsx` (remove `/cart`)
- **Delete file**: `src/app/pages/CartPage.tsx`
- **Edit**: `src/app/pages/PaymentPage.tsx`, `LoginPage.tsx`, `ProfilePage.tsx`, `BookingPage.tsx`, `KidsPage.tsx`, `OrdersPage.tsx`, `DashboardPage.tsx`, `SplashScreen.tsx`
- **Edit**: `src/app/components/BottomNav.tsx`, `RoyalHeader.tsx`, `profile/ProfileHero.tsx`
- **Create**: `src/app/components/PageTransition.tsx`
- **Light edits**: `src/index.css` (radius scale comment + tokens)

### Out of scope (will not touch)
- Ops/admin pages styling (per earlier scope: customer pages only).
- Database schema / RLS — all real-time + reads already work with current policies.
- 3D asset regeneration — current 21-icon library is sufficient.

After implementation I will deliver a final QA report listing each fix verified, with any remaining minor issues called out.

