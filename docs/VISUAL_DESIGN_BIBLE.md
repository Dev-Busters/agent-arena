# Agent Arena — Visual Design Bible

> **Purpose**: This document defines the visual identity of Agent Arena. Every UI component, page, and screen MUST follow these guidelines. This is not optional polish — visual quality is a core product requirement.
>
> **The #1 Rule**: Agent Arena is a GAME, not a SaaS dashboard. Every pixel should feel like it belongs in a dark fantasy RPG. If a screen could be mistaken for a settings panel, admin dashboard, or generic web app, it has failed.

---

## 1. THE ANTI-PATTERNS — WHAT "AI GENERATED" LOOKS LIKE

Before building anything, understand what we're avoiding. These are the hallmarks of generic AI-generated UI that make users immediately think "a bot made this":

### Typography Anti-Patterns
- ❌ Using Inter, Roboto, Arial, or system fonts for everything
- ❌ All text the same size/weight — flat hierarchy
- ❌ Utility-speak labels: "Manage your agent and view your progress"
- ❌ Sentence-case everything, no dramatic uppercase
- ❌ Small, modest headings that don't command attention

### Color Anti-Patterns
- ❌ Purple-to-blue gradients (the #1 AI cliché)
- ❌ Pink-to-purple gradients on cards
- ❌ Teal/cyan as the only accent color
- ❌ Gray borders on everything (#374151 border everywhere)
- ❌ Colors that don't mean anything — decorative gradients with no connection to game concepts

### Layout Anti-Patterns
- ❌ Uniform card grids with identical sizing
- ❌ Everything centered with generous padding (the "corporate clean" look)
- ❌ shadcn/ui default components with no customization
- ❌ Tables that look like spreadsheets
- ❌ No visual hierarchy — everything has equal visual weight

### Content Anti-Patterns
- ❌ Placeholder-style text: "Description goes here"
- ❌ Enterprise jargon: "Manage", "Configure", "View", "Settings"
- ❌ No personality, no flavor, no world-building in the UI text
- ❌ Missing icons/emojis where they'd add character

---

## 2. THE VISUAL IDENTITY — "TORCH-LIT ARENA"

Agent Arena's visual identity is **"Torch-Lit Arena"** — a dark fantasy underground coliseum where AI champions battle for glory. Think: warm firelight against dark stone, gold trophies gleaming in torchlight, ancient runes and battle-scarred champions.

### Reference Games for Visual Tone
- **Hades** — warm colors against dark backgrounds, bold UI, character portraits
- **Slay the Spire** — card-based inventory, rich color coding, atmospheric darks
- **Darkest Dungeon** — dramatic typography, torch-lit atmosphere, stress and tension
- **Diablo** — item rarity colors, dark gothic UI, gold as premium accent

### The Feeling We Want
When someone opens Agent Arena, they should feel:
- "This looks like a real game"
- "Someone designed this with care"
- "I want to explore this world"
- "My agent is a champion, and I'm proud of them"

NOT:
- "This looks like a template"
- "A developer made this, not a designer"
- "This is functional but boring"

---

## 3. COLOR SYSTEM

### Primary Palette

```css
:root {
  /* Backgrounds — dark with warm undertones, NOT pure gray */
  --bg-deepest:    #0a0a0f;     /* Near-black, for page background */
  --bg-dark:       #12121a;     /* Primary surface */
  --bg-card:       #1a1a28;     /* Card/panel background */
  --bg-elevated:   #222236;     /* Hover states, elevated surfaces */
  
  /* The key accent — WARM GOLD, not cold blue/teal */
  --gold:          #f59e0b;     /* Primary accent — gold/amber */
  --gold-bright:   #fbbf24;     /* Highlighted gold — numbers, ratings */
  --gold-dim:      #92600a;     /* Muted gold — borders, subtle accents */
  
  /* Secondary accents — used sparingly */
  --fire-orange:   #f97316;     /* Aggressive/attack elements */
  --blood-red:     #ef4444;     /* Danger, health loss, losses */
  --arcane-purple: #a855f7;     /* Magic, rare items, special effects */
  --ice-blue:      #38bdf8;     /* Defense, shields, mana */
  --venom-green:   #22c55e;     /* Healing, wins, positive states */
  
  /* Text */
  --text-primary:  #e8e6e3;     /* Warm off-white, NOT pure white */
  --text-secondary:#9ca3af;     /* Muted text */
  --text-dim:      #6b7280;     /* Very muted — timestamps, labels */
  
  /* Borders — warm, not gray */
  --border-subtle: #2a2a3d;     /* Default borders — warm dark */
  --border-hover:  #3d3d56;     /* Hover state */
}
```

### Color Meanings (NEVER use color randomly)

Every color must connect to a game concept:

| Color | Meaning | Used For |
|-------|---------|----------|
| Gold/Amber | Glory, achievement, power | ELO ratings, XP, gold currency, highlights |
| Fire Orange | Aggression, attack | Attack stat, aggressive AI, damage dealt |
| Blood Red | Danger, loss | HP loss, defeats, critical warnings, enemy damage |
| Arcane Purple | Magic, rarity | Epic items, magic abilities, special effects |
| Ice Blue | Defense, mana | Defense stat, MP bar, shields, mana abilities |
| Venom Green | Life, victory | Healing, HP restore, wins, positive outcomes |
| White/Silver | Neutral, common | Common items, base text, basic UI |

### Rarity Colors (MUST be consistent everywhere)

```css
--rarity-common:    #9ca3af;  /* Gray — dull, unremarkable */
--rarity-uncommon:  #22c55e;  /* Green — a step up */
--rarity-rare:      #3b82f6;  /* Blue — genuinely good */
--rarity-epic:      #a855f7;  /* Purple — powerful and coveted */
--rarity-legendary: #f97316;  /* Orange — the dream drop */
```

These must appear on: item borders, item name text, inventory cards, loot drop glows, and anywhere items are referenced. A player should ALWAYS be able to tell an item's rarity at a glance.

---

## 4. TYPOGRAPHY

### Font Stack

```css
/* Display font — for headings, titles, page names, big numbers */
/* Use ONE of these (pick during implementation, do not mix): */
font-family: 'Cinzel', serif;           /* Classic fantasy — like Diablo */
font-family: 'Uncial Antiqua', serif;   /* More medieval/runic feel */
font-family: 'MedievalSharp', cursive;  /* Bold fantasy gaming */
font-family: 'Pirata One', cursive;     /* Edgier, more aggressive */

/* Body font — for readable text, stats, descriptions */
font-family: 'Inter', 'system-ui', sans-serif;  /* Clean and readable */

/* Monospace — for numbers, stats, timers, cooldowns */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

Import display font from Google Fonts. The display font is ONLY for:
- Page titles ("Hall of Champions", "The Armory", "Battle Arena")
- Agent names
- Big stat numbers (ELO rating, level display)
- Wave announcements ("WAVE 5", "BOSS INCOMING")

Everything else uses the body font.

### Type Scale — BE BOLD

```css
/* Page titles — MASSIVE, commanding */
.page-title {
  font-family: var(--font-display);
  font-size: 3rem;        /* 48px — do NOT go smaller */
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--text-primary);
}

/* Section headers — clear hierarchy */
.section-title {
  font-family: var(--font-display);
  font-size: 1.5rem;      /* 24px */
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gold);
}

