import { db } from '../drizzle';
import {
  inventory,
  inventoryTransfers,
  inventoryLogs,
  warehouses,
  productVariants,
  products,
  adminUsers,
} from '../schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

/**
 * Repository Quản lý Kho hàng và Luân chuyển nội bộ (Inventory & Transfers).
 */

export interface InventoryItem {
  id: number;
  productVariantId: number;
  warehouseId: number;
  quantity: number;
  reserved: number;
  lowStockThreshold: number;
  allowBackorder: number;
  expectedRestockDate: string | null;
  variantName?: string;
  sku?: string;
  warehouseName?: string;
}

export interface InventoryTransfer {
  id: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  productVariantId: number;
  quantity: number;
  status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
  requestedBy?: number;
  approvedBy?: number;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  fromWarehouseName?: string;
  toWarehouseName?: string;
  variantName?: string;
  sku?: string;
}

/**
 * Lấy danh sách yêu cầu luân chuyển kho.
 */
export async function getTransfers(): Promise<any[]> {
  const fw = sql`fw`;
  const tw = sql`tw`;

  return await db
    .select({
      id: inventoryTransfers.id,
      fromWarehouseId: inventoryTransfers.fromWarehouseId,
      toWarehouseId: inventoryTransfers.toWarehouseId,
      productVariantId: inventoryTransfers.productVariantId,
      quantity: inventoryTransfers.quantity,
      status: inventoryTransfers.status,
      requestedBy: inventoryTransfers.requestedBy,
      approvedBy: inventoryTransfers.approvedBy,
      notes: inventoryTransfers.notes,
      createdAt: inventoryTransfers.createdAt,
      completedAt: inventoryTransfers.completedAt,
      fromWarehouseName: sql<string>`(SELECT name FROM ${warehouses} WHERE id = ${inventoryTransfers.fromWarehouseId})`,
      toWarehouseName: sql<string>`(SELECT name FROM ${warehouses} WHERE id = ${inventoryTransfers.toWarehouseId})`,
      sku: productVariants.sku,
      variantName: products.name,
    })
    .from(inventoryTransfers)
    .innerJoin(productVariants, eq(inventoryTransfers.productVariantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .orderBy(desc(inventoryTransfers.createdAt));
}

/**
 * Tạo yêu cầu luân chuyển hàng mới.
 */
export async function createTransferRequest(data: Partial<InventoryTransfer>): Promise<number> {
  const [result] = await db.insert(inventoryTransfers).values({
    fromWarehouseId: data.fromWarehouseId!,
    toWarehouseId: data.toWarehouseId!,
    productVariantId: data.productVariantId!,
    quantity: data.quantity!,
    notes: data.notes || null,
    requestedBy: data.requestedBy || null,
  });
  return result.insertId;
}

/**
 * Xử lý Phê duyệt / Hoàn tất việc Luân chuyển hàng.
 */
export async function processTransfer(
  transferId: number,
  status: string,
  adminId: number
): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Lấy thông tin chi tiết yêu cầu
    const [transfer] = await tx
      .select()
      .from(inventoryTransfers)
      .where(eq(inventoryTransfers.id, transferId))
      .forUpdate();

    if (!transfer) throw new Error('Transfer not found');

    if (transfer.status === 'completed' || transfer.status === 'cancelled') {
      throw new Error('Transfer already finalized');
    }

    // 2. Nếu trạng thái là Hoàn tất, thực hiện trừ/cộng kho thực tế
    if (status === 'completed') {
      // Trừ hàng ở kho nguồn
      const [deduct] = await tx
        .update(inventory)
        .set({ quantity: sql`${inventory.quantity} - ${transfer.quantity}` })
        .where(
          and(
            eq(inventory.productVariantId, transfer.productVariantId),
            eq(inventory.warehouseId, transfer.fromWarehouseId),
            sql`${inventory.quantity} - ${inventory.reserved} >= ${transfer.quantity}`
          )
        );

      if (deduct.affectedRows === 0)
        throw new Error('Số lượng hàng trong kho nguồn không đủ để luân chuyển');

      // Cộng hàng vào kho đích
      await tx
        .insert(inventory)
        .values({
          productVariantId: transfer.productVariantId,
          warehouseId: transfer.toWarehouseId,
          quantity: transfer.quantity,
        })
        .onDuplicateKeyUpdate({
          set: { quantity: sql`${inventory.quantity} + ${transfer.quantity}` },
        });

      // Ghi log biến động kho (Audit Log)
      const [sourceInv] = await tx
        .select({ id: inventory.id })
        .from(inventory)
        .where(
          and(
            eq(inventory.productVariantId, transfer.productVariantId),
            eq(inventory.warehouseId, transfer.fromWarehouseId)
          )
        );

      if (sourceInv) {
        await tx.insert(inventoryLogs).values({
          inventoryId: sourceInv.id,
          adminId: adminId,
          quantityChange: -transfer.quantity,
          reason: 'transfer_out',
          referenceId: String(transferId),
          notes: `Transfer to warehouse ID: ${transfer.toWarehouseId}`,
        });
      }

      const [destInv] = await tx
        .select({ id: inventory.id })
        .from(inventory)
        .where(
          and(
            eq(inventory.productVariantId, transfer.productVariantId),
            eq(inventory.warehouseId, transfer.toWarehouseId)
          )
        );

      if (destInv) {
        await tx.insert(inventoryLogs).values({
          inventoryId: destInv.id,
          adminId: adminId,
          quantityChange: transfer.quantity,
          reason: 'transfer_in',
          referenceId: String(transferId),
          notes: `Transfer from warehouse ID: ${transfer.fromWarehouseId}`,
        });
      }

      await tx
        .update(inventoryTransfers)
        .set({
          status: status as any,
          completedAt: new Date(),
          approvedBy: adminId,
        })
        .where(eq(inventoryTransfers.id, transferId));
    } else {
      // Chỉ cập nhật trạng thái (Duyệt, Đang vận chuyển hoặc Hủy)
      await tx
        .update(inventoryTransfers)
        .set({ status: status as any, approvedBy: adminId })
        .where(eq(inventoryTransfers.id, transferId));
    }
  });
}

