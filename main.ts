import { blue, green } from '@std/fmt/colors'

// Основная функция
import { parseProducts, ProductBlock } from './products-parser/ParseProducts.ts'
import { FoodLogParser, FoodUnit } from './FoodLogParser.ts'
import { NutritionBlockValues } from './products-parser/content-blocks/getNutritionBlock.ts'

function countNutritionValueForQuantity(
  productValue: NutritionBlockValues[keyof NutritionBlockValues],
  quantity: number,
  portionSize = 1,
) {
  return Math.round(productValue / 100 * Number(quantity) * portionSize)
}

type SummaryProductNutrition = {
  name: string
} & NutritionBlockValues

async function parseDayMeal(pathToFile: string) {
  try {
    const text = await Deno.readTextFile(pathToFile)

    const parser = new FoodLogParser()
    return parser.parse(text)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error:', error.message)
    } else {
      console.error('Unknown error:', String(error))
    }
  }
}

function countDayNutrition(products: ProductBlock[], dayMeal: FoodUnit[]) {
  const sumProducts: SummaryProductNutrition[] = []

  dayMeal.forEach(({ name: productName, quantity, unit }) => {
    const productData = products.find((product) => productName === product.name)
    if (productData?.blocks.nutrition) {
      const { portionSize, values } = productData.blocks.nutrition
      const { fats, proteins, carbohydrates, calories } = values

      const portion = unit ? 1 : portionSize || 1

      sumProducts.push({
        name: productName,
        fats: countNutritionValueForQuantity(fats, quantity, portion),
        proteins: countNutritionValueForQuantity(proteins, quantity, portion),
        carbohydrates: countNutritionValueForQuantity(
          carbohydrates,
          quantity,
          portion,
        ),
        calories: countNutritionValueForQuantity(calories, quantity, portion),
      })
    }
  })

  const uniqueProducts = sumProducts.reduce<
    Record<string, Omit<SummaryProductNutrition, 'name'>>
  >((acc, { name, fats, proteins, carbohydrates, calories }) => {
    acc[name] = {
      fats: (acc[name]?.fats || 0) + fats,
      proteins: (acc[name]?.proteins || 0) + proteins,
      carbohydrates: (acc[name]?.carbohydrates || 0) + carbohydrates,
      calories: (acc[name]?.calories || 0) + calories,
    }

    return acc
  }, {})

  const dayResult = Object.values(uniqueProducts).reduce(
    (acc, { fats, proteins, carbohydrates, calories }) => {
      return {
        fats: acc.fats + fats,
        proteins: acc.proteins + proteins,
        carbohydrates: acc.carbohydrates + carbohydrates,
        calories: acc.calories + calories,
      }
    },
    { fats: 0, proteins: 0, carbohydrates: 0, calories: 0 },
  )

  return { dayResult, uniqueProducts }
}

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
      `Day result: ${`${dayResult.fats}/${dayResult.proteins}/${dayResult.carbohydrates}/${dayResult.calories}`}`,
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
    console.log(`Найдено файлов: ${products.length}`)
    console.log('Обработка завершена успешно!')
    const dayMeal = await parseDayMeal(dayMealFileName)
    if (dayMeal) {
      const { dayResult, uniqueProducts } = countDayNutrition(
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