/* Big numbers — stats, ratings, levels */
.stat-number {
  font-family: var(--font-mono);
  font-size: 2.5rem;      /* 40px */
  font-weight: 700;
  color: var(--gold-bright);
}

/* Body text */
.body-text {
  font-family: var(--font-body);
  font-size: 0.875rem;    /* 14px */
  color: var(--text-secondary);
}
```

### The Rule of Dramatic Contrast

On every page, there must be at least ONE element that is visually dominant — a huge title, a massive number, a hero image. If everything is the same size, the page is boring. Create contrast:

```
HUGE:    Page title, hero stat number, boss name
Large:   Section headings, agent names, wave counter
Medium:  Stat values, item names, descriptions
Small:   Labels, timestamps, secondary info, footnotes
```

---

## 5. FLAVOR TEXT & COPY VOICE

The UI text is part of the game world. It should sound like it was written by a narrator in a fantasy game, not a product manager.

### Page Titles & Subtitles

| Page | ❌ Generic (DON'T) | ✅ Flavorful (DO) |
|------|-------------------|-------------------|
| Dashboard | "Dashboard — Manage your agent" | "War Room — Prepare for battle" |
| Arena | "Arena — Fight enemies" | "The Depths — Enter at your own risk" |
| Inventory | "Inventory — Manage equipment" | "The Armory — Forge your legend" |
| Leaderboard | "Leaderboard — View rankings" | "Hall of Champions — The greatest warriors" |
| Profile | "Profile — User settings" | "Chronicle — Your saga unfolds" |
| Landing | "Welcome to Agent Arena" | "Command AI Agents. Conquer the Arena." |

### Stat Labels

| ❌ Generic | ✅ Flavorful |
|-----------|-------------|
| "HP: 150" | "VITALITY — 150" or keep "HP" but make it stylized |
| "Attack: 18" | "MIGHT — 18" |
| "Defense: 11" | "FORTITUDE — 11" |
| "Speed: 15" | "AGILITY — 15" |
| "Intelligence: 12" | "ARCANA — 12" |

You don't have to use these exact words — but the stats should feel like they belong in a game world, not a spreadsheet.

### Empty States & Microcopy

| ❌ Generic | ✅ Flavorful |
|-----------|-------------|
| "No items found" | "Your armory stands empty. Enter the depths to claim your spoils." |
| "No battles yet" | "No tales of glory yet. The arena awaits." |
| "Loading..." | "Summoning..." or "Descending into the depths..." |
| "Error occurred" | "The ancient wards have faltered. Try again." |
| "Level Up!" | "ASCENSION — Your champion grows stronger" |
| "You died" | "FALLEN — But legends never truly die" |
| "Wave 5" | "WAVE V" (use roman numerals for waves) |

### Button Text

| ❌ Generic | ✅ Flavorful |
|-----------|-------------|
| "Enter Arena" | "DESCEND" or "ENTER THE DEPTHS" |
| "Manage Equipment" | "VISIT THE ARMORY" |
| "View Leaderboard" | "HALL OF CHAMPIONS" |
| "Start Battle" | "FIGHT" |
| "Equip" | "WIELD" |
| "Unequip" | "STOW" |
| "Craft" | "FORGE" |
| "Save" | "INSCRIBE" |

---

## 6. COMPONENT DESIGN PATTERNS

### Cards — Not Flat Rectangles

Default shadcn cards look like this:
```
┌─────────────────────┐
│  Gray border          │
│  Content              │
│  More content         │
└─────────────────────┘
```

Agent Arena cards should feel like this:
```css
.game-card {
  background: linear-gradient(
    135deg, 
    rgba(26, 26, 40, 0.9) 0%, 
    rgba(18, 18, 26, 0.95) 100%
  );
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Subtle warm glow on top edge */
.game-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(
    90deg, 
    transparent, 
    var(--gold-dim), 
    transparent
  );
}

