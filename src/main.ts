import { green, red, rgb24 } from '@std/fmt/colors'

const VERSION = '1.0.0'
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

function resolveDate(dateArg?: string): string {
  if (!dateArg) {
    return new Date().toISOString().slice(0, 10)
  }

  if (dateArg === 'yesterday') {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  }

  const mmdd = /^(\d{2})-(\d{2})$/
  const match = mmdd.exec(dateArg)
  if (match) {
    const year = new Date().getFullYear()
    return `${year}-${match[1]}-${match[2]}`
  }

  console.error(
    "Неверный формат даты. Используйте 'yesterday' или 'MM-DD'",
  )
  Deno.exit(1)
}

function printHelp() {
  console.log(`nutritions v${VERSION} — подсчёт дневного КБЖУ

ИСПОЛЬЗОВАНИЕ:
  nutritions [ОПЦИИ]

ОПЦИИ:
  --date <дата>      Дата для расчёта (по умолчанию: сегодня)
                     today       — сегодня
                     yesterday   — вчера
                     MM-DD       — конкретный день (например 05-06)
  --version, -v      Показать версию
  --help, -h         Показать эту справку

ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ:
  NUTRITIONS_PRODUCTS_DIR  Директория с .md файлами продуктов (обязательно)
  NUTRITIONS_TASKS_DIR     Директория с дневными логами приёма пищи (обязательно)

ПРИМЕРЫ:
  nutritions                        # сегодня
  nutritions --date yesterday       # вчера
  nutritions --date 05-06           # 6 мая текущего года`)
}

function parseArgs(
  args: string[],
): { date: string; showVersion: boolean; showHelp: boolean } {
  let dateArg: string | undefined
  let showVersion = false
  let showHelp = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date' && i + 1 < args.length) {
      dateArg = args[i + 1]
      i++
    } else if (args[i] === '--version' || args[i] === '-v') {
      showVersion = true
    } else if (args[i] === '--help' || args[i] === '-h') {
      showHelp = true
    }
  }

  return { date: resolveDate(dateArg), showVersion, showHelp }
}

async function main() {
  const { date, showVersion, showHelp } = parseArgs(Deno.args)

  if (showVersion) {
    console.log(`nutritions v${VERSION}`)
    Deno.exit(0)
  }

  if (showHelp) {
    printHelp()
    Deno.exit(0)
  }

  const productsDir = Deno.env.get('NUTRITIONS_PRODUCTS_DIR')
  const tasksDir = Deno.env.get('NUTRITIONS_TASKS_DIR')

  if (!productsDir) {
    console.error(
      'NUTRITIONS_PRODUCTS_DIR не задана. Установите переменную окружения.',
    )
    Deno.exit(1)
  }
  if (!tasksDir) {
    console.error(
      'NUTRITIONS_TASKS_DIR не задана. Установите переменную окружения.',
    )
    Deno.exit(1)
  }

  const dayMealFileName = `${tasksDir}${date}.md`

  console.log(`Обрабатываем директорию: ${productsDir}`)

  try {
    const products = await parseProducts(productsDir)
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
