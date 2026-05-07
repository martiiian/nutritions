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

Deno.test('parseProducts — рецепт считает nutrition из ингредиентов', async () => {
  const tempDir = await Deno.makeTempDir()

  await Deno.writeTextFile(
    `${tempDir}/мука.md`,
    `**пищевая ценность**
10/3/70/340
100
`,
  )

  await Deno.writeTextFile(
    `${tempDir}/яйцо.md`,
    `**пищевая ценность**
11/13/1/157
100
`,
  )

  await Deno.writeTextFile(
    `${tempDir}/блины.md`,
    `**состав**
- мука - 200г
- яйцо - 100г
`,
  )

  try {
    const products = await parseProducts(tempDir)
    const pancakes = products.get('блины')

    assertExists(pancakes?.nutrition)
    // мука 200г: fats=20, proteins=6, carbs=140, cal=680
    // яйцо 100г: fats=11, proteins=13, carbs=1,  cal=157
    // total 300г → normalized to per 100г
    assertEquals(pancakes.nutrition.values, {
      fats: 10.33,
      proteins: 6.33,
      carbohydrates: 47,
      calories: 279,
    })
    assertEquals(pancakes.nutrition.totalWeight, 300)
    assertEquals(pancakes.nutrition.portionSize, 300)
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test('parseProducts — ингредиент без единицы измерения использует portionSize', async () => {
  const tempDir = await Deno.makeTempDir()

  // яйцо: portionSize=60 (одно яйцо ~60г)
  await Deno.writeTextFile(
    `${tempDir}/яйцо.md`,
    `**пищевая ценность**
11/13/1/157
60
`,
  )

  await Deno.writeTextFile(
    `${tempDir}/омлет.md`,
    `**состав**
- яйцо - 3
`,
  )

  try {
    const products = await parseProducts(tempDir)
    const omelette = products.get('омлет')

    assertExists(omelette?.nutrition)
    // 3 яйца по 60г = 180г итого → normalized to per 100г
    // fats = 19.8/180*100 = 11
    // proteins = 23.4/180*100 = 13
    assertEquals(omelette.nutrition.values.fats, 11)
    assertEquals(omelette.nutrition.values.proteins, 13)
    assertEquals(omelette.nutrition.totalWeight, 180)
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})

Deno.test('parseProducts — ингредиент без количества считается как 1 порция', async () => {
  const tempDir = await Deno.makeTempDir()

  await Deno.writeTextFile(
    `${tempDir}/лист салата.md`,
    `**пищевая ценность**
0.2/1.3/2.1/15
20
`,
  )

  await Deno.writeTextFile(
    `${tempDir}/салат.md`,
    `**состав**
- лист салата
`,
  )

  try {
    const products = await parseProducts(tempDir)
    const salad = products.get('салат')

    assertExists(salad?.nutrition)
    // 1 порция (portionSize=20г) → normalized to per 100г
    // fats = 0.04/20*100 = 0.2
    // calories = 3/20*100 = 15
    assertEquals(salad.nutrition.values.fats, 0.2)
    assertEquals(salad.nutrition.values.calories, 15)
    assertEquals(salad.nutrition.totalWeight, 20)
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
    assertEquals(product?.price, undefined)
    assertEquals(product?.ingredients, undefined)
    assertEquals(product?.recipe, undefined)
  } finally {
    await Deno.remove(tempDir, { recursive: true })
  }
})
