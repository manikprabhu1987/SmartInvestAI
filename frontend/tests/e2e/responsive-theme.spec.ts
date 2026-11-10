import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'smartinvest.auth.session',
      JSON.stringify({
        accessToken: 'browser-token',
        tokenType: 'Bearer',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 21, name: 'Ari Investor', email: 'ari@example.test' },
      }),
    )
  })
  await page.route('**/api/v1/watchlist', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }),
  )
})

test('keeps the UI usable at mobile, tablet, and desktop sizes and persists the theme', async ({
  page,
}) => {
  await page.goto('/app/watchlist')
  await expect(page.getByText('Your watchlist is ready')).toBeVisible()

  for (const width of [320, 768, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      )
      .toBe(true)
  }

  await page.getByRole('button', { name: 'Toggle theme' }).click()
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem('smartinvest.theme')),
    )
    .not.toBeNull()
  const savedTheme = await page.evaluate(() => localStorage.getItem('smartinvest.theme'))
  await page.getByRole('link', { name: 'Search', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Toggle theme' })).toBeVisible()
  await page.reload()
  expect(await page.evaluate(() => localStorage.getItem('smartinvest.theme'))).toBe(savedTheme)
})
