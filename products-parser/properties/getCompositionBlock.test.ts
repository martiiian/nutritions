import { assertEquals } from '@std/assert'
import { getCompositionBlock } from './getCompositionBlock.ts'

Deno.test('с unit', () => {
  assertEquals(getCompositionBlock(['- мука - 200г']), {
    items: [{ name: 'мука', quantity: 200, unit: 'г' }],
  })
})

Deno.test('без unit', () => {
  assertEquals(getCompositionBlock(['- яйцо - 2']), {
    items: [{ name: 'яйцо', quantity: 2, unit: null }],
  })
})

Deno.test('дробное количество', () => {
  assertEquals(getCompositionBlock(['- масло - 0.5ч.л.']), {
    items: [{ name: 'масло', quantity: 0.5, unit: 'ч.л.' }],
  })
})

Deno.test('несколько ингредиентов', () => {
  assertEquals(
    getCompositionBlock(['- мука - 200г', '- сахар - 100г', '- яйцо - 3']),
    {
      items: [
        { name: 'мука', quantity: 200, unit: 'г' },
        { name: 'сахар', quantity: 100, unit: 'г' },
        { name: 'яйцо', quantity: 3, unit: null },
      ],
    },
  )
})

Deno.test('строки без дефиса игнорируются', () => {
  assertEquals(getCompositionBlock(['заголовок', '- мука - 100г', '']), {
    items: [{ name: 'мука', quantity: 100, unit: 'г' }],
  })
})

Deno.test('название из нескольких слов', () => {
  assertEquals(getCompositionBlock(['- оливковое масло - 50мл']), {
    items: [{ name: 'оливковое масло', quantity: 50, unit: 'мл' }],
  })
})

Deno.test('без количества — defaults to 1', () => {
  assertEquals(getCompositionBlock(['- мука']), {
    items: [{ name: 'мука', quantity: 1, unit: null }],
  })
})

Deno.test('wiki-link с unit', () => {
  assertEquals(getCompositionBlock(['- [[масло]] - 50г']), {
    items: [{ name: 'масло', quantity: 50, unit: 'г' }],
  })
})

Deno.test('wiki-link без unit', () => {
  assertEquals(getCompositionBlock(['- [[яйцо]] - 2']), {
    items: [{ name: 'яйцо', quantity: 2, unit: null }],
  })
})

Deno.test('wiki-link без количества — defaults to 1', () => {
  assertEquals(getCompositionBlock(['- [[мука]]']), {
    items: [{ name: 'мука', quantity: 1, unit: null }],
  })
})

Deno.test('пустой массив', () => {
  assertEquals(getCompositionBlock([]), { items: [] })
})