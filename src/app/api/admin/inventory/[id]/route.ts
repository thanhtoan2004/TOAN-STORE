import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';
import { sendWishlistRestockEmail } from '@/lib/email-templates';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { quantity } = await request.json();

    // 1. Check previous quantity and get Product info
    const inventoryItems = await executeQuery<any[]>(
      `SELECT i.quantity, p.id as product_id, p.name as product_name 
         FROM inventory i
         JOIN product_variants pv ON i.product_variant_id = pv.id
         JOIN products p ON pv.product_id = p.id
         WHERE i.id = ?`,
      [id]
    );

    const inventoryItem = inventoryItems[0];
    const oldQuantity = inventoryItem ? (inventoryItem.quantity || 0) : 0;
    const newQuantity = quantity;

    // 2. Update Inventory
    await executeQuery(
      'UPDATE inventory SET quantity = ? WHERE id = ?',
      [quantity, id]
    );

    // 3. Trigger Restock Email if moving from 0 to > 0
    if (inventoryItem && oldQuantity <= 0 && newQuantity > 0) {
      // Find users who have this product in wishlist
      const wishlistUsers = await executeQuery<any[]>(
        `SELECT u.email, u.name 
             FROM wishlist w
             JOIN users u ON w.user_id = u.id
             WHERE w.product_id = ?`,
        [inventoryItem.product_id]
      );

      if (wishlistUsers.length > 0) {
        console.log(`Sending RESTOCK email to ${wishlistUsers.length} users for product ${inventoryItem.product_name}`);
        wishlistUsers.forEach(user => {
          sendWishlistRestockEmail(
            user.email,
            user.name || 'Bạn',
            inventoryItem.product_name,
            inventoryItem.product_id
          ).catch(console.error);
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Inventory updated' });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ success: false, message: 'Error updating inventory' }, { status: 500 });
  }
}
