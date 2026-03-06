export async function createAuditLog(data: {
  adminId: number;
  action: string;
  targetType: string;
  targetId: string | number;
  details?: any;
  ipAddress?: string;
}) {
  const { db } = await import('../drizzle');
  const { adminActivityLogs } = await import('../schema');

  return db.insert(adminActivityLogs).values({
    adminUserId: data.adminId,
    action: data.action,
    entityType: data.targetType,
    entityId: String(data.targetId),
    newValues: data.details || null,
    ipAddress: data.ipAddress || null,
    userAgent: null,
  });
}
