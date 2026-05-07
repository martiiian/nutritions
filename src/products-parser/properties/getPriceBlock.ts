export function getPriceBlock(content: string[]) {
  const prices = content
    .filter((line) => line.startsWith('-'))
    .map((line) => {
      const match = line.match(/- \[\[(.*?)]] (\d+)/)
      if (match) {
        return { date: match[1], price: parseInt(match[2]) }
      }
      return null
    })
    .filter((item): item is { date: string; price: number } => item !== null)

  return { prices }
}
