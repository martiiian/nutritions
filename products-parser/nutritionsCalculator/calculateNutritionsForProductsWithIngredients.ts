import { calculateFoodItemsNutrition } from '@/day-nutrition-calculator/index.ts'
import { FoodUnit, NutritionBlockValues, ProductsMapType } from '@/types.ts'
import { toFixedNumber } from '@/libs/toFixedNumber.ts'

function calculateTotalWeight(items: FoodUnit[], products: ProductsMapType): number {
  return items.reduce((sum, { name, quantity, unit }) => {
    if (unit) return sum + quantity

    const portionSize = products.get(name)?.nutrition?.portionSize ?? 1

    return sum + quantity * portionSize
  }, 0)
}

function resolveProductNutrition(
  productName: string,
  products: ProductsMapType,
  resolving: Set<string>,
): NutritionBlockValues | null {
  const product = products.get(productName)
  if (!product) return null

  // Базовый случай: у продукта уже есть nutrition
  if (product.nutrition) return product.nutrition.values

  // Нет ни ingredients, ни nutrition — неизвестный продукт
  if (!product.ingredients?.items) return null

  // Детекция цикла
  if (resolving.has(productName)) {
    console.warn(`Обнаружен цикл зависимостей: ${productName}`)
    return null
  }

  resolving.add(productName)

  // Рекурсивно разрешаем nutrition для каждого ингредиента
  for (const ingredient of product.ingredients.items) {
    const ingredientProduct = products.get(ingredient.name)
    if (ingredientProduct && !ingredientProduct.nutrition && ingredientProduct.ingredients?.items) {
      resolveProductNutrition(ingredient.name, products, resolving)
    }
  }

  // К этому моменту все ингредиенты должны иметь nutrition (если возможно)
  const { result: calculatedNutrition } = calculateFoodItemsNutrition(
    products,
    product.ingredients.items,
  )

  const totalWeight = calculateTotalWeight(product.ingredients.items, products)

  const normalizedValues = {
    fats: toFixedNumber(calculatedNutrition.fats / totalWeight * 100),
    proteins: toFixedNumber(calculatedNutrition.proteins / totalWeight * 100),
    carbohydrates: toFixedNumber(calculatedNutrition.carbohydrates / totalWeight * 100),
    calories: toFixedNumber(calculatedNutrition.calories / totalWeight * 100),
  }

  // Мемоизация: записываем результат в products
  product.nutrition = {
    values: normalizedValues,
    totalWeight,
    portionSize: totalWeight,
  }

  resolving.delete(productName)

  return calculatedNutrition
}

export function calculateNutritionsForProductsWithIngredients(
  products: ProductsMapType,
): ProductsMapType {
  const resolving = new Set<string>()

  for (const [productName, product] of products) {
    if (product.ingredients?.items) {
      resolveProductNutrition(productName, products, resolving)
    }
  }

  return products
}
