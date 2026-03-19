import { NextRequest } from 'next/server';

/**
 * Log an administrative action (Drizzle ORM implementation)
 */
export async function logAdminAction(
  adminId: number | string,
  action: string,
  module: string,
  referenceId: string | number | null = null,
  oldValues: any = null,
  newValues: any = null,
  req?: NextRequest | Request
) {
  try {
    const { db } = await import('../drizzle');
    const { adminActivityLogs } = await import('../schema');

    const ipAddress = req
      ? (req instanceof NextRequest
          ? req.headers.get('x-forwarded-for')
          : (req as Request).headers.get('x-forwarded-for')) || '127.0.0.1'
      : 'system';

    const userAgent = req ? req.headers.get('user-agent') : null;

    await db.insert(adminActivityLogs).values({
      adminUserId: Number(adminId),
      action,
      entityType: module,
      entityId: referenceId ? String(referenceId) : null,
      oldValues: oldValues || null,
      newValues: newValues || null,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Audit Logging Error (Admin):', error);
  }
}

/**
 * Log a security-critical event (Drizzle ORM implementation)
 */
export async function logSecurityEvent(
  eventType:
    | 'login_success'
    | 'login_failed'
    | 'admin_login_success'
    | 'admin_2fa_failed'
    | 'rate_limit_hit'
    | 'unauthorized_access'
    | 'sensitive_change',
  ip: string,
  userId: number | string | null = null,
  details: any = null,
  adminId: number | string | null = null
) {
  try {
    const { db } = await import('../drizzle');
    const { securityLogs } = await import('../schema');

    await db.insert(securityLogs).values({
      eventType,
      ipAddress: ip,
      userId: userId ? Number(userId) : null,
      adminId: adminId ? Number(adminId) : null,
      details: details || null,
    });
  } catch (error) {
    console.error('Security Logging Error:', error);
  }
}

/**
 * Log a system error (Drizzle ORM implementation)
 */
export async function logSystemError(message: string, error: any, context: any = null) {
  try {
    const { db } = await import('../drizzle');
    const { systemLogs } = await import('../schema');

    const details = {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      context,
    };

    console.error('🚨 SYSTEM ERROR:', message, details);

    await db.insert(systemLogs).values({
      level: 'error',
      module: context?.module || 'system',
      message,
      details,
    });
  } catch (loggingError) {
    console.error('Failed to write to system_logs:', loggingError);
  }
}

/**
 * Legacy wrapper for createAuditLog
 */
export async function createAuditLog(data: {
  adminId: number;
  action: string;
  targetType: string;
  targetId: string | number;
  details?: any;
  ipAddress?: string;
}) {
  return logAdminAction(
    data.adminId,
    data.action,
    data.targetType,
    data.targetId,
    null,
    data.details
    // We don't have req here in the legacy call, so it will use 'system'
  );
}
