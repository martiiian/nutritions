import { walk } from '@std/fs'
import { basename } from '@std/path'
import { ProductsMapType, ProductType } from '../types.ts'
import { calculateNutritionsForProductsWithIngredients } from './nutritionsCalculator/calculateNutritionsForProductsWithIngredients.ts'
import { parseProduct } from './parseProduct.ts'

const IGNORED_FILE_NAMES = ['_readme']
const FILE_EXTENSIONS = ['.md']

async function readAndParseProduct(filePath: string): Promise<{ product: ProductType; fileName: string } | undefined> {
  const content = await Deno.readTextFile(filePath)
  try {
    const fileName = basename(filePath).split('.')[0]
    if (IGNORED_FILE_NAMES.includes(fileName)) {
      return
    }

    const product = parseProduct(content)

    return { product, fileName }
  } catch (e) {
    console.error(`Ошибка при обработке файла ${filePath}:`, e)
  }
}

/**
 * Рекурсивно обходит директорию и собирает все файлы
 */
export async function parseProducts(dir: string): Promise<ProductsMapType> {
  const products = new Map()

  for await (const entry of walk(dir, { exts: FILE_EXTENSIONS })) {
    if (!entry.isFile) continue

    const parseResult = await readAndParseProduct(entry.path)
    if (!parseResult) continue

    products.set(parseResult.fileName, parseResult.product)
  }

  calculateNutritionsForProductsWithIngredients(products)

  return products
}
