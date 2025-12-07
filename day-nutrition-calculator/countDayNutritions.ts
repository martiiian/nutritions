import {
  FoodUnit,
  NutritionBlockValues,
  ProductsType,
  SummaryProductNutrition,
} from '../types.ts'

function countNutritionValueForQuantity(
  productValue: NutritionBlockValues[keyof NutritionBlockValues],
  quantity: number,
  portionSize = 1,
) {
  return Math.round(productValue / 100 * Number(quantity) * portionSize)
}

export function calculateFoodItemsNutrition(
  products: ProductsType,
  dayMeal: FoodUnit[],
) {
  const sumProducts: SummaryProductNutrition[] = []

  dayMeal.forEach(({ name: productName, quantity, unit }) => {
    const productData = products.get(productName)
    if (productData?.nutrition) {
      const { portionSize, values } = productData.nutrition
      const { fats, proteins, carbohydrates, calories } = values

      const portion = unit ? 1 : portionSize || 1

      sumProducts.push({
        name: productName,
        fats: countNutritionValueForQuantity(fats, quantity, portion),
        proteins: countNutritionValueForQuantity(proteins, quantity, portion),
        carbohydrates: countNutritionValueForQuantity(
          carbohydrates,
          quantity,
          portion,
        ),
        calories: countNutritionValueForQuantity(calories, quantity, portion),
      })
    }
  })

  const uniqueProducts = sumProducts.reduce<
    Record<string, Omit<SummaryProductNutrition, 'name'>>
  >((acc, { name, fats, proteins, carbohydrates, calories }) => {
    acc[name] = {
      fats: (acc[name]?.fats || 0) + fats,
      proteins: (acc[name]?.proteins || 0) + proteins,
      carbohydrates: (acc[name]?.carbohydrates || 0) + carbohydrates,
      calories: (acc[name]?.calories || 0) + calories,
    }

    return acc
  }, {})

  const dayResult = Object.values(uniqueProducts).reduce(
    (acc, { fats, proteins, carbohydrates, calories }) => {
      return {
        fats: acc.fats + fats,
        proteins: acc.proteins + proteins,
        carbohydrates: acc.carbohydrates + carbohydrates,
        calories: acc.calories + calories,
      }
    },
    { fats: 0, proteins: 0, carbohydrates: 0, calories: 0 },
  )

  return { dayResult, uniqueProducts }
}
