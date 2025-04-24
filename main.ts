// Основная функция
import {NutritionBlockValues, processDirectory, ProductBlock} from "./parse-nutritions.ts";
import {FoodUnit, parseDayMeal} from "./parse-day-meal.ts";

function countNutritionValueForQuantity(productValue: NutritionBlockValues[keyof NutritionBlockValues], quantity: number, portionSize = 1) {
  return Math.round(productValue / 100 * Number(quantity) * portionSize);
}

type SummaryProductNutrition = {
  name: string;
} & NutritionBlockValues


function countDayNutrition(products: ProductBlock[], dayMeal: FoodUnit[]) {
  const sumProducts: SummaryProductNutrition[] = [];

  dayMeal.forEach(({ name: productName, quantity, unit }) => {
    const productData = products.find((product) => productName === product.name);
    if (productData?.blocks.nutrition) {
      const { portionSize, values } = productData.blocks.nutrition;
      const {fats, proteins, carbohydrates, calories} = values
      
      const portion = unit ? 1 : portionSize || 1;
      
      sumProducts.push({
        name: productName,
        fats: countNutritionValueForQuantity(fats, quantity, portion),
        proteins: countNutritionValueForQuantity(proteins, quantity, portion),
        carbohydrates: countNutritionValueForQuantity(carbohydrates, quantity, portion),
        calories: countNutritionValueForQuantity(calories, quantity, portion),
      })
    }
  })

  const uniqueProducts = sumProducts.reduce<Record<string, Omit<SummaryProductNutrition, 'name'>>>((acc, { name, fats, proteins, carbohydrates, calories}) => {
    acc[name] = {
      fats: (acc[name]?.fats || 0) + fats,
      proteins: (acc[name]?.proteins || 0) + proteins,
      carbohydrates: (acc[name]?.carbohydrates || 0) + carbohydrates,
      calories: (acc[name]?.calories || 0) + calories
    }

    return acc
  }, {});

  const result = Object.values(uniqueProducts).reduce((acc, { fats, proteins, carbohydrates, calories }) => {
    return {
      fats: acc.fats + fats,
      proteins: acc.proteins + proteins,
      carbohydrates: acc.carbohydrates + carbohydrates,
      calories: acc.calories + calories
    }
  }, { fats: 0, proteins: 0, carbohydrates: 0, calories: 0 });

  // eslint-disable-next-line no-console
  console.log(result)

  return result
}

async function main() {
  if (Deno.args.length < 1) {
    console.error("Использование: deno run --allow-read --allow-write file_parser.ts <директория продуктов> <файл для рассчета>");
    Deno.exit(1);
  }

  const productsDir = Deno.args[0];
  const dayMealFileName = Deno.args[1]
  // const outputFile = Deno.args[1] || "all_products.txt";

  console.log(`Обрабатываем директорию: ${productsDir}`);
  // console.log(`Результат будет сохранен в: ${outputFile}`);

  try {
    const products = await processDirectory(productsDir);
    const dayMeal = await parseDayMeal(dayMealFileName);
    if (dayMeal) {
      countDayNutrition(products, dayMeal)
    }
    console.log(`Найдено файлов: ${products.length}`);
    // eslint-disable-next-line no-console
    console.log("Обработка завершена успешно!");
  } catch (e) {
    console.error("Произошла ошибка:", e);
  }
}

await main();
