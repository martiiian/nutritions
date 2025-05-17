import { walk } from '@std/fs'
import { basename } from '@std/path'
import {
  getNutritionBlock,
  NutritionBlockValues,
} from './content-blocks/getNutritionBlock.ts'
import { getPriceBlock } from './content-blocks/getPriceBlock.ts'
import { getCompositionBlock } from './content-blocks/getCompositionBlock.ts'
import { getRecipeBlock } from './content-blocks/getRecipeBlock.ts'

enum Blocks {
  Nutrition = 'пищевая ценность',
  Price = 'цена',
  Composition = 'состав',
  Recipe = 'рецепт',
}

export interface ProductBlock {
  name: string
  content: string
  blocks: {
    nutrition?: NutritionBlock
    price?: PriceBlock
    ingredients?: IngredientsBlock
    recipe?: RecipeBlock
  }
}

interface NutritionBlock {
  values: NutritionBlockValues
  portionSize: number | null
  totalWeight: number | null
}

interface PriceBlock {
  prices: { date: string; price: number }[]
}

interface IngredientsBlock {
  items: { name: string; amount: string }[]
}

interface RecipeBlock {
  steps: string[]
}

/**
 * Парсит содержимое файла и извлекает структурированные блоки
 */
function parseFileContent(content: string): Omit<ProductBlock, 'name'> {
  const blocks: ProductBlock['blocks'] = {}
  let currentBlock: string | null = null
  let blockContent: string[] = []

  // Разбиваем файл на строки
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Проверяем заголовок блока
    const blockMatch = line.match(/\*\*(.*?)\*\*/)

    if (blockMatch) {
      // Если нашли новый заголовок, обрабатываем предыдущий блок
      if (currentBlock) {
        processBlock(currentBlock, blockContent, blocks)
      }

      // Начинаем новый блок
      currentBlock = blockMatch[1].toLowerCase()
      blockContent = []
    } else if (line && currentBlock) {
      // Добавляем строку к текущему блоку
      blockContent.push(line)
    }
  }

  // Обрабатываем последний блок
  if (currentBlock) {
    processBlock(currentBlock, blockContent, blocks)
  }

  return {
    content,
    blocks,
  }
}

/**
 * Обрабатывает содержимое блока и добавляет структурированные данные
 */
function processBlock(
  blockName: string,
  content: string[],
  blocks: ProductBlock['blocks'],
) {
  switch (blockName) {
    case Blocks.Nutrition: {
      blocks.nutrition = getNutritionBlock(content)
      break
    }

    case Blocks.Price: {
      blocks.price = getPriceBlock(content)
      break
    }

    case Blocks.Composition: {
      blocks.ingredients = getCompositionBlock(content)
      break
    }

    case Blocks.Recipe: {
      blocks.recipe = getRecipeBlock(content)
      break
    }
  }
}

/**
 * Рекурсивно обходит директорию и собирает все файлы
 */
export async function parseProducts(dir: string): Promise<ProductBlock[]> {
  const products: ProductBlock[] = []

  for await (const entry of walk(dir, { exts: ['.md'] })) {
    if (entry.isFile) {
      const content = await Deno.readTextFile(entry.path)
      try {
        const product = parseFileContent(content)
        const fileName = basename(entry.path).split('.')[0]
        if (fileName === '_readme') {
          continue
        }
        products.push({ ...product, name: fileName })
      } catch (e) {
        console.error(`Ошибка при обработке файла ${entry.path}:`, e)
      }
    }
  }

  return products
}
