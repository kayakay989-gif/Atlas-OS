import { test, expect } from '@playwright/test'

test.describe('Auth shell', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('signup page renders', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
  })
})
