import { assertEquals, assertExists } from '@std/assert'
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
    const product = products.get('product1')

    // Test general structure
    assertEquals(products.size, 1)
    assertExists(product)

    // Test nutrition block
    const nutrition = product.nutrition
    assertExists(nutrition)
    assertEquals(nutrition.portionSize, 100)
    assertEquals(nutrition.values.proteins, 10)
    assertEquals(nutrition.values.fats, 5)
    assertEquals(nutrition.values.carbohydrates, 30)
    assertEquals(nutrition.values.calories, 203)

    // Test price block
    const price = product.price
    assertExists(price)
    assertEquals(price.prices.length, 2)
    assertEquals(price.prices[0], { date: '2023-01-01', price: 100 })
    assertEquals(price.prices[1], { date: '2023-02-01', price: 120 })

    // Test ingredients block
    const ingredients = product.ingredients
    assertExists(ingredients)
    assertEquals(ingredients.items.length, 2)
    assertEquals(ingredients.items[0], {
      name: 'Мука',
      quantity: 200,
      unit: 'г',
    })
    assertEquals(ingredients.items[1], {
      name: 'Сахар',
      quantity: 100,
      unit: 'г',
    })

    // Test recipe block
    const recipe = product.recipe
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
    assertEquals(products.size, 0)
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test('parseProducts ignores _readme.md', async () => {
  const tempDir = await Deno.makeTempDir()

  await Deno.writeTextFile(`${tempDir}/_readme.md`, 'Some content')

  try {
    const products = await parseProducts(tempDir)
    assertEquals(products.size, 0)
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
    const product = products.get('partial')

    assertEquals(products.size, 1)
    // assertExists(products[0].nutrition, null)
    assertEquals(product?.price, null)
    assertEquals(product?.ingredients, null)
    assertEquals(product?.recipe, null)
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})
