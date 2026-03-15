import { assertEquals } from '@std/assert'
import { parseProduct } from './parseProduct.ts'

Deno.test('parseProduct — nutrition block', () => {
  const content = `
**пищевая ценность**
5.5/10/35/200
100
400
`
  const result = parseProduct(content)

  assertEquals(result.nutrition, {
    values: { fats: 5.5, proteins: 10, carbohydrates: 35, calories: 200 },
    portionSize: 100,
    totalWeight: 400,
  })
})

Deno.test('parseProduct — nutrition without portionSize and totalWeight', () => {
  const content = `
**пищевая ценность**
2/8/20/130
`
  const result = parseProduct(content)

  assertEquals(result.nutrition?.values, {
    fats: 2,
    proteins: 8,
    carbohydrates: 20,
    calories: 130,
  })
  assertEquals(result.nutrition?.portionSize, null)
  assertEquals(result.nutrition?.totalWeight, null)
})

Deno.test('parseProduct — price block', () => {
  const content = `
**цена**
- [[2024-01-01]] 450
- [[2024-02-01]] 430
`
  const result = parseProduct(content)

  assertEquals(result.price, {
    prices: [
      { date: '2024-01-01', price: 450 },
      { date: '2024-02-01', price: 430 },
    ],
  })
})

Deno.test('parseProduct — composition block', () => {
  const content = `
**состав**
- мука - 200г
- яйцо - 2
`
  const result = parseProduct(content)

  assertEquals(result.ingredients, {
    items: [
      { name: 'мука', quantity: 200, unit: 'г' },
      { name: 'яйцо', quantity: 2, unit: null },
    ],
  })
})

Deno.test('parseProduct — recipe block', () => {
  const content = `
**рецепт**
1) Смешать ингредиенты
2) Выпекать 30 минут
`
  const result = parseProduct(content)

  assertEquals(result.recipe, {
    steps: ['Смешать ингредиенты', 'Выпекать 30 минут'],
  })
})

Deno.test('parseProduct — multiple blocks', () => {
  const content = `
**пищевая ценность**
10/20/30/300
100

**цена**
- [[2024-01-01]] 500

**состав**
- сахар - 50г
`
  const result = parseProduct(content)

  assertEquals(result.nutrition?.values, {
    fats: 10,
    proteins: 20,
    carbohydrates: 30,
    calories: 300,
  })
  assertEquals(result.price?.prices[0].price, 500)
  assertEquals(result.ingredients?.items[0].name, 'сахар')
})

Deno.test('parseProduct — empty content', () => {
  const result = parseProduct('')
  assertEquals(result, {})
})

Deno.test('parseProduct — unknown block ignored', () => {
  const content = `
**неизвестный блок**
some data

**пищевая ценность**
1/2/3/40
`
  const result = parseProduct(content)

  assertEquals(result.nutrition?.values, {
    fats: 1,
    proteins: 2,
    carbohydrates: 3,
    calories: 40,
  })
})