import { ProductPropertyTypes, ProductType } from '../types.ts'
import { getNutritionBlock } from './properties/getNutritionBlock.ts'
import { getPriceBlock } from './properties/getPriceBlock.ts'
import { getCompositionBlock } from './properties/getCompositionBlock.ts'
import { getRecipeBlock } from './properties/getRecipeBlock.ts'

function parseProperty(
  { product, propertyName, propertyContent }: {
    product: ProductType
    propertyName: string | null
    propertyContent: string[]
  },
) {
  switch (propertyName) {
    case ProductPropertyTypes.Nutrition:
      product.nutrition = getNutritionBlock(propertyContent)
      break
    case ProductPropertyTypes.Price:
      product.price = getPriceBlock(propertyContent)
      break
    case ProductPropertyTypes.Composition:
      product.ingredients = getCompositionBlock(propertyContent)
      break
    case ProductPropertyTypes.Recipe:
      product.recipe = getRecipeBlock(propertyContent)
      break
  }
}

export function parseProduct(content: string): ProductType {
  const product: ProductType = {}

  let propertyName: string | null = null
  let propertyContent: string[] = []

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    const foundProperty = line.match(/\*\*(.*?)\*\*/)

    if (foundProperty) {
      parseProperty({ product, propertyContent, propertyName })
      propertyName = foundProperty[1].toLowerCase()
      propertyContent = []
    } else if (line && propertyName) {
      propertyContent.push(line)
    }
  }

  if (propertyName) {
    parseProperty({ product, propertyContent, propertyName })
  }

  return product
}