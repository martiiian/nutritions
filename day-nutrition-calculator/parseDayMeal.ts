import { FoodLogParser } from '../FoodLogParser.ts'

export async function parseDayMeal(pathToFile: string) {
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
