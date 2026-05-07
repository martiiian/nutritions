import { toFixedNumber } from '../libs/toFixedNumber.ts'
import {
  FoodUnit,
  NutritionBlockValues,
  ProductsMapType,
  SummaryProductNutrition,
} from '../types.ts'

function countNutritionValueForQuantity(
  productValue: NutritionBlockValues[keyof NutritionBlockValues],
  quantity: number,
  portionSize = 1,
) {
  return toFixedNumber(productValue / 100 * Number(quantity) * portionSize)
}

export function calculateFoodItemsNutrition(
  products: ProductsMapType,
  foodItems: FoodUnit[],
) {
  const sumProducts: SummaryProductNutrition[] = []

  foodItems.forEach(({ name, quantity, unit }) => {
    const productData = products.get(name)
    if (!productData?.nutrition) return

    const { portionSize, values } = productData.nutrition
    const { fats, proteins, carbohydrates, calories } = values

    const portion = unit ? 1 : portionSize || 1

    sumProducts.push({
      name,
      fats: countNutritionValueForQuantity(fats, quantity, portion),
      proteins: countNutritionValueForQuantity(proteins, quantity, portion),
      carbohydrates: countNutritionValueForQuantity(
        carbohydrates,
        quantity,
        portion,
      ),
      calories: countNutritionValueForQuantity(calories, quantity, portion),
    })
  })

  const uniqueProducts = sumProducts.reduce<
    Record<string, Omit<SummaryProductNutrition, 'name'>>
  >((acc, { name, fats, proteins, carbohydrates, calories }) => {
    acc[name] = {
      fats: toFixedNumber((acc[name]?.fats || 0) + fats),
      proteins: toFixedNumber((acc[name]?.proteins || 0) + proteins),
      carbohydrates: toFixedNumber(
        (acc[name]?.carbohydrates || 0) + carbohydrates,
      ),
      calories: toFixedNumber((acc[name]?.calories || 0) + calories),
    }

    return acc
  }, {})

  const result = Object.values(uniqueProducts).reduce(
    (acc, { fats, proteins, carbohydrates, calories }) => {
      return {
        fats: toFixedNumber(acc.fats + fats),
        proteins: toFixedNumber(acc.proteins + proteins),
        carbohydrates: toFixedNumber(acc.carbohydrates + carbohydrates),
        calories: toFixedNumber(acc.calories + calories),
      }
    },
    { fats: 0, proteins: 0, carbohydrates: 0, calories: 0 },
  )

  return { result, uniqueProducts }
}