/**
 * Báo cáo kho hàng tổng hợp.
 */
export async function getAllInventory(): Promise<any[]> {
  return await db
    .select({
      id: inventory.id,
      productVariantId: inventory.productVariantId,
      warehouseId: inventory.warehouseId,
      quantity: inventory.quantity,
      reserved: inventory.reserved,
      lowStockThreshold: inventory.lowStockThreshold,
      allowBackorder: inventory.allowBackorder,
      expectedRestockDate: inventory.expectedRestockDate,
      variantName: products.name,
      sku: productVariants.sku,
      warehouseName: warehouses.name,
    })
    .from(inventory)
    .innerJoin(productVariants, eq(inventory.productVariantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
    .orderBy(asc(products.name), asc(productVariants.size));
}

/**
 * Lấy nhật ký biến động kho (Audit Logs).
 */
export async function getInventoryLogs(
  options: {
    inventoryId?: number;
    limit?: number;
    page?: number;
  } = {}
): Promise<any[]> {
  const limit = options.limit || 50;
  const page = options.page || 1;
  const offset = (page - 1) * limit;

  const filters = [];
  if (options.inventoryId) {
    filters.push(eq(inventoryLogs.inventoryId, options.inventoryId));
  }

  return await db
    .select({
      id: inventoryLogs.id,
      inventoryId: inventoryLogs.inventoryId,
      adminId: inventoryLogs.adminId,
      adminName: adminUsers.fullName,
      quantityChange: inventoryLogs.quantityChange,
      reason: inventoryLogs.reason,
      referenceId: inventoryLogs.referenceId,
      notes: inventoryLogs.notes,
      createdAt: inventoryLogs.createdAt,
      sku: productVariants.sku,
      variantName: products.name,
      size: productVariants.size,
      warehouseName: warehouses.name,
    })
    .from(inventoryLogs)
    .leftJoin(adminUsers, eq(inventoryLogs.adminId, adminUsers.id))
    .innerJoin(inventory, eq(inventoryLogs.inventoryId, inventory.id))
    .innerJoin(productVariants, eq(inventory.productVariantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
    .where(and(...filters))
    .orderBy(desc(inventoryLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Điều chỉnh tồn kho thủ công (Manual Adjustment).
 */
export async function adjustInventory(data: {
  inventoryId: number;
  quantityChange: number;
  reason: string;
  adminId: number;
  notes?: string;
}): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Cập nhật số lượng
    const [result] = await tx
      .update(inventory)
      .set({ quantity: sql`${inventory.quantity} + ${data.quantityChange}` })
      .where(eq(inventory.id, data.inventoryId));

    if (result.affectedRows === 0) throw new Error('Inventory record not found');

    // 2. Ghi nhật ký
    await tx.insert(inventoryLogs).values({
      inventoryId: data.inventoryId,
      adminId: data.adminId,
      quantityChange: data.quantityChange,
      reason: data.reason,
      notes: data.notes || null,
    });
  });
}

// Legacy class export for compatibility
export class InventoryRepository {
  static getTransfers = getTransfers;
  static createTransferRequest = createTransferRequest;
  static processTransfer = processTransfer;
  static getAllInventory = getAllInventory;
}
