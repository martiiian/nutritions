import { walk } from '@std/fs'
import { basename } from '@std/path'
import { calculateFoodItemsNutrition } from '../day-nutrition-calculator/index.ts'
import { ProductPropertyTypes, ProductsType, ProductType } from '../types.ts'
import { getNutritionBlock } from './properties/getNutritionBlock.ts'
import { getPriceBlock } from './properties/getPriceBlock.ts'
import { getCompositionBlock } from './properties/getCompositionBlock.ts'
import { getRecipeBlock } from './properties/getRecipeBlock.ts'

const IGNORED_FILE_NAMES = ['_readme']
const FILE_EXTENSIONS = ['.md']

type OutputProduct = Omit<ProductType, 'name' | 'content'>

/**
 * Парсит содержимое файла и извлекает структурированные блоки
 */
function parseProduct(content: string): OutputProduct {
  const product = {
    nutrition: null,
    price: null,
    recipe: null,
    ingredients: null,
  }

  let propertyName: string | null = null
  let propertyContent: string[] = []

  // Разбиваем файл на строки
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Проверяем заголовок блока
    const foundProperty = line.match(/\*\*(.*?)\*\*/)

    if (foundProperty) {
      // Если нашли новый заголовок, обрабатываем предыдущий собранный блок
      parseProperty({ product, propertyContent, propertyName })

      // Начинаем новый блок
      propertyName = foundProperty[1].toLowerCase()
      propertyContent = []
    } else if (line && propertyName) {
      // Добавляем строку к текущему блоку
      propertyContent.push(line)
    }
  }

  if (propertyName) {
    parseProperty({ product, propertyContent, propertyName })
  }

  return product
}

function parseProperty(
  { product, propertyName, propertyContent }: {
    product: OutputProduct
    propertyName: string | null
    propertyContent: string[]
  },
) {
  if (propertyName === ProductPropertyTypes.Nutrition) {
    product.nutrition = getNutritionBlock(propertyContent)
  }
  if (propertyName === ProductPropertyTypes.Price) {
    product.price = getPriceBlock(propertyContent)
  }
  if (propertyName === ProductPropertyTypes.Composition) {
    product.ingredients = getCompositionBlock(propertyContent)
  }
  if (propertyName === ProductPropertyTypes.Recipe) {
    product.recipe = getRecipeBlock(propertyContent)
  }
}

function calculateNutritionsForProductsWithIngredients(
  products: ProductsType,
  productsWithIngredients: Set<string>,
) {
  productsWithIngredients.forEach((productName) => {
    const productWithIngredients = products.get(productName)
    if (!productWithIngredients?.ingredients?.items) {
      return
    }

    const { dayResult } = calculateFoodItemsNutrition(
      products,
      productWithIngredients?.ingredients?.items,
    )

    productWithIngredients.nutrition = {
      values: dayResult,
      portionSize: productWithIngredients.nutrition?.portionSize || null,
      totalWeight: productWithIngredients.nutrition?.totalWeight || null,
    }

    // productWithIngredients.ingredients.items.reduce(({ amount, name }) => {
    //   const ingredient = products.get(name)
    //   if (!ingredient?.nutrition && ingredient?.ingredients?.items) {
    //     // todo go to recurse
    //   }
    //
    //   if (ingredient?.nutrition && !ingredient?.ingredients) {
    //   }
    // })
  })
}

/**
 * Рекурсивно обходит директорию и собирает все файлы
 */
export async function parseProducts(dir: string): Promise<ProductsType> {
  const products = new Map()
  const productsWithIngredients = new Set<string>()

  for await (const entry of walk(dir, { exts: FILE_EXTENSIONS })) {
    if (entry.isFile) {
      const content = await Deno.readTextFile(entry.path)
      try {
        const product = parseProduct(content)
        const fileName = basename(entry.path).split('.')[0]
        if (IGNORED_FILE_NAMES.includes(fileName)) {
          continue
        }

        if (product.ingredients) {
          productsWithIngredients.add(fileName)
        }

        products.set(fileName, product)
      } catch (e) {
        console.error(`Ошибка при обработке файла ${entry.path}:`, e)
      }
    }
  }

  if (productsWithIngredients.size) {
    calculateNutritionsForProductsWithIngredients(
      products,
      productsWithIngredients,
    )
  }

  return products
}
