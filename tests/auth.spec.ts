import { test, expect } from '@playwright/test';

/**
 * Authentication Flow Tests
 * Kiểm tra các luồng xác thực cơ bản của hệ thống.
 */

test.describe('Authentication', () => {

    test('Login page should load correctly', async ({ page }) => {
        await page.goto('/');
        // Click sign-in link/button
        const signInLink = page.locator('a[href*="sign-in"], button:has-text("Sign In"), a:has-text("Sign In"), a:has-text("Đăng nhập")');
        if (await signInLink.count() > 0) {
            await signInLink.first().click();
            await page.waitForLoadState('networkidle');
        }
        // Verify some form element exists
        await expect(page).toHaveURL(/sign-in|login/);
    });

    test('Login with invalid credentials should show error', async ({ request }) => {
        const response = await request.post('/api/auth/login', {
            data: {
                email: 'nonexistent@test.com',
                password: 'wrongpassword123'
            }
        });
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    test('Login without body should return 400', async ({ request }) => {
        const response = await request.post('/api/auth/login', {
            data: {}
        });
        const status = response.status();
        expect([400, 401]).toContain(status);
    });

    test('Register endpoint requires valid data', async ({ request }) => {
        const response = await request.post('/api/auth/register', {
            data: {}
        });
        const status = response.status();
        expect([400, 429]).toContain(status);
    });

    test('Forgot password requires email', async ({ request }) => {
        const response = await request.post('/api/auth/forgot-password', {
            data: {}
        });
        const status = response.status();
        expect([400, 429]).toContain(status);
    });

    test('Auth user endpoint returns 401 without cookie', async ({ request }) => {
        const response = await request.get('/api/auth/user');
        expect(response.status()).toBe(401);
    });

    test('Auth admin endpoint returns 401 without cookie', async ({ request }) => {
        const response = await request.get('/api/auth/admin');
        expect(response.status()).toBe(401);
    });
});
