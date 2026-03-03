# CLAUDE.md

## Styling

- Always use shadcn CSS variables and Tailwind CSS for styling.
- Reference colors via CSS variables (e.g., `bg-background`, `text-foreground`, `border-border`) instead of raw color values.
- Follow the shadcn/ui theming conventions defined in `src/styles/global.css`.

## Components

- Always use shadcn/ui components from `@/components/ui/` instead of raw HTML elements.
- Use `Button` (with appropriate `variant`) instead of `<button>`.
- Use `Input` instead of `<input>`.
- Use the shadcn DatePicker pattern (Popover + Calendar) instead of `<input type="date">`.
- Install missing shadcn components via `npx shadcn@latest add <component>` before using them.
