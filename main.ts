import { green, red, rgb24 } from '@std/fmt/colors'
import { Table } from '@cliffy/table'
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
  const r = (n: number) => Math.round(n)

  const rows = Object.entries(uniqueProducts).map(([name, nutrition]) => [
    green(name),
    r(nutrition.fats).toString(),
    r(nutrition.proteins).toString(),
    r(nutrition.carbohydrates).toString(),
    r(nutrition.calories).toString(),
  ])

  const cal = Math.round(dayResult.calories)
  const [colorFn, emoji] = cal <= 2000
    ? [green, '😊']
    : cal <= 2500
    ? [red, '😬']
    : [(s: string) => rgb24(s, 0x8B0000), '😡']

  rows.push([
    colorFn(`Итого ${emoji}`),
    colorFn(r(dayResult.fats).toString()),
    colorFn(r(dayResult.proteins).toString()),
    colorFn(r(dayResult.carbohydrates).toString()),
    colorFn(r(dayResult.calories).toString()),
  ])

  console.log()
  new Table()
    .header(['Продукт', 'Жиры', 'Белки', 'Углеводы', 'Калории'])
    .body(rows)
    .render()
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
