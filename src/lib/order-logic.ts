/**
 * Centralized Order State Machine
 * Defines valid transitions and business rules for order statuses.
 */

export type OrderStatus =
    | 'pending'
    | 'pending_payment_confirmation'
    | 'payment_received'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending: ['pending_payment_confirmation', 'payment_received', 'confirmed', 'processing', 'cancelled'],
    pending_payment_confirmation: ['payment_received', 'confirmed', 'cancelled'],
    payment_received: ['confirmed', 'processing', 'cancelled'],
    confirmed: ['processing', 'shipped', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'], // Can still cancel if delivery fails or refused
    delivered: ['refunded'], // Once delivered, only refund is a valid next "major" state
    cancelled: [], // Terminal state
    refunded: [], // Terminal state
};

/**
 * Validates if an order can move from currentStatus to nextStatus.
 */
export function isValidStatusTransition(current: string, next: string): boolean {
    const currentStatus = current as OrderStatus;
    const nextStatus = next as OrderStatus;

    if (!VALID_TRANSITIONS[currentStatus]) return false;
    return VALID_TRANSITIONS[currentStatus].includes(nextStatus);
}

/**
 * Business Rules for Stock Actions based on status change
 */
export function getStockAction(oldStatus: string, newStatus: string): 'none' | 'reserve' | 'finalize' | 'release' {
    // 1. Initial order (not handled here, handled in createOrder)

    // 2. Cancellation from any state that had stock held
    if (newStatus === 'cancelled' && ['pending', 'pending_payment_confirmation', 'payment_received', 'confirmed', 'processing', 'shipped'].includes(oldStatus)) {
        return 'release';
    }

    // 3. Finalizing (Paid/Processing means stock is officially deduction)
    if (['payment_received', 'confirmed', 'processing'].includes(newStatus) && ['pending', 'pending_payment_confirmation'].includes(oldStatus)) {
        return 'finalize';
    }

    // 4. Refund/Return from Delivered -> Release back to quantity
    if (newStatus === 'refunded' && oldStatus === 'delivered') {
        return 'release';
    }

    return 'none';
}
