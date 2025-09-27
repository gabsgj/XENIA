// @ts-nocheck
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('/tasks page', () => {
  test('renders header and new task button', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`)
    await expect(page.getByRole('heading', { name: 'Tasks & Sessions' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'New Task' })).toBeVisible()
  })
})
