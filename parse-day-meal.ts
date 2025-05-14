// food-log-parser.ts
// Программа для парсинга дневника питания на Deno + TypeScript

// Определяем типы данных
export type FoodUnit = {
  name: string;
  quantity: number;
  unit: string | null;
};

/**
 * Парсер дневника питания
 */
class FoodLogParser {
  private foodLog: FoodUnit[] = [];
  private totalSection: string[] = [];

  /**
   * Парсит строку с продуктом и добавляет ее в лог питания
   * @param line Строка с продуктом
   */
  private parseFoodLine(line: string): void {
    // Проверяем, что строка содержит информацию о продукте
    if (!line.trim().startsWith('- [[')) return;

    // Парсим название и количество
    const foodRegex = /- \[\[(.+?)]]( - (.+))?$/
    const match = line.match(foodRegex);

    if (match) {
      const foodName = match[1];
      const quantityStr = match[3]?.trim() || '1';

      // Разделяем количество и единицу измерения
      const unitRegex = /^(\d+(?:\.\d+)?)(\D+)?$/;
      const unitMatch = quantityStr.match(unitRegex);

      let quantity: number;
      let unit: string | null = null;

      if (unitMatch) {
        quantity = parseFloat(unitMatch[1]);
        unit = unitMatch[2] ? unitMatch[2].trim() : null;
      } else {
        // Если не удалось разделить, используем значение как есть
        quantity = Number(quantityStr);
      }

      // Добавляем в лог питания
      this.foodLog.push({ quantity, unit, name: foodName });
    }
  }

  /**
   * Парсит текст дневника питания
   * @param text Текст дневника питания
   * @returns Объект с информацией о продуктах
   */
  parse(text: string): FoodUnit[] {
    this.foodLog = [];
    this.totalSection = [];

    const lines = text.split('\n');
    let inTotalSection = false;

    for (const line of lines) {
      if (inTotalSection) {
        this.totalSection.push(line);
      } else if (line.trim().toLowerCase() === '**итого:**') {
        inTotalSection = true;
      } else {
        this.parseFoodLine(line);
      }
    }

    return this.foodLog;
  }

  /**
   * Добавляет новую запись в раздел "итого"
   * @param originalText
   * @param newText Текст для добавления
   * @returns Обновленный текст дневника питания
   */
  addToTotal(originalText: string, newText: string): string {
    const lines = originalText.split('\n');
    const totalIndex = lines.findIndex(line => line.trim().toLowerCase() === '**итого:**');

    if (totalIndex !== -1) {
      // Добавляем новую строку после строки с "итого:"
      lines.splice(totalIndex + 1, 0, newText);
    }

    return lines.join('\n');
  }

  /**
   * Получает текущие данные о продуктах
   * @returns Объект с информацией о продуктах
   */
  getFoodLog(): FoodUnit[] {
    return this.foodLog;
  }

  /**
   * Получает секцию "итого"
   * @returns Массив строк из секции "итого"
   */
  getTotalSection(): string[] {
    return this.totalSection;
  }
}

// Пример использования
export async function parseDayMeal(pathToFile: string) {
  try {
    // Чтение файла (для примера, можно заменить на другой источник данных)
    const text = await Deno.readTextFile(pathToFile);

    const parser = new FoodLogParser();
    const foodLog = parser.parse(text);

    // console.log("Parsed Food Log:");
    // console.log(JSON.stringify(foodLog, null, 2));

    // Пример добавления записи к итого
    // const updatedText = parser.addToTotal(text, "Калории: 2500");
    // await Deno.writeTextFile("updated_food_diary.txt", updatedText);

    // console.log("Updated diary with new total entry!");

    return foodLog;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Unknown error:", String(error));
    }
  }
}

// Раскомментируйте для запуска примера
// if (import.meta.main) {
//   main();
// }

export { FoodLogParser };
