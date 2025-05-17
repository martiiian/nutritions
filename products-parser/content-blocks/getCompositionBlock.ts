export function getCompositionBlock(content: string[]) {
  const items = content
    .filter((line) => line.startsWith('-'))
    .map((line) => {
      const match = line.match(/- (.*?) - (.*)/)
      return match ? { name: match[1], amount: match[2] } : null
    })
    .filter((item): item is { name: string; amount: string } => item !== null)

  return { items }
}
