import { ProductIngredientsType } from '../../types.ts'

const UNIT_REGEX = /^(\d+(?:\.\d+)?)(\D+)?$/

function parseUnit(
  quantityStr: string,
): { quantity: number; unit: string | null } {
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

  return { quantity, unit }
}

export function getCompositionBlock(content: string[]): ProductIngredientsType {
  const items = content
    .filter((line) => line.startsWith('-'))
    .map((line) => {
      const match = line.match(/- \[?\[?(.*?)\]?\]? - (.*)/)
      if (match) return { name: match[1], ...parseUnit(match[2]) }
      const nameOnly = line.match(/^- \[?\[?(.+?)\]?\]?$/)
      return nameOnly ? { name: nameOnly[1], quantity: 1, unit: null } : null
    })
    .filter((item): item is ProductIngredientsType['items'][number] =>
      item !== null
    )

  return { items }
}
