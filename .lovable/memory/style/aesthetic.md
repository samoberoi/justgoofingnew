---
name: Bright Kids Playground aesthetic
description: Cream base with candy pastels (coral, mint, butter, lavender, sky), Fredoka display font, chunky rounded cards, sticker decorations
type: design
---
The visual language is a bright, playful, kids-first aesthetic inspired by modern Dribbble-style children's product apps.

**Background**: Cream `hsl(36 100% 97%)` with subtle confetti radial gradients (`bg-confetti` utility) for warmth without busyness.

**Palette (HSL design tokens, all in index.css)**:
- coral `#FF7A8A` — primary, energy
- mint `#7DD3C0` — secondary, calm
- butter `#FFD56B` — accent, joy
- lavender `#B8A5E3` — soft highlight
- sky `#7EC8E3` — cool support
- peach `#FFB48E`, bubblegum `#FFA3D1`, grape `#8E5BD9` — extras
- ink `#2D2438` — primary text (deep purple-black, not pure black)

**Typography**: Fredoka (400-700) for ALL headings + display text. DM Sans for body. No serifs anywhere. Kids-friendly, rounded, friendly weights.

**Components**:
- Border radius is chunky: `rounded-[24px]` to `rounded-[32px]` standard. `--radius: 1.5rem`.
- Cards: white card bg, `border-2 border-ink/8`, `shadow-pop` (offset shadow for depth) or `shadow-soft`.
- Color-rotated cards: rotate through gradient classes (`bg-gradient-coral`, `bg-gradient-mint`, etc.) to give each list item a distinct candy color.
- Buttons: large, rounded-2xl, gradient backgrounds with matching `shadow-pop-{color}` (e.g. `shadow-pop-coral`).
- Pills/chips: rounded-full, bordered, with shadow-soft.
- Bottom nav: floating rounded card (28px), icon active state pops up with colored gradient capsule.

**Sticker decorations**: SVG components in `src/app/components/Stickers.tsx` — Star, Sparkle, Squiggle, Cloud, Heart, Confetti. Scatter at low opacity (20-30%) on hero cards and empty states. Animate with `animate-wobble`, `animate-bounce-soft`, or framer-motion floats.

**Motion**: Playful — wobble, bounce-soft, wiggle. Tap scales 0.92-0.96, hover scales 1.01-1.05. Live timer/badges use pulsing dots.

**Voice**: Casual, fun, exclamatory. "Heyyy 👋", "Let's Goof Around!", "Pick your fun ✨", "Show me the fun", "Goof off". Emoji used liberally as accents.

**Replaces**: The previous Mughal Royal Sultaniat / matte black + gold theme is fully retired for the customer app. Ops dashboards may retain neutral styling.
