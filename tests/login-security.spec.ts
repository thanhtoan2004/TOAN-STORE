import { test, expect } from '@playwright/test';

test.describe('Login Security', () => {
    const testEmail = 'admin@nike.com';
    const wrongPassword = 'wrongpassword123';

    test('should prompt for captcha after 3 failed attempts and lockout after 5', async ({ page }) => {
        await page.goto('/sign-in');

        // 1st Attempt
        await page.fill('#email', testEmail);
        await page.fill('#password', wrongPassword);
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Email hoặc mật khẩu không chính xác')).toBeVisible();

        // 2nd Attempt
        await page.fill('#password', wrongPassword);
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Email hoặc mật khẩu không chính xác')).toBeVisible();

        // 3rd Attempt
        await page.fill('#password', wrongPassword);
        await page.click('button[type="submit"]');
        // After 3rd fail, the error message indicates captcha is required
        await expect(page.locator('text=Vui lòng xác thực mã Captcha')).toBeVisible();
        await expect(page.locator('#captcha')).toBeVisible();

        // 4th Attempt (with wrong captcha)
        await page.fill('#password', wrongPassword);
        await page.fill('#captcha', '999'); // Wrong answer
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Vui lòng xác thực mã Captcha')).toBeVisible();

        // 5th Attempt (wrong password + correct captcha if we could know it, but here we just fail again)
        await page.fill('#password', wrongPassword);
        await page.fill('#captcha', '999');
        await page.click('button[type="submit"]');

        // After 5 total failures, it should be locked
        await expect(page.locator('text=Tài khoản của bạn đã bị khóa 30 phút')).toBeVisible({ timeout: 10000 });
    });
});
