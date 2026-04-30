# shadcn/ui Theming & tweakcn Compatibility

For semantic-color usage rules (which classes to use, anti-patterns, "prefer component variants"), see `ui.md`. This file covers **shadcn/tweakcn-specific** concerns: color format, theme installation procedure, custom status vars upkeep, and available component variants.

## Color Format

oklch is the standard color format for shadcn/ui. All CSS vars in `:root` and `.dark` use `oklch()`. Shadows remain `hsl()`.

## Installing tweakcn Themes

```bash
pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/<name>.json
```

**After install:**
1. Check `styles.css` for new `--font-*` values in `:root` and `.dark`
2. Add Google Fonts import at top of `styles.css`:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Font+Name:wght@400;500;600;700&display=swap');
   ```
3. Verify `@theme inline` has correct font mappings:
   ```css
   --font-family-sans: var(--font-sans);
   --font-family-mono: var(--font-mono);
   --font-family-serif: var(--font-serif);
   ```
4. Restart dev server to apply changes

Manual paste alternative: replace `:root` and `.dark` color vars only. Keep `@theme inline` mappings and custom status vars intact.

## Custom Status Vars (project-specific)

`--success`, `--warning`, `--info` (+ `-foreground` variants) are project-added vars **not included in tweakcn JSONs**. After every tweakcn install:
- Adjust their oklch values to match the new palette
- tweakcn CLI merges vars — it won't delete these (they survive installs)

`--destructive` IS in tweakcn (shadcn default), no manual upkeep needed.

## Available Component Variants

- **Alert**: `default`, `destructive`, `success`, `warning`, `info`
- **Badge**: `default`, `secondary`, `destructive`, `success`, `warning`, `outline`
