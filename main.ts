import { blue, green } from '@std/fmt/colors'
import {
  calculateFoodItemsNutrition,
  parseDayMeal,
} from './day-nutrition-calculator/index.ts'
import { SummaryProductNutrition } from './types.ts'

import { parseProducts } from './products-parser/ParseProducts.ts'

function renderMessage(
  dayResult: Omit<SummaryProductNutrition, 'name'>,
  uniqueProducts: Record<string, Omit<SummaryProductNutrition, 'name'>>,
) {
  console.log()

  Object.entries(uniqueProducts).forEach(
    ([name, { fats, calories, proteins, carbohydrates }]) => {
      console.log(
        `${fats}/${proteins}/${carbohydrates}/${calories}   `,
        green(name),
      )
    },
  )

  console.log()

  console.log(
    blue(
      `Day result: ${dayResult.fats}/${dayResult.proteins}/${dayResult.carbohydrates}/${dayResult.calories}`,
    ),
  )
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
      const { dayResult, uniqueProducts } = calculateFoodItemsNutrition(
        products,
        dayMeal,
      )
      renderMessage(dayResult, uniqueProducts)
    }
  } catch (e) {
    console.error('Произошла ошибка:', e)
  }
}

await main()
