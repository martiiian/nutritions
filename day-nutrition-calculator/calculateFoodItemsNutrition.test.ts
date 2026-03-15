import { assertEquals } from '@std/assert'
import type { ProductsMapType } from '../types.ts'
import { calculateFoodItemsNutrition } from './calculateFoodItemsNutrition.ts'

const products: ProductsMapType = new Map([
  [
    'гречка',
    {
      nutrition: {
        values: {
          fats: 3.3,
          proteins: 12.6,
          carbohydrates: 62.1,
          calories: 313,
        },
        portionSize: null,
        totalWeight: null,
      },
    },
  ],
  [
    'молоко',
    {
      nutrition: {
        values: { fats: 3.2, proteins: 2.8, carbohydrates: 4.7, calories: 58 },
        portionSize: null,
        totalWeight: null,
      },
    },
  ],
  [
    'масло',
    {
      nutrition: {
        values: {
          fats: 82.5,
          proteins: 0.5,
          carbohydrates: 0.8,
          calories: 748,
        },
        portionSize: 10,
        totalWeight: null,
      },
    },
  ],
])

Deno.test('базовый расчёт для одного продукта', () => {
  const { result, uniqueProducts } = calculateFoodItemsNutrition(products, [
    { name: 'гречка', quantity: 100, unit: 'г' },
  ])

  assertEquals(uniqueProducts['гречка'], {
    fats: 3.3,
    proteins: 12.6,
    carbohydrates: 62.1,
    calories: 313,
  })
  assertEquals(result, {
    fats: 3.3,
    proteins: 12.6,
    carbohydrates: 62.1,
    calories: 313,
  })
})

Deno.test('расчёт для нескольких разных продуктов', () => {
  const { result } = calculateFoodItemsNutrition(products, [
    { name: 'гречка', quantity: 100, unit: 'г' },
    { name: 'молоко', quantity: 200, unit: 'мл' },
  ])

  assertEquals(result, {
    fats: 9.7,
    proteins: 18.2,
    carbohydrates: 71.5,
    calories: 429,
  })
})

Deno.test('один продукт встречается несколько раз — суммируется в uniqueProducts', () => {
  const { uniqueProducts, result } = calculateFoodItemsNutrition(products, [
    { name: 'гречка', quantity: 100, unit: 'г' },
    { name: 'гречка', quantity: 50, unit: 'г' },
  ])

  assertEquals(uniqueProducts['гречка'], {
    fats: 4.95,
    proteins: 18.9,
    carbohydrates: 93.15,
    calories: 469.5,
  })
  assertEquals(result, uniqueProducts['гречка'])
})

Deno.test('без unit — portionSize используется как множитель', () => {
  // масло: portionSize=10, quantity=2 (2 порции по 10г)
  // fats = 82.5 / 100 * 2 * 10 = 16.5
  const { uniqueProducts } = calculateFoodItemsNutrition(products, [
    { name: 'масло', quantity: 2, unit: null },
  ])

  assertEquals(uniqueProducts['масло'].fats, 16.5)
  assertEquals(uniqueProducts['масло'].calories, 149.6)
})

Deno.test('с unit — portionSize игнорируется', () => {
  // масло: quantity=20г, unit='г' → portion=1
  // fats = 82.5 / 100 * 20 * 1 = 16.5
  const { uniqueProducts } = calculateFoodItemsNutrition(products, [
    { name: 'масло', quantity: 20, unit: 'г' },
  ])

  assertEquals(uniqueProducts['масло'].fats, 16.5)
})

Deno.test('продукт не найден в products — пропускается', () => {
  const { result, uniqueProducts } = calculateFoodItemsNutrition(products, [
    { name: 'несуществующий', quantity: 100, unit: 'г' },
  ])

  assertEquals(Object.keys(uniqueProducts).length, 0)
  assertEquals(result, { fats: 0, proteins: 0, carbohydrates: 0, calories: 0 })
})

Deno.test('пустой список foodItems', () => {
  const { result, uniqueProducts } = calculateFoodItemsNutrition(products, [])

  assertEquals(uniqueProducts, {})
  assertEquals(result, { fats: 0, proteins: 0, carbohydrates: 0, calories: 0 })
})
