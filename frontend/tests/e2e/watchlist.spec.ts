import { expect, test } from '@playwright/test'

const session = {
  accessToken: 'browser-token',
  tokenType: 'Bearer',
  expiresAt: '2099-01-01T00:00:00Z',
  user: { id: 12, name: 'Sam Investor', email: 'sam@example.test' },
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((storedSession) => {
    sessionStorage.setItem('smartinvest.auth.session', JSON.stringify(storedSession))
  }, session)
})

test('adds and removes a stock only after the backend confirms each operation', async ({ page }) => {
  let items: Array<{
    id: number
    stock: { symbol: string; companyName: string; exchangeCode: string; active: boolean }
    addedAt: string
  }> = []
  await page.route('**/api/v1/watchlist', async (route) => {
    const request = route.request()
    expect(request.headers().authorization).toBe('Bearer browser-token')
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items }),
      })
      return
    }
    if (request.method() === 'POST') {
      items = [
        {
          id: 1,
          stock: {
            symbol: 'AAPL',
            companyName: 'Apple Inc.',
            exchangeCode: 'NASDAQ',
            active: true,
          },
          addedAt: '2026-11-10T00:00:00Z',
        },
      ]
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(items[0]),
      })
    }
  })
  await page.route('**/api/v1/watchlist/AAPL', async (route) => {
    expect(route.request().headers().authorization).toBe('Bearer browser-token')
    items = []
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ symbol: 'AAPL', removed: true }),
    })
  })

  await page.goto('/app/watchlist')
  await expect(page.getByText('Your watchlist is ready')).toBeVisible()
  await page.getByLabel('Stock symbol').fill('AAPL')
  await page.getByRole('button', { name: 'Add stock' }).click()
  await expect(page.getByText('Apple Inc.')).toBeVisible()
  await expect(page.getByText('AAPL added to your watchlist.')).toBeVisible()

  await page.getByRole('button', { name: 'Remove AAPL' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Remove stock' }).click()
  await expect(page.getByText('AAPL removed from your watchlist.')).toBeVisible()
  await expect(page.getByText('Apple Inc.')).not.toBeVisible()
})

test('searches and paginates catalog results, then adds a canonical search result', async ({
  page,
}) => {
  await page.route('**/api/v1/stocks/search?*', async (route) => {
    const url = new URL(route.request().url())
    expect(route.request().headers().authorization).toBe('Bearer browser-token')
    const pageIndex = Number(url.searchParams.get('page'))
    const payload =
      pageIndex === 0
        ? {
            items: [
              {
                symbol: 'AAPL',
                companyName: 'Apple Inc.',
                exchangeCode: 'NASDAQ',
                active: true,
              },
            ],
            page: 0,
            size: 20,
            hasNext: true,
          }
        : { items: [], page: 1, size: 20, hasNext: false }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    })
  })
  await page.route('**/api/v1/watchlist', async (route) => {
    if (route.request().method() === 'POST') {
      const request = route.request().postDataJSON() as { symbol: string }
      expect(request.symbol).toBe('AAPL')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 4,
          stock: {
            symbol: 'AAPL',
            companyName: 'Apple Inc.',
            exchangeCode: 'NASDAQ',
            active: true,
          },
          addedAt: '2026-11-10T00:00:00Z',
        }),
      })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' })
  })

  await page.goto('/app/stocks')
  await page.getByLabel('Symbol or company name').fill('apple')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(page.getByText('Apple Inc.')).toBeVisible()
  await page.getByRole('button', { name: 'Add AAPL to watchlist' }).click()
  await expect(page.getByText('AAPL added to your watchlist.')).toBeVisible()

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('No stocks matched “apple”. Try another search.')).toBeVisible()
})
