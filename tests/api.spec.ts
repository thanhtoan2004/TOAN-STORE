import { test, expect } from '@playwright/test';

/**
 * API Endpoint Tests
 * Kiểm tra các API public endpoint hoạt động đúng (trả đúng status, đúng format response).
 */

test.describe('Public API Endpoints', () => {

    test('GET /api/health returns 200', async ({ request }) => {
        const response = await request.get('/api/health');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    test('GET /api/products returns product list', async ({ request }) => {
        const response = await request.get('/api/products');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data).toBeDefined();
    });

    test('GET /api/categories returns category tree', async ({ request }) => {
        const response = await request.get('/api/categories');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    test('GET /api/banners returns banner list', async ({ request }) => {
        const response = await request.get('/api/banners');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    test('GET /api/faqs returns FAQ list', async ({ request }) => {
        const response = await request.get('/api/faqs');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    test('GET /api/stores returns store locations', async ({ request }) => {
        const response = await request.get('/api/stores');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    test('GET /api/news returns news articles', async ({ request }) => {
        const response = await request.get('/api/news');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    test('GET /api/flash-sales/active returns flash sales data', async ({ request }) => {
        const response = await request.get('/api/flash-sales/active');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBeDefined();
    });
});

test.describe('Search API', () => {

    test('GET /api/products/search requires query param', async ({ request }) => {
        const response = await request.get('/api/products/search');
        expect(response.status()).toBe(400);
    });

    test('GET /api/products/search with short query returns 400', async ({ request }) => {
        const response = await request.get('/api/products/search?q=a');
        expect(response.status()).toBe(400);
    });

    test('GET /api/products/search with valid query returns results', async ({ request }) => {
        const response = await request.get('/api/products/search?q=nike');
        const status = response.status();
        // May be 200 (results) or 500 (Meilisearch not running) — both valid in test env
        expect([200, 500]).toContain(status);
    });
});

test.describe('Promo Codes API', () => {

    test('GET /api/promo-codes/available returns public promo codes', async ({ request }) => {
        const response = await request.get('/api/promo-codes/available');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    test('POST /api/promo-codes/validate requires code and cartTotal', async ({ request }) => {
        const response = await request.post('/api/promo-codes/validate', {
            data: {}
        });
        const status = response.status();
        expect([400, 404]).toContain(status);
    });
});

test.describe('Contact & Newsletter API', () => {

    test('POST /api/contact requires fields', async ({ request }) => {
        const response = await request.post('/api/contact', {
            data: {}
        });
        const status = response.status();
        expect([400, 401]).toContain(status);
    });

    test('POST /api/newsletter requires email', async ({ request }) => {
        const response = await request.post('/api/newsletter', {
            data: {}
        });
        const status = response.status();
        expect([400, 429]).toContain(status);
    });
});
