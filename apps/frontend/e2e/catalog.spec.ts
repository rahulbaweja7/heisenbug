import { test, expect } from '@playwright/test'

test('guest can filter the catalog, open a challenge, and retain its draft', async ({ page }) => {
  await page.goto('/challenges')
  await expect(page).toHaveTitle(/Heisenbug/i)
  await expect(page.getByRole('heading', { name: 'Challenges' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Search challenges by title' }).fill('Inventory Count')
  await expect(page.getByText('1 challenge')).toBeVisible()
  await page.getByRole('link', { name: 'Inventory Count Off-By-One' }).click()
  await expect(page).toHaveURL(/challenge\/001-off-by-one-inventory/)
  await expect(page.getByText('Inventory Count Off-By-One')).toBeVisible()
  await page.evaluate(() => {
    const key = 'heisenbug:draft:001-off-by-one-inventory'
    const draft = JSON.parse(localStorage.getItem(key) || '{}')
    draft['src/inventory.py'] += '\n# retained draft marker\n'
    localStorage.setItem(key, JSON.stringify(draft))
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('heisenbug:draft:001-off-by-one-inventory'))).toContain('retained draft marker')
})
