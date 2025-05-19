// parse_products_test.ts
import {
  assertEquals,
  assertExists,
} from 'jsr:@std/assert'
import { parseProducts } from './ParseProducts.ts'

Deno.test('parseProducts', async () => {
  // Setup: Create temporary test files
  const tempDir = await Deno.makeTempDir()

  await Deno.writeTextFile(
    `${tempDir}/product1.md`,
    `**пищевая ценность**
5/10/30/203
100

**цена**
- [[2023-01-01]] 100
- [[2023-02-01]] 120

**состав**
- Мука - 200г
- Сахар - 100г

**рецепт**
- Смешать ингредиенты
- Выпекать 30 минут
  `,
  )

  try {
    const products = await parseProducts(tempDir)

    // Test general structure
    assertEquals(products.length, 1)
    assertEquals(products[0].name, 'product1')
    assertExists(products[0].blocks)
    
    // Test nutrition block
    const nutrition = products[0].blocks.nutrition
    assertExists(nutrition)
    assertEquals(nutrition.portionSize, 100)
    assertEquals(nutrition.values.proteins, 10)
    assertEquals(nutrition.values.fats, 5)
    assertEquals(nutrition.values.carbohydrates, 30)
    assertEquals(nutrition.values.calories, 203)

    // Test price block
    const price = products[0].blocks.price
    assertExists(price)
    assertEquals(price.prices.length, 2)
    assertEquals(price.prices[0], { date: '2023-01-01', price: 100 })
    assertEquals(price.prices[1], { date: '2023-02-01', price: 120 })

    // Test ingredients block
    const ingredients = products[0].blocks.ingredients
    assertExists(ingredients)
    assertEquals(ingredients.items.length, 2)
    assertEquals(ingredients.items[0], { name: 'Мука', amount: '200г' })
    assertEquals(ingredients.items[1], { name: 'Сахар', amount: '100г' })

    // Test recipe block
    const recipe = products[0].blocks.recipe
    assertExists(recipe)
    assertEquals(recipe.steps.length, 2)
    assertEquals(recipe.steps[0], '- Смешать ингредиенты')
    assertEquals(recipe.steps[1], '- Выпекать 30 минут')
  } finally {
    // Cleanup
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test('parseProducts handles empty directory', async () => {
  const tempDir = await Deno.makeTempDir()

  try {
    const products = await parseProducts(tempDir)
    assertEquals(products.length, 0)
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test('parseProducts ignores _readme.md', async () => {
  const tempDir = await Deno.makeTempDir()

  await Deno.writeTextFile(`${tempDir}/_readme.md`, 'Some content')

  try {
    const products = await parseProducts(tempDir)
    assertEquals(products.length, 0)
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test('parseProducts handles invalid content', async () => {
  const tempDir = await Deno.makeTempDir()

  await Deno.writeTextFile(`${tempDir}/invalid.md`, 'Invalid content')

  try {
    const products = await parseProducts(tempDir)
    assertEquals(products.length, 1)
    assertEquals(products[0].name, 'invalid')
    assertEquals(Object.keys(products[0].blocks).length, 0)
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test('parseProducts handles missing blocks', async () => {
  const tempDir = await Deno.makeTempDir()

  await Deno.writeTextFile(
    `${tempDir}/partial.md`,
    `**пищевая ценность**
5/10/30/203
100
  `,
  )

  try {
    const products = await parseProducts(tempDir)
    assertEquals(products.length, 1)
    assertExists(products[0].blocks.nutrition)
    assertEquals(products[0].blocks.price, undefined)
    assertEquals(products[0].blocks.ingredients, undefined)
    assertEquals(products[0].blocks.recipe, undefined)
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})
