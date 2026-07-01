import { describe, it, expect } from 'vitest'
import { parseModelResponse } from './llm'

describe('parseModelResponse', () => {
  it('parses clean JSON', () => {
    const tasks = parseModelResponse('{"tasks":[{"title":"A","deadline":null,"priority":"low","category":null}]}')
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('A')
  })

  it('strips ```json markdown fences', () => {
    const raw = '```json\n{"tasks":[{"title":"B","deadline":"2026-01-01","priority":"high","category":"muncă"}]}\n```'
    const tasks = parseModelResponse(raw)
    expect(tasks[0].priority).toBe('high')
  })

  it('extracts JSON when the model adds prose around it', () => {
    const raw = 'Sigur! Iată task-urile:\n{"tasks":[{"title":"C","deadline":null,"priority":"medium","category":null}]}\nSper că ajută.'
    const tasks = parseModelResponse(raw)
    expect(tasks[0].title).toBe('C')
  })

  it('returns an empty array for {"tasks":[]}', () => {
    expect(parseModelResponse('{"tasks":[]}')).toEqual([])
  })

  it('throws when there is no JSON object at all', () => {
    expect(() => parseModelResponse('Nu am găsit niciun task.')).toThrow()
  })

  it('throws on malformed JSON', () => {
    expect(() => parseModelResponse('{"tasks":[{"title":}}')).toThrow()
  })

  it('normalizes a bad deadline coming from the model to null', () => {
    const tasks = parseModelResponse('{"tasks":[{"title":"D","deadline":"cândva","priority":"low","category":null}]}')
    expect(tasks[0].deadline).toBeNull()
  })
})
