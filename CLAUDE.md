# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Commands

```bash
# Run the program (watches for changes)
deno task dev <products-dir> <day-meal-file>

# Run all tests
deno test

# Run a single test file
deno test products-parser/nutritionsCalculator/calculateNutritionsForProductsWithIngredients.test.ts

# Format code
deno fmt
```

## Architecture

This is a Deno CLI tool that calculates daily nutritional intake from
Obsidian-style markdown files.

**Data flow:**

1. `main.ts` — entry point; takes two CLI args: a products directory and a day
   meal file
2. `parseProducts(dir)` — walks the directory for `.md` files, parses each into
   a `ProductType`, then runs `calculateNutritionsForProductsWithIngredients` to
   derive nutrition for ingredient-based recipes
3. `parseDayMeal(file)` — reads a daily food log (Obsidian
   `- [[product name]] - 100г` format) via `FoodLogParser`
4. `calculateFoodItemsNutrition(products, foodItems)` — cross-references parsed
   food items against the products map and sums nutritional values

**Product file format (Markdown):**

Each `.md` file in the products directory represents one product. Blocks are
delimited by bold headings (`**пищевая ценность**`, `**цена**`, `**состав**`,
`**рецепт**`). The `ProductPropertyTypes` enum in `types.ts` maps Russian block
names to structured types.

- **Nutrition block** (`пищевая ценность`):
  `fats/proteins/carbohydrates/calories` on line 1, optional `portionSize` on
  line 2, `totalWeight` on line 3
- **Composition block** (`состав`): lines like `- ingredient name - 100г`; used
  to derive nutrition for recipes with no direct nutrition values

**Ingredient-based nutrition resolution**
(`calculateNutritionsForProductsWithIngredients`): recursively resolves and
memoizes nutrition for products that only have ingredients (no direct nutrition
values). Detects cycles.

**Nutrition calculation:** values are per 100g base. When a food item has a unit
suffix (e.g. `г`), `portionSize` is treated as 1. Without a unit, `portionSize`
from the product definition is used as a multiplier.

**Day meal file format:** Obsidian wiki-link list —
`- [[product name]] - <quantity><unit>`. Parsed by `FoodLogParser`.

**Output format:** `fats/proteins/carbohydrates/calories` per product, then day
totals.

## Style

- No semicolons, single quotes (enforced by `deno fmt`)
- Path alias `@/` maps to repo root
