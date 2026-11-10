import { expect, test } from '@playwright/test'

test('registers, signs in, opens a protected page, then revokes and clears the session', async ({
  page,
}) => {
  await page.route('**/api/v1/auth/register', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 8, name: 'Taylor Investor', email: 'taylor@example.test' }),
    }),
  )
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'browser-token',
        tokenType: 'Bearer',
        expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 8, name: 'Taylor Investor', email: 'taylor@example.test' },
      }),
    }),
  )
  await page.route('**/api/v1/watchlist', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      })
    }
    return route.continue()
  })
  await page.route('**/api/v1/auth/logout', async (route) => {
    expect(route.request().headers().authorization).toBe('Bearer browser-token')
    await route.fulfill({ status: 204 })
  })

  await page.goto('/register')
  await page.getByLabel('Full name').fill('Taylor Investor')
  await page.getByLabel('Email').fill('taylor@example.test')
  await page.getByLabel('Password').fill('a-secure-password')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByText('Account created. Sign in to continue.')).toBeVisible()

  await page.getByLabel('Email').fill('taylor@example.test')
  await page.getByLabel('Password').fill('a-secure-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/app\/watchlist$/)
  await expect(page.getByText('Your watchlist is ready')).toBeVisible()
  expect(
    await page.evaluate(() => sessionStorage.getItem('smartinvest.auth.session')),
  ).toContain('browser-token')

  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => sessionStorage.getItem('smartinvest.auth.session'))).toBeNull()
})

test('returns a safe error for invalid credentials without opening protected content', async ({
  page,
}) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/problem+json',
      body: JSON.stringify({
        type: 'about:blank',
        title: 'Unauthorized',
        status: 401,
        detail: 'Email or password is incorrect.',
        code: 'INVALID_CREDENTIALS',
      }),
    }),
  )
  await page.goto('/login')
  await page.getByLabel('Email').fill('taylor@example.test')
  await page.getByLabel('Password').fill('incorrect-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.')
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0)
})
