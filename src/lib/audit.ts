import { executeQuery } from './db/mysql';
import { NextRequest } from 'next/server';

/**
 * Log an administrative action
 */
export async function logAdminAction(
    adminId: number | string,
    action: string,
    module: string,
    referenceId: string | number | null = null,
    oldValues: any = null,
    newValues: any = null,
    req?: NextRequest
) {
    try {
        const ipAddress = req ? (req.headers.get('x-forwarded-for') || '127.0.0.1') : 'system';
        const userAgent = req ? req.headers.get('user-agent') : null;

        await executeQuery(
            `INSERT INTO admin_activity_logs (admin_user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId,
                action,
                module,
                referenceId ? String(referenceId) : null,
                oldValues ? JSON.stringify(oldValues) : null,
                newValues ? JSON.stringify(newValues) : null,
                ipAddress,
                userAgent
            ]
        );
    } catch (error) {
        console.error('Audit Logging Error (Admin):', error);
    }
}

/**
 * Log a security-critical event
 */
export async function logSecurityEvent(
    eventType: 'login_success' | 'login_failed' | 'rate_limit_hit' | 'unauthorized_access' | 'sensitive_change',
    ip: string,
    userId: number | string | null = null,
    details: any = null
) {
    try {
        await executeQuery(
            `INSERT INTO security_logs (event_type, ip_address, user_id, details) 
             VALUES (?, ?, ?, ?)`,
            [
                eventType,
                ip,
                userId || null,
                details ? JSON.stringify(details) : null
            ]
        );
    } catch (error) {
        console.error('Security Logging Error:', error);
    }
}

/**
 * Log a system error (500s, critical failures)
 */
export async function logSystemError(
    message: string,
    error: any,
    context: any = null
) {
    try {
        const details = {
            error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
            context
        };

        console.error('🚨 SYSTEM ERROR:', message, details);

        await executeQuery(
            `INSERT INTO system_logs (level, message, details) VALUES (?, ?, ?)`,
            ['ERROR', message, JSON.stringify(details)]
        );
    } catch (loggingError) {
        console.error('Failed to write to system_logs:', loggingError);
    }
}
