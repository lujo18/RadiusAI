# Coding Standards

> Enforced on every edit. Violations must be fixed before committing.

---

## Line Limits

| Unit | Limit | Action when exceeded |
|---|---|---|
| Function / method | 30 lines | Split into helpers |
| React component (JSX) | 150 lines | Extract sub-components |
| Hook (`use*.ts`) | 80 lines | Split or move logic to `surface/` |
| Service / utility file | 200 lines | Split by responsibility |
| Route handler | 40 lines | Move logic to service layer |
| Pydantic model file | 150 lines | Split by domain |
| Test file | 300 lines | Split by feature group |

> Lines = non-blank, non-comment lines of logic. Comments and whitespace don't count.

---

## Functions

- **Max 30 lines** of logic per function
- **Single responsibility** — one reason to change
- **Cyclomatic complexity ≤ 8** — max 8 branches/conditions
- **Max 3 parameters** — use an object/typed dict for more
- **No side effects in pure functions** — label impure functions clearly
- **Early returns** over nested conditionals

```ts
// ✅ Good
function buildSlidePrompt(config: StyleConfig): string {
  const base = formatBasePrompt(config.theme);
  const rules = formatRules(config.forbidden, config.emojiRules);
  return `${base}\n${rules}`;
}

// ❌ Bad — too many responsibilities, too many params
function buildAndValidateAndSendPrompt(theme, forbidden, emoji, slideCount, userId, retry) {
  // 60 lines of mixed concerns
}
```

---

## Components

- **Max 150 lines** per component file
- One component per file (sub-components can live in the same file if < 30 lines each)
- Extract when a JSX block exceeds **20 lines** or is reused
- Props interfaces defined at top of file, not inline
- No business logic in components — delegate to hooks

```tsx
// ✅ Good — thin component
export function SlideCard({ slide }: SlideCardProps) {
  const { isSelected, onSelect } = useSlideSelection(slide.id);
  return <Card onClick={onSelect} data-selected={isSelected}>...</Card>;
}

// ❌ Bad — logic in component
export function SlideCard({ slide }) {
  const [selected, setSelected] = useState(false);
  const handleClick = async () => {
    await api.post('/slides/select', { id: slide.id });
    setSelected(true);
    // ... 20 more lines
  };
}
```

---

## Files & Modules

- **One responsibility per file** — if you can't describe it in 5 words, split it
- **Max 200 lines** per utility/service file
- **Max 80 lines** per hook
- Group related files in a folder with an `index.ts` barrel export
- No barrel exports that re-export more than **10 symbols** (causes bundle bloat)
- No cross-layer imports: `hooks/` → `surface/` only, never `hooks/` → `services/` directly

### Folder naming
```
feature/
  components/         # UI only
  hooks/              # TanStack Query hooks
  types.ts            # local types
  index.ts            # public API of the feature
```

---

## Naming

| Thing | Convention | Example |
|---|---|---|
| React component | PascalCase | `SlideEditor` |
| Hook | camelCase + `use` prefix | `useSlideSelection` |
| Service function | camelCase verb-noun | `fetchTemplateById` |
| Zustand store | camelCase + `Store` suffix | `dashboardStore` |
| Type / Interface | PascalCase | `SlideDesign` |
| Constants | SCREAMING_SNAKE | `MAX_SLIDE_COUNT` |
| Backend route file | snake_case | `template_routes.py` |
| Backend service | snake_case + `_service` | `supabase_service.py` |

---

## TypeScript / Python

### TypeScript
- No `any` — use `unknown` + type guard if needed
- Zod schemas required at all `services/` input boundaries
- Explicit return types on all exported functions
- Prefer `type` over `interface` for data shapes; `interface` for extendable contracts

### Python
- Type hints on all function signatures
- Pydantic models for all request/response shapes
- No raw `dict` returns from service functions — return typed models
- Max 30 lines per function (same rule)

---

## Imports

- **Frontend**: `@/` absolute paths only (no `../../`)
- **Backend**: relative imports within a package, absolute from project root
- No circular imports — use dynamic `import()` in `client.ts` if needed
- Group order: stdlib → third-party → internal (enforced by linter)

---

## Comments

- No comments that restate the code (`// increment i by 1` → delete)
- Use comments only for **why**, never **what**
- JSDoc on all exported functions with non-obvious signatures
- TODO format: `// TODO(yourname): description — ticket #123`

---

## Tests

- Unit test all `services/` orchestration logic
- Test file mirrors source path: `src/lib/api/services/foo.ts` → `src/lib/api/services/foo.test.ts`
- Max 3 assertions per test case
- Test names: `it('does X when Y')` format