# @atlas/ui

Shared React components and design tokens (shadcn/ui).

## Responsibilities

- shadcn/ui primitives (Button, Input, Dialog, etc.)
- Design tokens and global CSS variables
- Reusable layout and feedback components

## Public API

- `@atlas/ui` — component barrel export
- `@atlas/ui/styles/globals.css` — CSS variables (Phase 7)

## Dependencies

- `@atlas/utils` — `cn()` helper
- Radix UI primitives (added Phase 7)

## Does NOT belong here

- Page-level layouts (use `apps/web`)
- Data fetching or business logic
- Feature-specific composite components (build in app or domain packages)
