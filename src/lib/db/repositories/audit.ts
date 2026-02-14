export async function createAuditLog(data: {
    adminId: number;
    action: string;
    targetType: string;
    targetId: string | number;
    details?: any;
    ipAddress?: string;
}) {
    const { executeQuery } = await import('../mysql');
    return executeQuery(
        'INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        [
            data.adminId,
            data.action,
            data.targetType,
            String(data.targetId),
            data.details ? JSON.stringify(data.details) : null,
            data.ipAddress || null
        ]
    );
}
