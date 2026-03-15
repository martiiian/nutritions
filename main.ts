import { green, red, rgb24 } from '@std/fmt/colors'
import {
  calculateFoodItemsNutrition,
  parseDayMeal,
} from './day-nutrition-calculator/index.ts'
import { SummaryProductNutrition } from './types.ts'

import { parseProducts } from './products-parser/ParseProducts.ts'

function formatNutrition(
  { fats, proteins, carbohydrates, calories }: Omit<SummaryProductNutrition, 'name'>,
) {
  const r = (n: number) => Math.round(n)
  return `${r(fats)}/${r(proteins)}/${r(carbohydrates)} ${r(calories)} ккал`
}

function renderMessage(
  dayResult: Omit<SummaryProductNutrition, 'name'>,
  uniqueProducts: Record<string, Omit<SummaryProductNutrition, 'name'>>,
) {
  console.log()

  Object.entries(uniqueProducts).forEach(([name, nutrition]) => {
    console.log(green(name))
    console.log(formatNutrition(nutrition))
  })

  const cal = Math.round(dayResult.calories)
  const [colorFn, emoji] = cal <= 2000
    ? [green, '😊']
    : cal <= 2500
    ? [red, '😬']
    : [(s: string) => rgb24(s, 0x8B0000), '😡']

  console.log('─'.repeat(40))
  console.log(colorFn(`Итого ${emoji}`))
  console.log(colorFn(formatNutrition(dayResult)))
}

async function main() {
  if (Deno.args.length < 1) {
    console.error(
      'Использование: deno run --allow-read --allow-write file_parser.ts <директория продуктов> <файл для рассчета>',
    )
    Deno.exit(1)
  }

  const productsDir = Deno.args[0]
  const dayMealFileName = Deno.args[1]

  console.log(`Обрабатываем директорию: ${productsDir}`)

  try {
    const products = await parseProducts(productsDir)
    // eslint-disable-next-line no-console
    console.log(`Найдено файлов: ${products.size}`)
    console.log('Обработка завершена успешно!')
    const dayMeal = await parseDayMeal(dayMealFileName)
    if (dayMeal) {
      const { result, uniqueProducts } = calculateFoodItemsNutrition(
        products,
        dayMeal,
      )
      renderMessage(result, uniqueProducts)
    }
  } catch (e) {
    console.error('Произошла ошибка:', e)
  }
}

await main()
