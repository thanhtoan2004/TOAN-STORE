import { test, expect } from '@playwright/test';

/**
 * Security Tests
 * Kiểm tra các cơ chế bảo mật: Auth enforcement, IDOR prevention, protected routes.
 */

test.describe('Security - Protected Routes', () => {

    test('GET /api/cart requires authentication', async ({ request }) => {
        const response = await request.get('/api/cart');
        expect(response.status()).toBe(401);
    });

    test('GET /api/orders requires authentication', async ({ request }) => {
        const response = await request.get('/api/orders');
        expect(response.status()).toBe(401);
    });

    test('GET /api/account/export requires authentication', async ({ request }) => {
        const response = await request.get('/api/account/export');
        expect(response.status()).toBe(401);
    });

    test('GET /api/notifications requires authentication', async ({ request }) => {
        const response = await request.get('/api/notifications');
        expect(response.status()).toBe(401);
    });

    test('GET /api/wishlist requires authentication', async ({ request }) => {
        const response = await request.get('/api/wishlist');
        expect(response.status()).toBe(401);
    });

    test('POST /api/reviews requires authentication', async ({ request }) => {
        const response = await request.post('/api/reviews', {
            data: { productId: 1, rating: 5, comment: 'Test' }
        });
        expect(response.status()).toBe(401);
    });

    test('POST /api/account/change-password requires authentication', async ({ request }) => {
        const response = await request.post('/api/account/change-password', {
            data: { currentPassword: 'old', newPassword: 'new123' }
        });
        expect(response.status()).toBe(401);
    });
});

test.describe('Security - Admin Routes Protection', () => {

    test('GET /api/admin/dashboard requires admin auth', async ({ request }) => {
        const response = await request.get('/api/admin/dashboard');
        expect(response.status()).toBe(401);
    });

    test('GET /api/admin/users requires admin auth', async ({ request }) => {
        const response = await request.get('/api/admin/users');
        expect(response.status()).toBe(401);
    });

    test('GET /api/admin/orders requires admin auth', async ({ request }) => {
        const response = await request.get('/api/admin/orders');
        expect(response.status()).toBe(401);
    });

    test('GET /api/admin/products requires admin auth', async ({ request }) => {
        const response = await request.get('/api/admin/products');
        expect(response.status()).toBe(401);
    });

    test('GET /api/admin/analytics requires admin auth', async ({ request }) => {
        const response = await request.get('/api/admin/analytics');
        expect(response.status()).toBe(401);
    });

    test('GET /api/admin/reviews requires admin auth', async ({ request }) => {
        const response = await request.get('/api/admin/reviews');
        expect(response.status()).toBe(401);
    });
});

test.describe('Security - IDOR Prevention', () => {

    test('Cannot access other users cart items without auth', async ({ request }) => {
        const response = await request.put('/api/cart/99999', {
            data: { quantity: 100 }
        });
        expect(response.status()).toBe(401);
    });

    test('Cannot delete other users cart items without auth', async ({ request }) => {
        const response = await request.delete('/api/cart/99999');
        expect(response.status()).toBe(401);
    });
});
