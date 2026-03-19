import { NextRequest, NextResponse } from 'next/server';
import { getAddresses, addAddress } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

// GET: Fetch user addresses
/**
 * API Lấy danh sách địa chỉ giao hàng của User.
 */
export async function GET(request: Request) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const userId = Number(session.userId);

    const addresses = await getAddresses(userId);
    return ResponseWrapper.success(addresses);
  } catch (error: any) {
    console.error('Error fetching addresses:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

// POST: Add new address
/**
 * API Thêm địa chỉ giao hàng mới.
 */
export async function POST(request: Request) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const userId = Number(session.userId);

    const body = await request.json();
    const { userId: bodyUserId, ...addressData } = body;

    // Validate required fields
    if (!addressData.recipientName && !addressData.fullName && !addressData.name) {
      return ResponseWrapper.error('Thiếu tên người nhận', 400);
    }
    if (!addressData.phone) return ResponseWrapper.error('Thiếu số điện thoại', 400);
    if (!addressData.addressLine && !addressData.address)
      return ResponseWrapper.error('Thiếu địa chỉ', 400);
    if (!addressData.city) return ResponseWrapper.error('Thiếu tỉnh/thành phố', 400);

    const newAddressId = await addAddress(userId, addressData);
    return ResponseWrapper.success({ id: newAddressId }, 'Đã thêm địa chỉ thành công');
  } catch (error) {
    console.error('Error adding address:', error);
    return ResponseWrapper.serverError('Lỗi hệ thống khi thêm địa chỉ', error);
  }
}

// PUT: Update address or set default
/**
 * API Cập nhật địa chỉ hoặc đặt làm mặc định.
 */
export async function PUT(request: Request) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const userId = Number(session.userId);

    const body = await request.json();
    const { addressId, action, ...addressData } = body;

    if (!addressId) {
      return NextResponse.json(
        { success: false, message: 'Address ID is required' },
        { status: 400 }
      );
    }

    const { updateAddress, setDefaultAddress } = await import('@/lib/db/mysql');

    if (action === 'setDefault') {
      await setDefaultAddress(parseInt(addressId), userId);
      return ResponseWrapper.success(null, 'Đã đặt địa chỉ làm mặc định');
    } else {
      // Default action is update
      await updateAddress(userId, parseInt(addressId), addressData);
      return ResponseWrapper.success(null, 'Cập nhật địa chỉ thành công');
    }
  } catch (error: any) {
    console.error('Error updating address:', error);
    return ResponseWrapper.serverError('Lỗi hệ thống khi cập nhật địa chỉ', error);
  }
}

// DELETE: Delete an address
/**
 * API Xóa địa chỉ giao hàng.
 * Phải xác thực đúng chủ sở hữu địa chỉ mới được phép xóa (logic ở Database layer).
 */
export async function DELETE(request: Request) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const userId = Number(session.userId);

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('addressId');

    if (!addressId) {
      return ResponseWrapper.error('Address ID is required', 400);
    }

    const { deleteAddress } = await import('@/lib/db/mysql');
    await deleteAddress(userId, parseInt(addressId));

    return ResponseWrapper.success(null, 'Đã xóa địa chỉ thành công');
  } catch (error) {
    console.error('Error deleting address:', error);
    return ResponseWrapper.serverError('Lỗi hệ thống khi xóa địa chỉ', error);
  }
}
