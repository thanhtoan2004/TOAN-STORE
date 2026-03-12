import { describe, it, expect } from 'vitest';
import {
  VALID_TRANSITIONS,
  isValidStatusTransition,
  getStockAction,
} from '@/lib/orders/order-logic';

/**
 * Unit Tests cho Order State Machine
 * Kiểm tra các transition hợp lệ và không hợp lệ trong flow đơn hàng.
 */

describe('Order State Machine', () => {
  describe('VALID_TRANSITIONS', () => {
    it('pending should allow confirmed and cancelled', () => {
      expect(VALID_TRANSITIONS.pending).toContain('confirmed');
      expect(VALID_TRANSITIONS.pending).toContain('cancelled');
    });

    it('confirmed should allow processing and shipped', () => {
      expect(VALID_TRANSITIONS.confirmed).toContain('processing');
      expect(VALID_TRANSITIONS.confirmed).toContain('shipped');
    });

    it('processing should allow shipped', () => {
      expect(VALID_TRANSITIONS.processing).toContain('shipped');
    });

    it('shipped should allow delivered', () => {
      expect(VALID_TRANSITIONS.shipped).toContain('delivered');
    });

    it('delivered should only allow refunded', () => {
      expect(VALID_TRANSITIONS.delivered).toEqual(['refunded']);
    });

    it('cancelled should be terminal (no transitions)', () => {
      expect(VALID_TRANSITIONS.cancelled).toEqual([]);
    });

    it('refunded should be terminal (no transitions)', () => {
      expect(VALID_TRANSITIONS.refunded).toEqual([]);
    });
  });

  describe('isValidStatusTransition()', () => {
    it('pending → confirmed should be valid', () => {
      expect(isValidStatusTransition('pending', 'confirmed')).toBe(true);
    });

    it('pending → cancelled should be valid', () => {
      expect(isValidStatusTransition('pending', 'cancelled')).toBe(true);
    });

    it('pending → delivered should be INVALID (skip states)', () => {
      expect(isValidStatusTransition('pending', 'delivered')).toBe(false);
    });

    it('delivered → shipped should be INVALID (backward)', () => {
      expect(isValidStatusTransition('delivered', 'shipped')).toBe(false);
    });

    it('cancelled → confirmed should be INVALID (from terminal)', () => {
      expect(isValidStatusTransition('cancelled', 'confirmed')).toBe(false);
    });

    it('shipped → delivered should be valid', () => {
      expect(isValidStatusTransition('shipped', 'delivered')).toBe(true);
    });

    it('payment_received → confirmed should be valid', () => {
      expect(isValidStatusTransition('payment_received', 'confirmed')).toBe(true);
    });

    it('invalid status should return false', () => {
      expect(isValidStatusTransition('nonexistent', 'pending')).toBe(false);
    });
  });

  describe('getStockAction()', () => {
    it('cancellation from pending should release stock', () => {
      expect(getStockAction('pending', 'cancelled')).toBe('release');
    });

    it('cancellation from confirmed should release stock', () => {
      expect(getStockAction('confirmed', 'cancelled')).toBe('release');
    });

    it('cancellation from shipped should release stock', () => {
      expect(getStockAction('shipped', 'cancelled')).toBe('release');
    });

    it('pending → confirmed should finalize stock', () => {
      expect(getStockAction('pending', 'confirmed')).toBe('finalize');
    });

    it('pending → payment_received should finalize stock', () => {
      expect(getStockAction('pending', 'payment_received')).toBe('finalize');
    });

    it('delivered → refunded should release stock', () => {
      expect(getStockAction('delivered', 'refunded')).toBe('release');
    });

    it('confirmed → processing should be none (already finalized)', () => {
      expect(getStockAction('confirmed', 'processing')).toBe('none');
    });

    it('processing → shipped should be none', () => {
      expect(getStockAction('processing', 'shipped')).toBe('none');
    });

    it('shipped → delivered should be none', () => {
      expect(getStockAction('shipped', 'delivered')).toBe('none');
    });
  });
});
