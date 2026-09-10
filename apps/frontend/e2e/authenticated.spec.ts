import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

async function signedIn(page: Page, user = 'one') {
  const cookies = JSON.parse(await readFile('/tmp/heisenbug-test-cookies.json', 'utf8'))
  await page.context().addCookies([{ name: 'hb_session', value: cookies[user], domain: '127.0.0.1', path: '/' }])
}

async function api<T>(page: Page, path: string, options: RequestInit = {}): Promise<T> {
  return page.evaluate(async ({ path, options }) => {
    const response = await fetch('http://127.0.0.1:4001' + path, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } })
    return { status: response.status, body: await response.json() }
  }, { path, options }) as T
}

test('submission retry records one verified attempt and remains isolated', async ({ page, browser }) => {
  await signedIn(page)
  await page.goto('/challenges')
  await expect(page.getByText(/Signed in as @one/)).toBeVisible()
  const challenge = await api<{ status: number; body: { files: Record<string,string> } }>(page, '/api/challenges/001-off-by-one-inventory')
  const payload = { files: challenge.body.files, requestId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' }
  const first = await api<{ status:number; body:{ submissionId:string } }>(page, '/api/challenges/001-off-by-one-inventory/submit', { method:'POST', body:JSON.stringify(payload) })
  const retry = await api<{ status:number; body:{ submissionId:string } }>(page, '/api/challenges/001-off-by-one-inventory/submit', { method:'POST', body:JSON.stringify(payload) })
  expect(first.status).toBe(200)
  expect(retry.body.submissionId).toBe(first.body.submissionId)
  const progress = await api<{ body:{ challenges:Array<{ challenge_id:string; completed_attempts:number; verified:number }> } }>(page, '/api/progress')
  expect(progress.body.challenges).toContainEqual(expect.objectContaining({ challenge_id:'001-off-by-one-inventory', completed_attempts:1, verified:1 }))

  const guest = await browser.newContext()
  const guestPage = await guest.newPage()
  await guestPage.goto('/challenges')
  const isolated = await api<{ status:number }>(guestPage, '/api/progress')
  expect(isolated.status).toBe(401)
  await guest.close()
})

test('browser progress import persists for the selected account', async ({ page }) => {
  await signedIn(page, 'two')
  await page.addInitScript(() => localStorage.setItem('heisenbug:solved', JSON.stringify(['002-wrong-comparison-discount'])))
  await page.goto('/challenges')
  await expect(page.getByRole('region', { name:'Import browser progress' })).toBeVisible()
  await page.getByRole('button', { name:'Import browser progress' }).click()
  await expect(page.locator('[title="Imported browser solve"]')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('region', { name:'Import browser progress' })).toHaveCount(0)
})

test('consent gates browser events and withdrawal stops them', async ({ page }) => {
  let events = 0
  page.on('request', request => { if (request.url().endsWith('/api/analytics/events')) events++ })
  await page.goto('/challenge/003-state-mutation-cart')
  expect(events).toBe(0)
  await page.goto('/challenges')
  await page.getByRole('button', { name:'Allow analytics' }).click()
  await page.goto('/challenge/003-state-mutation-cart')
  await expect.poll(() => events).toBeGreaterThan(0)
  await page.goto('/challenges')
  await page.getByRole('button', { name:'Decline' }).click()
  const before = events
  await page.goto('/challenge/004-early-return-validator')
  await page.waitForLoadState('networkidle')
  expect(events).toBe(before)
})

test('admin and non-admin routes render distinct authorization states', async ({ page }) => {
  await signedIn(page, 'one')
  await page.goto('/admin/analytics')
  await expect(page.getByText('Forbidden.')).toBeVisible()
  await page.context().clearCookies()
  await signedIn(page, 'admin')
  await page.reload()
  await expect(page.getByRole('heading', { name:'Analytics' })).toBeVisible()
  await expect(page.getByRole('heading', { name:'Daily trends' })).toBeVisible()
})
