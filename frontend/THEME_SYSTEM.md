# Theme System Documentation

## Overview
Radius uses a unified theme system with **Zustand** as the single source of truth for light/dark mode preferences. The theme is stored in localStorage and synced across the entire application.

## Architecture

### 1. Theme Store (`src/store/themeStore.ts`)
- **State**: `theme: 'light' | 'dark'`
- **Actions**:
  - `setTheme(theme)` - Set theme explicitly
  - `toggleTheme()` - Toggle between light and dark
- **Persistence**: Uses `zustand/persist` to save to localStorage (`radius-theme-storage`)
- **Side Effects**: Automatically updates `document.documentElement.classList` when theme changes

### 2. Theme Provider (`src/components/ThemeProvider.tsx`)
- Client-side component that wraps the app
- Listens to theme changes from Zustand store
- Applies theme class to `<html>` element: `<html class="dark">` or `<html class="light">`
- Handles initial theme application on mount

### 3. CSS Variables (`src/app/globals.css`)
- **Root (`:root`)**: Default dark mode variables
- **`.dark`**: Dark mode specific overrides
- **`.light`**: Light mode specific values
- Uses Tailwind's class-based theming approach
- All shadcn components automatically respect theme changes

## Usage

### Reading Current Theme
```typescript
import { useThemeStore } from '@/store';

function MyComponent() {
  const theme = useThemeStore((state) => state.theme);
  
  return <div>Current theme: {theme}</div>;
}
```

### Changing Theme
```typescript
import { useThemeStore } from '@/store';

function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  
  return (
    <div>
      {/* Toggle between light/dark */}
      <button onClick={toggleTheme}>
        Toggle Theme (Current: {theme})
      </button>
      
      {/* Set specific theme */}
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
    </div>
  );
}
```

### Settings Page Integration
The theme toggle is integrated into [dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx) under the **Account** tab → **Appearance** section.

Users can choose between:
- 🌞 **Light** - Bright and clear
- 🌙 **Dark** - Easy on the eyes (default)

## CSS Variable Structure

### Dark Mode (Default)
```css
--background: var(--obsidian);      /* #0B0B0C */
--foreground: var(--ghost-white);   /* #F8FAFC */
--primary: var(--kinetic-mint);     /* #10B981 */
--secondary: var(--electric-violet); /* #8B5CF6 */
```

### Light Mode
```css
--background: 0 0% 100%;            /* Pure white */
--foreground: 220 5% 10%;           /* Near-black text */
--primary: var(--kinetic-mint);     /* Same accent */
--secondary: var(--electric-violet); /* Same accent */
```

## Components Affected
All components using Tailwind's semantic classes automatically adapt:
- `bg-background` - Background color
- `text-foreground` - Text color
- `bg-card` - Card backgrounds
- `border-border` - Border colors
- `bg-primary` - Primary action buttons
- shadcn UI components (Button, Sidebar, Input, etc.)

## Benefits
✅ **Single Source of Truth**: Zustand store manages all theme state  
✅ **Persistent**: Theme choice saved to localStorage  
✅ **Type-Safe**: TypeScript ensures `'light' | 'dark'` only  
✅ **Automatic**: All shadcn and Tailwind classes update instantly  
✅ **Centralized**: Change theme from anywhere in the app  
✅ **No Flicker**: `suppressHydrationWarning` on `<html>` prevents flash  

## File Structure
```
src/
├── store/
│   ├── themeStore.ts          # Theme Zustand store
│   └── index.ts               # Export useThemeStore
├── components/
│   └── ThemeProvider.tsx      # Theme sync component
├── app/
│   ├── layout.tsx             # Root layout with ThemeProvider
│   ├── globals.css            # CSS variables for .light/.dark
│   └── dashboard/
│       └── settings/
│           └── page.tsx       # Theme toggle UI
```

## Future Enhancements
- [ ] System theme detection (`window.matchMedia('(prefers-color-scheme: dark)')`)
- [ ] Multiple theme presets (Ocean, Sunset, Forest, etc.)
- [ ] Per-user theme saved to Supabase database
- [ ] Smooth theme transition animations

---

**Default Theme**: Dark Mode  
**Toggle Location**: Dashboard → Settings → Account → Appearance  
**Storage Key**: `radius-theme-storage`
