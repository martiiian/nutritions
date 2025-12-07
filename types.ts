export enum ProductPropertyTypes {
  Nutrition = 'пищевая ценность',
  Price = 'цена',
  Composition = 'состав',
  Recipe = 'рецепт',
}

export interface NutritionBlockValues {
  proteins: number
  fats: number
  carbohydrates: number
  calories: number
}

export interface ProductNutritionType {
  values: NutritionBlockValues
  portionSize: number | null
  totalWeight: number | null
}

export interface ProductPriceType {
  prices: { date: string; price: number }[]
}

export interface ProductIngredientsType {
  items: {
    name: string
    quantity: number
    unit: string | null
  }[]
}

export interface ProductRecipeType {
  steps: string[]
}

export interface ProductType {
  nutrition: ProductNutritionType | null
  price: ProductPriceType | null
  ingredients: ProductIngredientsType | null
  recipe: ProductRecipeType | null
}

export type ProductsType = Map<string, ProductType>

export type SummaryProductNutrition = {
  name: string
} & NutritionBlockValues

export type FoodUnit = {
  name: string
  quantity: number
  unit: string | null
}
