import { expect, test } from '@playwright/test'

test('health endpoint returns ok', async ({ request }) => {
  const response = await request.get('/health')
  expect(response.ok()).toBeTruthy()
  await expect(response.json()).resolves.toEqual({ status: 'ok' })
})
