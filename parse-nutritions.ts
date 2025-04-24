import { walk } from "@std/fs";
import { basename } from "@std/path";

export interface ProductBlock {
  name: string;
  content: string;
  blocks: {
    nutrition?: NutritionBlock;
    price?: PriceBlock;
    ingredients?: IngredientsBlock;
    recipe?: RecipeBlock;
  };
}

interface NutritionBlock {
  values: NutritionBlockValues;
  portionSize: number;
  totalWeight: number | null;
}

export interface NutritionBlockValues {
  proteins: number;
  fats: number;
  carbohydrates: number;
  calories: number;
}

interface PriceBlock {
  prices: { date: string; price: number }[];
}

interface IngredientsBlock {
  items: { name: string; amount: string }[];
}

interface RecipeBlock {
  steps: string[];
}

/**
 * Парсит содержимое файла и извлекает структурированные блоки
 */
function parseFileContent(content: string): Omit<ProductBlock, 'name'> {
  const blocks: ProductBlock["blocks"] = {};
  let currentBlock: string | null = null;
  let blockContent: string[] = [];

  // Разбиваем файл на строки
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Проверяем заголовок блока
    const blockMatch = line.match(/\*\*(.*?)\*\*/);

    if (blockMatch) {
      // Если нашли новый заголовок, обрабатываем предыдущий блок
      if (currentBlock) {
        processBlock(currentBlock, blockContent, blocks);
      }

      // Начинаем новый блок
      currentBlock = blockMatch[1].toLowerCase();
      blockContent = [];
    } else if (line && currentBlock) {
      // Добавляем строку к текущему блоку
      blockContent.push(line);
    }
  }

  // Обрабатываем последний блок
  if (currentBlock) {
    processBlock(currentBlock, blockContent, blocks);
  }

  return {
    content,
    blocks
  };
}

function getNutritionValues(nutritionStr: string): NutritionBlockValues {
  const [fats, proteins, carbohydrates, calories] = nutritionStr.split('/')

  return {
    fats: Number(fats),
    proteins: Number(proteins),
    carbohydrates: Number(carbohydrates),
    calories: Number(calories),
  }
}

/**
 * Обрабатывает содержимое блока и добавляет структурированные данные
 */
function processBlock(
  blockName: string,
  content: string[],
  blocks: ProductBlock["blocks"]
) {
  switch (blockName) {
    case "пищевая ценность":
      if (content.length >= 1) {
        blocks.nutrition = {
          values: getNutritionValues(content[0]),
          portionSize: Number(content[1]),
          totalWeight: Number(content[2]) || null
        };
      }
      break;

    case "цена": {
      const prices = content
        .filter(line => line.startsWith('-'))
        .map(line => {
          const match = line.match(/- \[\[(.*?)]] (\d+)/);
          if (match) {
            return { date: match[1], price: parseInt(match[2]) };
          }
          return null;
        })
        .filter((item): item is { date: string; price: number } => item !== null);

      blocks.price = { prices };
      break;
    }

    case "состав": {
      const ingredients = content
        .filter(line => line.startsWith('-'))
        .map(line => {
          const match = line.match(/- (.*?) - (.*)/);
          if (match) {
            return { name: match[1], amount: match[2] };
          }
          return null;
        })
        .filter((item): item is { name: string; amount: string } => item !== null);

      blocks.ingredients = { items: ingredients };
      break;
    }

    case "рецепт":
      blocks.recipe = {
        steps: content.map(line => line.replace(/^\d+\)\s*/, '').trim())
      };
      break;
  }
}

/**
 * Рекурсивно обходит директорию и собирает все файлы
 */
export async function processDirectory(dir: string): Promise<ProductBlock[]> {
  const products: ProductBlock[] = [];

  for await (const entry of walk(dir, { exts: [".md"] })) {
    if (entry.isFile) {
      const content = await Deno.readTextFile(entry.path);
      try {
        const product = parseFileContent(content);
        const fileName = basename(entry.path).split('.')[0]
        if (fileName === '_readme') {
          continue
        }
        products.push({ ...product, name: fileName });
      } catch (e) {
        console.error(`Ошибка при обработке файла ${entry.path}:`, e);
      }
    }
  }

  return products;
}

