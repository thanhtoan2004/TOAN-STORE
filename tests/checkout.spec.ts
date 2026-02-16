import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Shared setup: Login and add an item to cart
        await page.goto('/sign-in');
        // Using a known test account or the one created in auth.spec.ts
        // For standalone checkout test, we might need a dedicated test account
        await page.fill('#email', 'admin@nike.com'); // Match actual DB data
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');

        await page.goto('/products/1');
        await page.waitForLoadState('networkidle');
        const sizeButton = page.locator('button:not([disabled])').first();
        await sizeButton.click();
        await page.click('button:has-text("Thêm vào giỏ hàng")');
        // Wait for success toast or some state change
        await page.waitForTimeout(2000);
    });

    test('Complete checkout flow with COD', async ({ page }) => {
        await page.goto('/cart');
        await page.click('button:has-text("Thanh toán")');

        await expect(page).toHaveURL(/.*checkout/);

        // Fill shipping information (if not already filled)
        // Note: If fields are pre-filled, we might skip or just verify
        if (await page.locator('#address').count() > 0) {
            await page.fill('#fullName', 'Test Recipient');
            await page.fill('#phone', '0123456789');
            await page.fill('#address', '123 Test Street');
            await page.selectOption('select[name="city"]', { label: 'Ho Chi Minh City' });
            // The select might have different values, but based on the code it has "TP. Hồ Chí Minh"
            // Wait, I should check the actual option values in the code.
            // Line 612: <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
            await page.selectOption('select', 'TP. Hồ Chí Minh');
            await page.fill('input[placeholder="Quận/Huyện"]', 'Quận 1');
            await page.fill('input[placeholder="Phường/Xã"]', 'Phường Bến Nghé');
        }

        // Select COD payment method
        await page.click('input[value="cod"]');

        // Place order
        await page.click('button:has-text("Đặt hàng")');
        await page.waitForLoadState('networkidle');

        // Should show success page
        await expect(page).toHaveURL(/.*order-success/, { timeout: 60000 });
        await expect(page.locator('text=Đặt hàng thành công')).toBeVisible({ timeout: 30000 });
    });

    test('Apply voucher during checkout', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForLoadState('networkidle');
        await page.click('button:has-text("Thanh toán")');
        await page.waitForLoadState('networkidle');

        const voucherInput = page.locator('input[placeholder*="Voucher"]');
        await voucherInput.fill('WELCOME50');
        await page.click('button:has-text("Áp dụng")');

        // Verify discount is applied
        await expect(page.locator('text=Giảm giá')).toBeVisible({ timeout: 30000 });
    });
});
