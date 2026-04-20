---
name: Kids onboarding feature
description: Parents add kids (name, gender, DOB, school, notes) on profile + dedicated /kids page; staff check-in picks kid + +1 friend toggle that doubles hour deduction
type: feature
---
**Tables**:
- `kids` — parent_user_id, name, gender, date_of_birth, school, notes, is_active. RLS: parents own their kids; super_admin full; store_manager read.
- `play_sessions` extended with `kid_id` FK + `plus_one` boolean.

**Customer UX**:
- `/kids` page: full CRUD with chunky color-rotated cards, age auto-calculated, soft-delete via `is_active=false` to preserve session history.
- Profile page shows horizontal "My Kids" carousel (`ProfileKids.tsx`) with avatars + age chips + school. Empty state CTA.
- BookingPage now picks kids via multi-select chips + "extra friends" stepper (replaces free-text kid name field). `kid_name` stored as comma-joined names for legacy compat.

**Staff UX (`/check-in` route)**:
- StaffCheckInPage: search by QR code or booking number → loads booking + parent's kids list → staff picks kid → optional "+1 friend" toggle.
- Active sessions tab shows live timers and check-out button.
- Check-out auto-deducts hours (× 2 if plus_one) from parent's oldest active `user_packs` first; marks pack `exhausted` when fully used. 15-minute rounding minimum.

**Hour deduction formula**: `billableHours = ceil(elapsed_hours * 4) / 4`, then `total = billableHours * (plus_one ? 2 : 1)`.

**Route**: `/check-in` — accessible to super_admin and store_manager via OpsBottomNav (ScanLine icon).