/* Hover: border brightens, slight lift */
.game-card:hover {
  border-color: var(--gold-dim);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.1);
}
```

### Item Cards — Rarity is Visual Priority #1

```css
.item-card {
  /* Base card styles */
  background: var(--bg-card);
  border-radius: 8px;
  padding: 16px;
  position: relative;
  
  /* Rarity border — LEFT EDGE accent, not full border */
  border-left: 3px solid var(--rarity-color);
  
  /* Subtle rarity glow */
  box-shadow: inset 0 0 20px rgba(var(--rarity-rgb), 0.05);
}

/* Or alternatively: full border with glow for higher rarities */
.item-card[data-rarity="epic"],
.item-card[data-rarity="legendary"] {
  border: 1px solid var(--rarity-color);
  box-shadow: 
    0 0 15px rgba(var(--rarity-rgb), 0.15),
    inset 0 0 15px rgba(var(--rarity-rgb), 0.05);
}
```

### Stat Bars — Not Plain Progress Bars

Default progress bars are boring. Game stat bars should have character:

```css
.stat-bar-container {
  height: 20px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  position: relative;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 3px;
  position: relative;
  transition: width 0.5s ease;
}

/* HP bar — red to green gradient based on percentage */
.stat-bar-fill.hp {
  background: linear-gradient(90deg, #ef4444, #22c55e);
  /* Animated shimmer */
  background-size: 200% 100%;
}

/* XP bar — gold shimmer */
.stat-bar-fill.xp {
  background: linear-gradient(
    90deg, 
    var(--gold-dim), 
    var(--gold-bright), 
    var(--gold-dim)
  );
}

/* Subtle inner highlight on top */
.stat-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(
    to bottom, 
    rgba(255,255,255,0.15), 
    transparent
  );
  border-radius: 3px 3px 0 0;
}
```

### Navigation — Sidebar with Game Identity

The sidebar shouldn't be a generic icon list. It should feel like navigating a game menu:

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  position: relative;
}

/* Active state — gold accent, not generic blue highlight */
.nav-item.active {
  color: var(--gold);
  background: rgba(245, 158, 11, 0.1);
}

/* Gold left-edge indicator for active item */
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 25%;
  bottom: 25%;
  width: 3px;
  background: var(--gold);
  border-radius: 0 2px 2px 0;
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}
```

