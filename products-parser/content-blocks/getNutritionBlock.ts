export interface NutritionBlockValues {
  proteins: number
  fats: number
  carbohydrates: number
  calories: number
}

function getNutritionValues(nutritionStr: string): NutritionBlockValues {
  const [fats, proteins, carbohydrates, calories] = nutritionStr.split('/')

  return {
    fats: Number(fats),
    proteins: Number(proteins),
    carbohydrates: Number(carbohydrates),
    calories: Number(calories),
  }
}

export function getNutritionBlock(content: string[]) {
  return {
    values: getNutritionValues(content[0]),
    portionSize: Number(content[1]) || null,
    totalWeight: Number(content[2]) || null,
  }
}
