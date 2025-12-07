export function getRecipeBlock(content: string[]) {
  return {
    steps: content.map((line) => line.replace(/^\d+\)\s*/, '').trim()),
  }
}
