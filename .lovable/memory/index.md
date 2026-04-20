# Project Memory

## Core
- Brand: "Just Goofing" — kids play café/activity center. Tagline: "Where Fun Meets Innovation".
- Theme: Bright Kids Playground — cream `hsl(36 100% 97%)` base, candy pastels (coral #FF7A8A, mint #7DD3C0, butter #FFD56B, lavender #B8A5E3, sky #7EC8E3), ink #2D2438 text.
- Typography: Fredoka (display + headings), DM Sans (body). No serifs anywhere.
- Components: chunky `rounded-3xl` (`--radius: 1.5rem`), `border-2 border-ink/8`, `shadow-pop` offset shadows. Color-rotated gradient cards.
- Sticker decorations (`src/app/components/Stickers.tsx`): Star, Sparkle, Squiggle, Cloud, Heart, Confetti — scatter at low opacity, animate with `animate-wobble` / `animate-bounce-soft`.
- Voice: casual, exclamatory ("Heyyy 👋", "Let's goof off ✨"), emoji liberally as accents.
- Platform: Capacitor mobile app from '/'. Deployed Vercel SPA.
- Backend: Lovable Cloud (Supabase). RLS strictly command-specific.
- Auth: Phone + OTP via mock provider. Deterministic password `${phone}-justgoofing-2024`.
- Dev creds: Super Admin (8373914073 / 111111), Delivery Partner (7777777777 / 111111).
- Pricing: Hour packs (no expiry, never expire) AND one-off slot bookings. Welcome offer = 1 hour FREE first booking.
- Check-in: Parent shows QR → staff scans on `/check-in` → picks kid → +1 friend toggle = 2× hour deduction at check-out.

## Memories
- [Aesthetic](mem://style/aesthetic) — Bright Kids Playground full design language
- [Kids & Check-In](mem://features/kids-and-checkin) — Kids CRUD, staff check-in flow, +1 friend × 2 hour deduction
- [Mock OTP Auth](mem://auth/mock-otp-architecture) — Phone identity, deterministic password, non-blocking auth listeners
- [Database Security](mem://constraints/database-security) — Command-specific RLS, no cross-table joins or recursive lookups
- [Loyalty System](mem://features/loyalty/system) — Campaigns, referrals, 2.5% Goofy Points, no spin-the-wheel
- [Customer Identification](mem://features/ops/customer-identification-logic) — Aggregate by user_id, fallback phone/name
- [Ops Dashboard](mem://features/ops/dashboard) — Real-time analytics, top sellers, date filtering
- [Ops Workflows](mem://features/ops/workflows) — FIFO tile UI, smart prep ETA, 280px thermal KOTs
- [Deployment Routing](mem://architecture/deployment-routing) — Vercel SPA rewrite to index.html
