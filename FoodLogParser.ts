export type FoodUnit = {
  name: string
  quantity: number
  unit: string | null
}

const FOOD_ROW_REGEX = /- \[\[(.+?)]]( - (.+))?$/
const UNIT_REGEX = /^(\d+(?:\.\d+)?)(\D+)?$/

/**
 * Парсер дневника питания
 */
class FoodLogParser {
  private foodLog: FoodUnit[] = []

  /**
   * Парсит строку с продуктом и добавляет ее в лог питания
   *
   * @param line Строка с продуктом
   */
  private parseFoodLine(line: string): void {
    // Проверяем, что строка содержит информацию о продукте
    if (!line.trim().startsWith('- [[')) return

    // Парсим название и количество
    const match = line.match(FOOD_ROW_REGEX)

    if (match) {
      const foodName = match[1]
      const quantityStr = match[3]?.trim() || '1'

      // Разделяем количество и единицу измерения
      const unitMatch = quantityStr.match(UNIT_REGEX)

      let quantity: number
      let unit: string | null = null

      if (unitMatch) {
        quantity = parseFloat(unitMatch[1])
        unit = unitMatch[2] ? unitMatch[2].trim() : null
      } else {
        // Если не удалось разделить, используем значение как есть
        quantity = Number(quantityStr)
      }

      // Добавляем в лог питания
      this.foodLog.push({ quantity, unit, name: foodName })
    }
  }

  /**
   * Парсит текст дневника питания
   *
   * @param text Текст дневника питания
   * @returns Объект с информацией о продуктах
   */
  parse(text: string): FoodUnit[] {
    this.foodLog = []

    const lines = text.split('\n')
    for (const line of lines) {
      if (line.trim().toLowerCase() === '**итого:**') continue

      this.parseFoodLine(line)
    }

    return this.foodLog
  }
}

export { FoodLogParser }
