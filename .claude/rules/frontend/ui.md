# UI Rules (Radix + TailwindCSS)

## Radix Primitives

- Always accessible by default
- Keyboard navigation built-in
- Use composition pattern

## TailwindCSS v4

- Utility-first, no inline styles
- Use CSS variables for theming
- Responsive: mobile-first (`md:`, `lg:`)

```tsx
<div className="flex flex-col gap-4 p-4 md:flex-row md:p-6">
  <h1 className="text-2xl font-bold text-foreground">
    Title
  </h1>
</div>
```

## Theme Awareness (REQUIRED)

Every UI element MUST use theme-aware CSS variable classes. Never use hardcoded Tailwind palette colors.

**Base semantic vars:**
- Text: `text-foreground`, `text-muted-foreground`, `text-primary`, `text-secondary-foreground`, `text-accent-foreground`
- Backgrounds: `bg-background`, `bg-muted`, `bg-card`, `bg-accent`, `bg-popover`
- Borders: `border-border`, `border-input`

**Status semantic vars** (`--destructive` is a shadcn default; `--success`, `--warning`, `--info` are project-specific — see `shadcn-tweakcn.md` for upkeep):
- `text-destructive`, `text-success`, `text-warning`, `text-info` (+ `-foreground` variants)
- Subtle backgrounds: `bg-destructive/10`, `bg-success/10`, `bg-warning/10`, `bg-info/10`

**For status UI, prefer component variants over raw classes:**
- `<Alert variant="success">` not `<Alert className="bg-green-50 border-green-200">`
- `<Badge variant="warning">` not `<span className="bg-amber-100 text-amber-800">`

See `shadcn-tweakcn.md` for the full list of available `<Alert>` / `<Badge>` variants.

**Anti-patterns:**
- `text-gray-*`, `text-white`, `text-black`, `bg-white`, `bg-gray-*`, `text-red-500`, `bg-green-50`, etc.
- Manual dark-mode forking: `bg-white dark:bg-gray-900` — semantic vars handle both modes already
- `<pre>`, `<code>`, `<span>`, `<p>`, `<h1>`–`<h6>` without explicit `text-foreground` or `text-muted-foreground` (unless inside a themed parent)

```tsx
// Good — theme-aware
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Content</p>
  <Alert variant="success">Saved!</Alert>
</div>

// Bad — hardcoded colors + manual dark fork
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">Content</p>
  <Alert className="bg-green-50 border-green-200">Saved!</Alert>
</div>
```

## Component Variants

Use class variance authority (cva):

```tsx
import { cva } from 'class-variance-authority'

const button = cva('px-4 py-2 rounded font-medium', {
  variants: {
    intent: {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    },
    size: {
      sm: 'text-sm px-3 py-1',
      md: 'text-base px-4 py-2',
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'md',
  },
})
```

## Spacing & Layout

- Use consistent spacing scale (4, 8, 12, 16, 24, 32, 48)
- Flexbox for 1D, Grid for 2D
- Gap over margin for consistent spacing

```tsx
// Good - gap
<div className="flex gap-4">

// Avoid - individual margins
<div className="flex">
  <div className="mr-4">
```

## Accessibility

- Always include ARIA labels where needed
- Maintain focus states
- Ensure color contrast
- Test keyboard navigation
