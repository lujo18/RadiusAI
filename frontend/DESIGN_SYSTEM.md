# Radius Design System - Single Source of Truth

## 🎨 Color System (CSS Variables)

All colors are defined once in `src/app/globals.css` as CSS variables, then referenced everywhere:

### Brand Colors
```css
--obsidian: 220 5% 4%          /* #0B0B0C - Primary background */
--kinetic-mint: 160 84% 39%    /* #10B981 - Primary actions */
--electric-violet: 258 90% 66% /* #8B5CF6 - Secondary accent */
--ghost-white: 210 40% 98%     /* #F8FAFC - Primary text */
```

### Semantic Tokens (Shadcn)
```css
--background: var(--obsidian)        /* Page background */
--foreground: var(--ghost-white)     /* Primary text */
--primary: var(--kinetic-mint)       /* CTAs, focus states */
--secondary: var(--electric-violet)  /* Secondary actions */
--muted: 220 5% 15%                  /* Disabled/subtle */
--border: 210 5% 15%                 /* Borders */
--card: 220 5% 6%                    /* Card backgrounds */
```

## 📐 Usage Patterns

### 1. Shadcn Components (Recommended)
```tsx
import { Button } from '@/components/ui/button'

// Uses --primary automatically
<Button variant="default">Primary Action</Button>

// Uses --secondary
<Button variant="secondary">Secondary</Button>

// Custom with Tailwind
<Button className="bg-electric-violet">Purple CTA</Button>
```

### 2. Tailwind Classes (Legacy Support)
```tsx
// All reference the same CSS variables
<div className="bg-obsidian text-ghost-white">
<div className="bg-background text-foreground">  {/* Same result */}
<div className="border-kinetic-mint">
<div className="border-primary">  {/* Same result */}
```

### 3. Custom Component Classes
```tsx
// Pre-built components in tailwind.config.ts
<button className="btn-primary">Uses CSS variables</button>
<div className="glass-card">Glassmorphism</div>
<div className="dark-card">Solid card</div>
```

## 🎯 Spacing & Sizing

### Border Radius (Single Values)
```css
--radius: 0.625rem  /* 10px base */
```

**Usage:**
- `rounded-lg` → `var(--radius)` (10px)
- `rounded-md` → `calc(var(--radius) - 2px)` (8px)
- `rounded-sm` → `calc(var(--radius) - 4px)` (6px)
- `rounded-button` → `10px` (legacy alias)
- `rounded-card` → `16px` (larger containers)

### Standard Spacing Scale
Use Tailwind's default: `p-4` (1rem), `m-6` (1.5rem), `gap-8` (2rem), etc.

## 🔄 Migration Guide

### Old Approach (Hardcoded)
```tsx
<div className="bg-[#0B0B0C] text-[#F8FAFC]">
  <button className="bg-[#10B981] hover:bg-[#0ea570]">
```

### New Approach (CSS Variables)
```tsx
<div className="bg-background text-foreground">
  <Button variant="default">  {/* Uses --primary */}
```

**Benefits:**
- ✅ Change colors once, updates everywhere
- ✅ Theme switching support
- ✅ Consistent with shadcn components
- ✅ Better maintainability

## 🛠️ Extending the System

### Add New Semantic Token
1. **Define in globals.css:**
```css
:root {
  --success: 142 76% 36%;  /* Green variant */
}
```

2. **Register in tailwind.config.ts:**
```ts
colors: {
  success: 'hsl(var(--success))',
}
```

3. **Use anywhere:**
```tsx
<div className="bg-success text-white">Success!</div>
```

### Add New Component Style
In tailwind.config.ts plugins:
```ts
'.btn-success': {
  '@apply bg-success hover:bg-success/80 text-white': {},
}
```

## 📦 Shadcn Component Installation

```bash
# Add new components with your design system
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add select
```

All will automatically use your CSS variables!

## 🎨 Custom vs Shadcn Components

| Use Case | Approach |
|----------|----------|
| Standard buttons | `<Button variant="default">` |
| Forms | Shadcn Input/Select components |
| Unique glassmorphism | `className="glass-card"` |
| Brand-specific designs | Custom Tailwind classes |
| Complex layouts | Mix both approaches |

## 🔍 Quick Reference

**Change brand colors:** Edit CSS variables in `globals.css` once
**Add component variant:** Update `tailwind.config.ts` plugins
**Use existing styles:** Reference semantic tokens (`bg-background`, `text-primary`)
**Need custom design:** Use Tailwind utilities + CSS variables

---

**Single Source of Truth:** All colors, spacing, and tokens live in `globals.css` CSS variables. Everything else references them.
