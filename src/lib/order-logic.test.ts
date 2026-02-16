import { describe, it, expect } from 'vitest';
import { isValidStatusTransition, getStockAction, OrderStatus } from './order-logic';

describe('Order Logic', () => {
    describe('isValidStatusTransition', () => {
        it('should allow valid transitions from pending', () => {
            expect(isValidStatusTransition('pending', 'confirmed')).toBe(true);
            expect(isValidStatusTransition('pending', 'cancelled')).toBe(true);
            expect(isValidStatusTransition('pending', 'processing')).toBe(true);
        });

        it('should not allow invalid transitions from pending', () => {
            expect(isValidStatusTransition('pending', 'delivered')).toBe(false);
            expect(isValidStatusTransition('pending', 'refunded')).toBe(false);
        });

        it('should allow valid transitions from confirmed', () => {
            expect(isValidStatusTransition('confirmed', 'shipped')).toBe(true);
            expect(isValidStatusTransition('confirmed', 'cancelled')).toBe(true);
        });

        it('should allow valid transitions from shipped', () => {
            expect(isValidStatusTransition('shipped', 'delivered')).toBe(true);
            expect(isValidStatusTransition('shipped', 'cancelled')).toBe(true);
        });

        it('should allow refund only after delivery', () => {
            expect(isValidStatusTransition('delivered', 'refunded')).toBe(true);
            expect(isValidStatusTransition('shipped', 'refunded')).toBe(false);
            expect(isValidStatusTransition('confirmed', 'refunded')).toBe(false);
        });

        it('should not allow transitions from terminal states', () => {
            expect(isValidStatusTransition('cancelled', 'pending')).toBe(false);
            expect(isValidStatusTransition('refunded', 'pending')).toBe(false);
        });

        it('should handle invalid current status gracefully', () => {
            expect(isValidStatusTransition('invalid_status', 'pending')).toBe(false);
        });
    });

    describe('getStockAction', () => {
        it('should return "release" when order is cancelled from a stock-holding state', () => {
            const holdingStates: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped'];
            holdingStates.forEach(state => {
                expect(getStockAction(state, 'cancelled')).toBe('release');
            });
        });

        it('should return "finalize" when order moves to paid/processing states from initial', () => {
            expect(getStockAction('pending', 'payment_received')).toBe('finalize');
            expect(getStockAction('pending', 'confirmed')).toBe('finalize');
            expect(getStockAction('pending_payment_confirmation', 'processing')).toBe('finalize');
        });

        it('should return "release" when order is refunded from delivered state', () => {
            expect(getStockAction('delivered', 'refunded')).toBe('release');
        });

        it('should return "none" for non-stock impacting transitions', () => {
            expect(getStockAction('confirmed', 'processing')).toBe('none');
            expect(getStockAction('processing', 'shipped')).toBe('none');
            expect(getStockAction('shipped', 'delivered')).toBe('none');
        });
    });
});
