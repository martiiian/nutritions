import { NutritionBlockValues, ProductType } from '../../types.ts'

function getNutritionValues(nutritionStr: string): NutritionBlockValues {
  const [fats, proteins, carbohydrates, calories] = nutritionStr.split('/')

  return {
    fats: Number(fats),
    proteins: Number(proteins),
    carbohydrates: Number(carbohydrates),
    calories: Number(calories),
  }
}

export function getNutritionBlock(content: string[]): ProductType['nutrition'] {
  const portionSize = Number(content[1]) || null
  return {
    values: getNutritionValues(content[0]),
    portionSize,
    totalWeight: Number(content[2]) || portionSize,
  }
}