### Tables — Not Spreadsheets

Leaderboard and battle history tables should feel like scrolls or records, not Excel:

```css
.game-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 4px;        /* Row gaps */
}

.game-table thead th {
  font-family: var(--font-body);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim);
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.game-table tbody tr {
  background: var(--bg-card);
  transition: all 0.2s ease;
}

.game-table tbody tr:hover {
  background: var(--bg-elevated);
  transform: scale(1.01);        /* Subtle zoom on hover */
}

/* Top 3 rows get special treatment */
.game-table tbody tr:nth-child(1) {
  border-left: 3px solid #fbbf24;  /* Gold */
}
.game-table tbody tr:nth-child(2) {
  border-left: 3px solid #9ca3af;  /* Silver */
}
.game-table tbody tr:nth-child(3) {
  border-left: 3px solid #f97316;  /* Bronze */
}
```

---

## 7. PAGE-SPECIFIC DESIGN GUIDES

### Leaderboard — "Hall of Champions"

This is the reference page. The OLD design was excellent. Recreate its energy:

```
STRUCTURE:
1. Trophy icon (large, centered, can be emoji or SVG)
2. "Hall of Champions" in display font, MASSIVE (48px+)
3. Subtitle in italic: "The greatest warriors to descend into the depths"
4. Sort tabs: ELO Rating | Total Wins | Deepest Floor | Gold Earned
   → Active tab has gold underline/highlight
5. Filter row: agent type icons (sword, staff, diamond, star) + search bar
6. TOP 3 PODIUM:
   → Three cards side by side
   → #1 in CENTER, slightly LARGER and ELEVATED with crown icon
   → #2 on LEFT with silver badge
   → #3 on RIGHT with bronze badge
   → Each shows: agent shape/icon, name, @username, BIG ELO number in gold, level + WR
7. Full rankings table below the podium
```

The podium is what makes this feel like a game, not a spreadsheet. Never replace it with just a table.

### Dashboard — "War Room"

```
STRUCTURE:
1. Page title area:
   → "War Room" in display font
   → Subtitle: "Your champion awaits orders"

2. Agent Hero Card (full width, prominent):
   → Agent name in display font (large)
   → Class/type with icon
   → Level badge (styled, not just text)
   → Stat grid: HP, MIGHT, FORTITUDE, AGILITY, ARCANA
   → Stats use colored numbers — each stat in its thematic color
   → Agent shape/icon displayed large on the right side of the card
   → Win/Loss record with W highlighted green, L in red

3. Quick Action Cards (2-column):
   → "ENTER THE DEPTHS" — dark card with fiery orange glow/accent
   → "VISIT THE ARMORY" — dark card with gold/amber glow/accent
   → Both with icons and short flavor description
   → Hover: glow intensifies, slight scale-up

4. Recent Battles (below):
   → Title: "Battle Chronicle"
   → Each row: opponent name, time ago, XP gained (gold), WIN/LOSS badge
   → WIN badge: green with venom-green background
   → LOSS badge: red with blood-red background
   → Subtle alternating row backgrounds
```

### Inventory — "The Armory"

