# Project Memory
Updated: just now

## Core
- Brand is "Just Goofing". Theme: Bright Kids Playground — cream base, candy pastels (coral/mint/butter/lavender/sky), chunky rounded cards, sticker decorations.
- Typography: Fredoka (display + headings, 400-700 only), DM Sans body. No serifs anywhere.
- Platform: Native Capacitor mobile app from root ('/'). No web landing pages. Deployed as Vercel SPA.
- Backend: Lovable Cloud (Supabase + PostgreSQL). Designed for portability.
- DB Security: RLS strictly command-specific. Never use cross-table joins or recursive lookups in policies.
- Auth: Phone + OTP via mock provider. Deterministic password `${phone}-justgoofing-2024`. Non-blocking auth state listeners.
- UX: Bright, playful, 1-2 taps, premium kid-friendly motion (wobble/bounce/wiggle), generous radii (24-32px), colorful gradient buttons with offset shadows.
- Dev Credentials: Super Admin (Phone: 8373914073 / OTP: 111111), Delivery Partner (Phone: 7777777777 / OTP: 111111).
- Customer dashboard at /home shows hour pack balances, active session timer, upcoming bookings, QR check-in. Menu at /menu sells hour packs + one-off slots.

## Memories
- [Aesthetic](mem://style/aesthetic) — Bright Kids Playground: cream + candy pastels, Fredoka, chunky cards, sticker decorations
- [Color Palette](mem://style/color-palette) — Coral, mint, butter, lavender, sky pastels on cream with ink text
- [Typography](mem://style/typography) — Fredoka display+headings, DM Sans body
- [Background Audio](mem://features/background-audio) — Autoplay instrumental with mute toggle in header
- [Brand Identity](mem://project/identity) — "Just Goofing" indoor playground for kids
- [Mobile Onboarding](mem://features/mobile-onboarding) — 3s splash, OTP login, welcome page, 1hr free welcome offer
- [Platform Architecture](mem://architecture/platform) — Capacitor native mobile app, bundled local files
- [App Services](mem://features/app-services) — Hour packs (no expiry), slot bookings, loyalty rewards
- [Backend Architecture](mem://architecture/backend) — Lovable Cloud Supabase + PostgreSQL
- [Operations Routing](mem://architecture/operations-system) — RBAC for staff dashboards
- [Dev Credentials](mem://auth/development-credentials) — Mock Super Admin phone 8373914073 / OTP 111111
- [App Header](mem://features/app-header) — Left logo, music toggle, coin balance pill, notification bell
- [UX Principles](mem://style/ux-principles) — Kid-friendly, 1-2 taps, premium playful motion, no dark patterns
- [Database Security](mem://constraints/database-security) — Command-specific RLS, no cross-table joins
- [Location Services](mem://features/location-based-service) — Haversine nearest store, 30s timeout
- [Mock OTP Auth](mem://auth/mock-otp-architecture) — Phone identity, deterministic password, non-blocking auth
- [Loyalty System](mem://features/loyalty/system) — Campaigns, referrals, points (Goofy Points), badges
- [User Profile](mem://features/user-profile) — Birthday/anniversary tracking, +91 phone, address book
- [Deployment Routing](mem://architecture/deployment-routing) — Vercel SPA rewrite rule mapping all paths to index.html
- [Delivery Partner](mem://features/ops/delivery-partner-experience) — Rider interface, online/offline toggle
