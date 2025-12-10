import { env } from 'cloudflare:test'
import { describe, it, expect } from 'vitest'
import app from '../index'

describe('API', () => {
  it('GET / should return Hello Hono!', async () => {
    const res = await app.request('/', {}, env)

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Hello Hono!')
  })
})