```
STRUCTURE:
1. Page title: "The Armory"
   → Subtitle: "Forge your legend"

2. Left Panel — "Equipped Gear"
   → Vertical stack of 4 slots: WEAPON, ARMOR, ACCESSORY, MODULE
   → Each slot has a label and a bordered area
   → When filled: show item with rarity border color, name, stats
   → When empty: dashed border with dim text "Awaiting a worthy relic"
   → Slot icons: ⚔️ Weapon, 🛡️ Armor, 💍 Accessory, ⚙️ Module

3. Right Panel — "Vault" (not "Backpack" — that's too generic)
   → Grid of item cards
   → Each card: rarity color border, item name, type label, stat bonuses
   → Equipped items: muted/dimmed with "WIELDED" badge (not "EQUIPPED" in red)
   → Hover: card lifts, border glows brighter
   → Click: equips/unequips with brief animation

4. Stat Summary Bar (bottom or side):
   → Show total stats WITH equipment bonuses
   → Format: "Base + Bonus = Total" in relevant colors
   → e.g., "MIGHT: 12 + 5 = 17" where 12 is white, +5 is green, 17 is gold
```

### Arena HUD — "The Depths"

The in-game HUD should feel integrated with the game world, not like a web app overlay:

```
TOP-LEFT: Level + Health + XP
  → "LEVEL 1" in gold, small caps
  → Health bar: red-to-green gradient with slight inner glow
  → XP bar: gold shimmer
  → Numbers in monospace font overlaid on bars

TOP-CENTER: Wave indicator
  → "WAVE I" in display font (use roman numerals)
  → Brief dramatic entrance animation when wave changes
  → Boss waves: "BOSS — [Name]" in blood red with screen-wide thin health bar

TOP-RIGHT: Kill counter + Enemy count
  → Styled, not just plain numbers
  → Kill count in gold, enemy count in dim white

BOTTOM: Ability bar
  → Q / E / R / F keys in stylized key-cap shapes
  → Cooldown shown as a dark overlay sweeping clockwise
  → Active/ready abilities glow slightly
  → Labels below keys: ability names in small text

BOTTOM-LEFT: Control hints
  → "WASD Move · SPACE Attack" in dim text
  → Only visible for first 30 seconds, then fades out
```

### Landing Page — First Impression

This page must be DRAMATIC. It sells the game.

```
STRUCTURE:
1. Full-viewport hero:
   → Dark background with subtle animated particles (embers floating up)
   → "AGENT ARENA" in massive display font, centered
   → Tagline below: "Command AI Champions. Conquer the Depths."
   → CTA button: "ENTER THE ARENA" — gold with glow, large
   → Subtle pulsing glow on the CTA to draw the eye

2. Feature section (scroll down):
   → 3-4 cards in a row, each with:
     → Icon (sword, shield, trophy, scroll)
     → Short bold title: "BATTLE", "EQUIP", "ASCEND", "CONQUER"
     → One-line description
   → Dark cards with warm edge highlights

3. Footer:
   → Minimal. Links + "Forged in the depths by Dev-Busters"
```

---

## 8. ANIMATION & MICRO-INTERACTIONS

### Guiding Principles
- Animations should feel **swift and purposeful** (150-300ms), never slow and floaty
- Use `ease-out` for entrances, `ease-in` for exits
- Gold glows and shimmers should feel like firelight — warm and alive
- Every interactive element should respond to hover — the UI should feel alive

### Key Animations

```css
/* Page transition — fade up */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Card entrance — stagger children */
.card-grid > * {
  animation: fadeInUp 0.4s ease-out backwards;
}
.card-grid > *:nth-child(1) { animation-delay: 0.05s; }
.card-grid > *:nth-child(2) { animation-delay: 0.1s; }
.card-grid > *:nth-child(3) { animation-delay: 0.15s; }
/* etc. */

/* Gold shimmer for important numbers */
@keyframes goldShimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.shimmer-gold {
  background: linear-gradient(
    90deg,
    var(--gold) 0%,
    var(--gold-bright) 50%,
    var(--gold) 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: goldShimmer 3s linear infinite;
}

/* Win/Loss badge pulse */
.badge-win {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.badge-loss {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* Button hover — warm glow */
.game-button:hover {
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
  transform: translateY(-1px);
}

/* Button press — quick press-down */
.game-button:active {
  transform: translateY(1px);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
}
```

### Loading States
Never show a blank page or a spinner. Show:
- Skeleton cards with a subtle shimmer animation (dark-to-slightly-less-dark wave)
- "Summoning..." or "Descending..." text
- The page layout should be immediately visible with placeholder shapes

---

## 9. ICONOGRAPHY & VISUAL ELEMENTS

