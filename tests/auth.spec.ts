import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const testEmail = `testuser_${randomSuffix}@example.com`;
    const testPassword = 'Password123!';

    test('User can register a new account', async ({ page }) => {
        await page.goto('/sign-up');

        await page.fill('#firstName', 'Test');
        await page.fill('#lastName', 'User');
        await page.fill('#email', testEmail);
        await page.fill('#password', testPassword);
        await page.fill('#dob', '1995-01-01');
        await page.check('input[name="gender"][value="male"]');
        await page.check('input[type="checkbox"]');

        await page.click('button[type="submit"]');

        // Should redirect to sign-in with success message
        await expect(page).toHaveURL(/.*sign-in.*registered=true/);
        await expect(page.locator('.bg-green-50')).toBeVisible();
    });

    test('User can sign in with newly created account', async ({ page }) => {
        await page.goto('/sign-in');

        await page.fill('#email', testEmail);
        await page.fill('#password', testPassword);
        await page.click('button[type="submit"]');

        // Should redirect to home page
        await expect(page).toHaveURL('/');

        // Check if user is logged in (e.g., by checking header or storage)
        // Assuming there's some logout button or user profile icon
        // await expect(page.locator('text=Đăng xuất')).toBeVisible();
    });

    test('User cannot sign in with invalid credentials', async ({ page }) => {
        await page.goto('/sign-in');

        await page.fill('#email', 'nonexistent@example.com');
        await page.fill('#password', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Should show error message
        await expect(page.locator('.bg-red-50')).toBeVisible();
    });

    test('User can navigate between Sign In and Sign Up', async ({ page }) => {
        await page.goto('/sign-in');
        await page.click('text=Đăng ký');
        await expect(page).toHaveURL('/sign-up');

        await page.click('text=Đăng nhập');
        await expect(page).toHaveURL('/sign-in');
    });
});
