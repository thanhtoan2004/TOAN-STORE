import { test, expect } from '@playwright/test';

test.describe('Shopping Experience', () => {
    test('User can search for products and see results', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Open search overlay by clicking the header search area
        await page.locator('div.w-64:has(input)').click();

        // Type in overlay search bar
        const overlayInput = page.locator('.fixed.inset-0 input[placeholder*="Tìm kiếm"]');
        await overlayInput.fill('Jordan', { timeout: 10000 });
        await overlayInput.press('Enter');

        // Wait for search results summary text specifically
        await expect(page.locator('p.text-gray-600').filter({ hasText: 'kết quả cho' }).first()).toBeVisible({ timeout: 30000 });

        // Check if results are displayed
        const resultsCount = await page.locator('.grid a.group').count();
        expect(resultsCount).toBeGreaterThan(0);
    });

    test('User can add a product to cart with size selection', async ({ page }) => {
        // Authenticate first
        await page.goto('/sign-in');
        await page.fill('#email', 'admin@nike.com');
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/', { timeout: 60000 });

        // Navigate to a specific product page
        await page.goto('/products/1');
        await page.waitForLoadState('networkidle');

        // Select a size
        const sizeButton = page.locator('button:not([disabled]):has-text("40")').first();
        await sizeButton.click();

        // Click Add to Cart
        await page.click('button:has-text("Thêm vào giỏ hàng")');

        // Check for success notification
        await expect(page.locator('text=Đã thêm vào giỏ hàng!')).toBeVisible({ timeout: 60000 });

        // Navigate to cart
        await page.goto('/cart');
        await page.waitForLoadState('networkidle');

        // Verify product is in cart
        await expect(page.locator('.cart-item')).toBeVisible({ timeout: 60000 });
    });
});
