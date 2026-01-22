import { NextResponse } from 'next/server';
import { 
  getUserAddresses, 
  addUserAddress, 
  updateUserAddress, 
  deleteUserAddress,
  setDefaultAddress
} from '@/lib/db/mysql';

// GET - Lấy danh sách địa chỉ
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get('userId'));

  if (!userId) {
    return NextResponse.json(
      { error: 'Thiếu userId' },
      { status: 400 }
    );
  }

  try {
    const addresses = await getUserAddresses(userId);
    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Lỗi lấy danh sách địa chỉ:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách địa chỉ' },
      { status: 500 }
    );
  }
}

// POST - Thêm địa chỉ mới
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, ...addressData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Thiếu userId' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!addressData.recipient_name || !addressData.phone || !addressData.address_line || !addressData.city) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: tên người nhận, số điện thoại, địa chỉ, thành phố' },
        { status: 400 }
      );
    }

    const result = await addUserAddress(userId, addressData);
    return NextResponse.json({ 
      success: true, 
      addressId: (result as any).insertId 
    });
  } catch (error) {
    console.error('Lỗi thêm địa chỉ:', error);
    return NextResponse.json(
      { error: 'Lỗi khi thêm địa chỉ' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật địa chỉ
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, addressId, action, ...addressData } = body;

    if (!userId || !addressId) {
      return NextResponse.json(
        { error: 'Thiếu userId hoặc addressId' },
        { status: 400 }
      );
    }

    // Nếu action là setDefault, chỉ set làm địa chỉ mặc định
    if (action === 'setDefault') {
      await setDefaultAddress(addressId, userId);
      return NextResponse.json({ success: true });
    }

    // Ngược lại, cập nhật thông tin địa chỉ
    await updateUserAddress(addressId, userId, addressData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi cập nhật địa chỉ:', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật địa chỉ' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa địa chỉ
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get('userId'));
  const addressId = Number(searchParams.get('addressId'));

  if (!userId || !addressId) {
    return NextResponse.json(
      { error: 'Thiếu userId hoặc addressId' },
      { status: 400 }
    );
  }

  try {
    await deleteUserAddress(addressId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi xóa địa chỉ:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa địa chỉ' },
      { status: 500 }
    );
  }
}
