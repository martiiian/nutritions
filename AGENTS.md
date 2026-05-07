# AGENTS.md

## Commands

```bash
# Dev (watches for changes)
deno task dev                          # today
deno task dev -- --date yesterday      # yesterday
deno task dev -- --date 05-06          # specific MM-DD

# Tests — use `deno task test` (includes -A for read/write perms)
deno task test
deno test src/products-parser/parseProduct.test.ts  # single file

# Format and lint (CI runs both)
deno fmt
deno fmt --check   # CI check
deno lint
```

Always run `deno fmt` and `deno lint` after changes — CI enforces both.

## Configuration

Paths are resolved via **required** env vars:

- `NUTRITIONS_PRODUCTS_DIR` — products directory
- `NUTRITIONS_TASKS_DIR` — day meal files directory

## Architecture

Deno CLI tool for calculating daily nutritional intake from Obsidian markdown
files.

- `src/main.ts` — entry point; `--date` flag (today / yesterday / MM-DD)
- `src/types.ts` — shared types; `ProductPropertyTypes` enum maps Russian block
  names to types
- `src/products-parser/` — parses product `.md` files, resolves ingredient-based
  nutrition recursively
- `src/day-nutrition-calculator/` — parses day meal logs, calculates totals
- `src/libs/` — shared utilities

Product `.md` files use Russian bold headings: `**пищевая ценность**`,
`**цена**`, `**состав**`, `**рецепт**`.

## Style

- No semicolons, single quotes (enforced by `deno fmt`)
- Path alias `@/` maps to `./src/`
- No comments in code unless explicitly requested
