import { test, expect } from '@playwright/test';

test.describe('Security Hardening — Full Audit', () => {

    // === Phase 63.2: IDOR & Information Disclosure ===

    test('Review Purchase Check - unauthenticated → 401', async ({ request }) => {
        const res = await request.get('/api/reviews/check-purchase?productId=1');
        expect(res.status()).toBe(401);
    });

    test('Promo Code History - unauthenticated → 401', async ({ request }) => {
        const res = await request.get('/api/promo-codes/history?userId=1');
        expect(res.status()).toBe(401);
    });

    test('Cart GET - unauthenticated → 401', async ({ request }) => {
        const res = await request.get('/api/cart');
        expect(res.status()).toBe(401);
    });

    test('Cart DELETE - unauthenticated → 401', async ({ request }) => {
        const res = await request.delete('/api/cart');
        expect(res.status()).toBe(401);
    });

    test('Cart Item PUT - unauthenticated → 401', async ({ request }) => {
        const res = await request.put('/api/cart/1', { data: { quantity: 5 } });
        expect(res.status()).toBe(401);
    });

    test('Cart Item DELETE - unauthenticated → 401', async ({ request }) => {
        const res = await request.delete('/api/cart/1');
        expect(res.status()).toBe(401);
    });

    // === Phase 63.3: Full Security Hardening ===

    test('Debug Sentry - unauthenticated → 401', async ({ request }) => {
        const res = await request.get('/api/debug/sentry');
        expect(res.status()).toBe(401);
    });

    test('Cron cleanup-reservations - no Bearer token → 401', async ({ request }) => {
        const res = await request.get('/api/cron/cleanup-reservations');
        expect(res.status()).toBe(401);
    });

    test('Cron cleanup-orders - no Bearer token → 401', async ({ request }) => {
        const res = await request.get('/api/cron/cleanup-orders');
        expect(res.status()).toBe(401);
    });

    test('Promo codes available - should NOT leak discount_value or usage_limit', async ({ request }) => {
        const res = await request.get('/api/promo-codes/available');
        if (res.status() === 200) {
            const body = await res.json();
            if (body.data && body.data.length > 0) {
                const coupon = body.data[0];
                // These sensitive fields should NOT be in the response
                expect(coupon).not.toHaveProperty('discount_value');
                expect(coupon).not.toHaveProperty('usage_limit');
                expect(coupon).not.toHaveProperty('times_used');
                expect(coupon).not.toHaveProperty('id');
                // These safe fields should be present
                expect(coupon).toHaveProperty('code');
                expect(coupon).toHaveProperty('description');
            }
        }
    });
});