### Agent Type Icons
Each agent class has a distinct shape and color. These MUST be consistent across:
- Leaderboard cards
- Dashboard agent display  
- Arena entity sprites
- Inventory agent reference

```
Warrior/Fighter:  ⚔️  Crossed swords icon  — Fire Orange
Rogue/Assassin:   🗡️  Dagger icon          — Venom Green  
Mage/Caster:      ✦   Star/sparkle icon     — Ice Blue
Tank/Guardian:     🛡️  Shield icon          — Arcane Purple
```

### Rank Badges
```
#1:  👑 Crown icon — Gold
#2:  🥈 Silver medal — Silver (#9ca3af)  
#3:  🥉 Bronze medal — Bronze (#f97316)
#4+: Number only, no icon
```

### Decorative Elements
Use sparingly but effectively:
- Thin horizontal gold lines as section dividers (not `<hr>` — styled divs)
- Corner decorations on hero cards (small angular accent in gold)
- Subtle background texture: very faint noise/grain overlay on the page background (2-3% opacity)
- Floating ember particles on the landing page (CSS-only, not heavy JS)

---

## 10. RESPONSIVE CONSIDERATIONS

- Mobile-first isn't critical yet, but the game should be playable on tablets
- Arena view: minimum 800px width, show message on smaller screens
- Dashboard/Inventory: stack panels vertically on mobile
- Leaderboard: podium collapses to a vertical list on mobile, table scrolls horizontally
- Sidebar: collapses to bottom tab bar on mobile

---

## 11. CSS ARCHITECTURE

### Use CSS Variables Religiously

Every color, every font, every spacing value should come from a variable. This ensures consistency and makes theme tweaks trivial:

```css
/* In your global CSS or Tailwind config */
:root {
  /* All colors from Section 3 */
  /* All fonts from Section 4 */
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  
  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}
```

### Tailwind Integration

If using Tailwind, extend the config to include the game palette:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        arena: {
          deep: '#0a0a0f',
          dark: '#12121a',
          card: '#1a1a28',
          elevated: '#222236',
        },
        gold: {
          DEFAULT: '#f59e0b',
          bright: '#fbbf24',
          dim: '#92600a',
        },
        rarity: {
          common: '#9ca3af',
          uncommon: '#22c55e',
          rare: '#3b82f6',
          epic: '#a855f7',
          legendary: '#f97316',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

---

## 12. THE VISUAL QUALITY CHECKLIST

Before any page or component is considered done, it must pass ALL of these:

```
[ ] Does it look like a GAME page, not a web app settings panel?
[ ] Is there a clear visual hierarchy? (one dominant element per section)
[ ] Are colors MEANINGFUL? (gold = glory, red = danger, etc.)
[ ] Is the display font used for titles and big numbers?
[ ] Does the copy have flavor? (no "manage/configure/view" language)
[ ] Do cards have warm edge highlights, not plain gray borders?
[ ] Do interactive elements respond to hover?
[ ] Are rarity colors consistent with the system?
[ ] Is there enough contrast between text and background?
[ ] Would someone unfamiliar with the project say "this looks cool"?
[ ] Does it have AT LEAST one moment of visual delight? (animation, glow, shimmer)
```

---

## 13. IMPLEMENTATION ORDER FOR VISUAL RESTYLE

Apply the new visual identity in this order:

```
1. Global CSS variables + Tailwind config + font imports
   → This changes everything at once and creates the foundation

2. Leaderboard page (restyle to match old "Hall of Champions" quality)
   → This is the reference — use the old design as the target

3. Dashboard page (apply War Room treatment)
   → Agent hero card, flavor text, themed action buttons

4. Inventory page (apply Armory treatment)  
   → Rarity glows, slot styling, vault grid

5. Arena HUD (apply Depths treatment)
   → Styled bars, wave announcements, ability indicators

6. Landing page (full dramatic hero treatment)
   → This is the last because it needs the visual language fully established first

7. Navigation sidebar (gold active states, warm hover)
   → Quick pass, applies everywhere
```

Each restyle is ONE commit. Verify each page looks premium before moving to the next.

---

*This document defines what Agent Arena looks like. Follow it for every component, every page, every screen. When in doubt, ask: "Would this feel at home in Hades or Slay the Spire?" If the answer is no, redesign it until it does.*
