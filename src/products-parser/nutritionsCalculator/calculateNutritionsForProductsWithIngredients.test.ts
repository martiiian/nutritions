import { assertEquals } from '@std/assert'
import type { ProductsMapType } from '@/types.ts'
import {
  calculateNutritionsForProductsWithIngredients,
} from './calculateNutritionsForProductsWithIngredients.ts'

export const mockProducts: ProductsMapType = new Map([
  [
    'product_001',
    {
      ingredients: {
        items: [
          { name: 'product_006', quantity: 100, unit: 'г' },
          { name: 'product_005', quantity: 100, unit: 'г' },
        ],
      },
    },
  ],
  [
    'product_005',
    {
      nutrition: {
        values: {
          proteins: 10,
          fats: 18.2,
          carbohydrates: 35.3,
          calories: 345,
        },
        portionSize: 400,
        totalWeight: 400,
      },
      price: {
        prices: [
          { date: '2024-01-05', price: 450 },
          { date: '2024-02-01', price: 430 },
          { date: '2024-02-15', price: 460 },
        ],
      },
    },
  ],
  [
    'product_006',
    {
      nutrition: {
        values: {
          proteins: 5.5,
          fats: 2.1,
          carbohydrates: 12.3,
          calories: 85,
        },
        portionSize: 300,
        totalWeight: null,
      },
    },
  ],
])

Deno.test('calculateNutritionsForProducts', () => {
  const products = new Map(mockProducts)
  const result = calculateNutritionsForProductsWithIngredients(products)

  assertEquals(result?.get('product_001')?.nutrition?.values, {
    fats: 10.15,
    proteins: 7.75,
    carbohydrates: 23.8,
    calories: 215,
  })
})

Deno.test('calculateNutritionsForProducts — nested recipes', () => {
  const products: ProductsMapType = new Map([
    [
      'product_leaf',
      {
        nutrition: {
          values: { proteins: 5, fats: 3, carbohydrates: 10, calories: 80 },
          portionSize: 100,
          totalWeight: null,
        },
      },
    ],
    [
      'product_leaf_2',
      {
        nutrition: {
          values: { proteins: 8, fats: 4, carbohydrates: 20, calories: 150 },
          portionSize: 100,
          totalWeight: null,
        },
      },
    ],
    [
      'product_leaf_3',
      {
        nutrition: {
          values: { proteins: 12, fats: 6, carbohydrates: 30, calories: 200 },
          portionSize: 100,
          totalWeight: null,
        },
      },
    ],
    [
      'recipe_B',
      {
        ingredients: {
          items: [
            { name: 'product_leaf_2', quantity: 100, unit: 'г' },
            { name: 'product_leaf_3', quantity: 100, unit: 'г' },
          ],
        },
      },
    ],
    [
      'recipe_A',
      {
        ingredients: {
          items: [
            { name: 'recipe_B', quantity: 100, unit: 'г' },
            { name: 'product_leaf', quantity: 100, unit: 'г' },
          ],
        },
      },
    ],
  ])

  calculateNutritionsForProductsWithIngredients(products)

  assertEquals(products.get('recipe_B')?.nutrition?.values, {
    proteins: 10,
    fats: 5,
    carbohydrates: 25,
    calories: 175,
  })

  assertEquals(products.get('recipe_A')?.nutrition?.values, {
    proteins: 7.5,
    fats: 4,
    carbohydrates: 17.5,
    calories: 127.5,
  })
})
