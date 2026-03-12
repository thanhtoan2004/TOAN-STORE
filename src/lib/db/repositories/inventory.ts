import { executeQuery, transaction } from '@/lib/db/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Repository Quản lý Kho hàng và Luân chuyển nội bộ (Inventory & Transfers).
 * Xử lý các nghiệp vụ: Kiểm kho, Tạo yêu cầu luân chuyển giữa các kho,
 * và Cập nhật số lượng thực tế trong giao dịch (Atomicity).
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

export class InventoryRepository {
  /**
   * Lấy danh sách yêu cầu luân chuyển kho.
   * Join với bảng Warehouses và Products để lấy đầy đủ tên kho và SKU.
   */
  static async getTransfers(): Promise<InventoryTransfer[]> {
    const sql = `
            SELECT 
                it.*,
                fw.name as fromWarehouseName,
                tw.name as toWarehouseName,
                pv.sku,
                p.name as variantName
            FROM inventory_transfers it
            JOIN warehouses fw ON it.from_warehouse_id = fw.id
            JOIN warehouses tw ON it.to_warehouse_id = tw.id
            JOIN product_variants pv ON it.product_variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            ORDER BY it.created_at DESC
        `;
    return await executeQuery<InventoryTransfer[]>(sql);
  }

  /**
   * Tạo yêu cầu luân chuyển hàng mới.
   */
  static async createTransferRequest(data: Partial<InventoryTransfer>): Promise<number> {
    const sql = `
            INSERT INTO inventory_transfers (
                from_warehouse_id, to_warehouse_id, product_variant_id, 
                quantity, notes, requested_by
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
    const result = await executeQuery<ResultSetHeader>(sql, [
      data.fromWarehouseId ?? null,
      data.toWarehouseId ?? null,
      data.productVariantId ?? null,
      data.quantity ?? 0,
      data.notes ?? null,
      data.requestedBy ?? null,
    ]);
    return result.insertId;
  }

  /**
   * Xử lý Phê duyệt / Hoàn tất việc Luân chuyển hàng.
   * QUAN TRỌNG: Sử dụng Transaction để đảm bảo tính nhất quán.
   * - Trừ số lượng ở Kho Nguồn.
   * - Cộng số lượng ở Kho Đích.
   * - Ghi Log lịch sử cho cả 2 kho.
   * Nếu bất kỳ bước nào thất bại (ví dụ: kho nguồn không đủ hàng), toàn bộ sẽ Rollback.
   */
  static async processTransfer(transferId: number, status: string, adminId: number): Promise<void> {
    await transaction(async (connection: any) => {
      // 1. Lấy thông tin chi tiết yêu cầu
      const [transfers]: any = await connection.query(
        'SELECT * FROM inventory_transfers WHERE id = ?',
        [transferId]
      );

      if (transfers.length === 0) throw new Error('Transfer not found');
      const transfer = transfers[0];

      if (transfer.status === 'completed' || transfer.status === 'cancelled') {
        throw new Error('Transfer already finalized');
      }

      // 2. Nếu trạng thái là Hoàn tất, thực hiện trừ/cộng kho thực tế
      if (status === 'completed') {
        // Trừ hàng ở kho nguồn
        const [deduct]: any = await connection.query(
          `UPDATE inventory 
                     SET quantity = quantity - ? 
                     WHERE product_variant_id = ? AND warehouse_id = ? AND (quantity - reserved) >= ?`,
          [
            transfer.quantity,
            transfer.product_variant_id,
            transfer.from_warehouse_id,
            transfer.quantity,
          ]
        );

        if (deduct.affectedRows === 0)
          throw new Error('Số lượng hàng trong kho nguồn không đủ để luân chuyển');

        // Cộng hàng vào kho đích
        await connection.query(
          `INSERT INTO inventory (product_variant_id, warehouse_id, quantity)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
          [
            transfer.product_variant_id,
            transfer.to_warehouse_id,
            transfer.quantity,
            transfer.quantity,
          ]
        );

        // Ghi log biến động kho (Audit Log)
        await connection.query(
          `INSERT INTO inventory_logs (inventory_id, quantity_change, reason, reference_id)
                     SELECT id, ?, 'transfer_out', ? FROM inventory 
                     WHERE product_variant_id = ? AND warehouse_id = ?`,
          [
            -transfer.quantity,
            transferId.toString(),
            transfer.product_variant_id,
            transfer.from_warehouse_id,
          ]
        );

        await connection.query(
          `INSERT INTO inventory_logs (inventory_id, quantity_change, reason, reference_id)
                     SELECT id, ?, 'transfer_in', ? FROM inventory 
                     WHERE product_variant_id = ? AND warehouse_id = ?`,
          [
            transfer.quantity,
            transferId.toString(),
            transfer.product_variant_id,
            transfer.to_warehouse_id,
          ]
        );

        await connection.query(
          'UPDATE inventory_transfers SET status = ?, completed_at = NOW(), approved_by = ? WHERE id = ?',
          [status, adminId, transferId]
        );
      } else {
        // Chỉ cập nhật trạng thái (Duyệt, Đang vận chuyển hoặc Hủy)
        await connection.query(
          'UPDATE inventory_transfers SET status = ?, approved_by = ? WHERE id = ?',
          [status, adminId, transferId]
        );
      }
    });
  }

  /**
   * Báo cáo kho hàng tổng hợp.
   * Thường dùng trong Dashboard Admin để theo dõi hàng tồn kho của toàn bộ hệ thống.
   */
  static async getAllInventory(): Promise<InventoryItem[]> {
    const sql = `
            SELECT 
                i.*,
                p.name as variantName,
                pv.sku,
                w.name as warehouseName
            FROM inventory i
            JOIN product_variants pv ON i.product_variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            LEFT JOIN warehouses w ON i.warehouse_id = w.id
            ORDER BY p.name ASC, pv.size ASC
        `;
    return await executeQuery<InventoryItem[]>(sql);
  }
}
