import { db } from '../drizzle';
import { contactMessages, customerNotes, userAddresses, users, adminUsers } from '../schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/security/encryption';

// Contact message functions
export async function saveContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: number;
}) {
  return await db.insert(contactMessages).values({
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    userId: data.userId || null,
    status: 'new', // match schema
  });
}

// Address functions
export async function getAddresses(userId: number) {
  return getUserAddresses(userId);
}

/**
 * Lấy danh sách Sổ địa chỉ của người dùng.
 */
export async function getUserAddresses(userId: number) {
  const addresses = await db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, userId))
    .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt));

  const safeDecrypt = (encrypted: string | null, fallback: string) => {
    if (!encrypted) return fallback || '';
    const result = decrypt(encrypted);
    if (result && /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i.test(result)) {
      return fallback || '';
    }
    return result || fallback || '';
  };

  return addresses.map(({ phoneEncrypted, addressEncrypted, isEncrypted, ...addr }) => ({
    ...addr,
    phone:
      isEncrypted && phoneEncrypted
        ? safeDecrypt(phoneEncrypted, '')
        : addr.phone !== '***'
          ? addr.phone || ''
          : '',
    address_line:
      isEncrypted && addressEncrypted
        ? safeDecrypt(addressEncrypted, '')
        : addr.addressLine !== '***'
          ? addr.addressLine || ''
          : '',
    // Keep internal compatibility for frontend if needed (address_line vs addressLine mapping)
    addressLine:
      isEncrypted && addressEncrypted
        ? safeDecrypt(addressEncrypted, '')
        : addr.addressLine !== '***'
          ? addr.addressLine || ''
          : '',
  }));
}

/**
 * Thêm địa chỉ mới vào Database.
 */
export async function addUserAddress(
  userId: number,
  address: {
    label?: string;
    recipient_name: string;
    phone: string;
    address_line: string;
    city: string;
    state?: string;
    postal_code?: string;
    country?: string;
    is_default?: boolean;
  }
) {
  // Nếu đây là địa chỉ mặc định, bỏ default của các địa chỉ khác
  if (address.is_default) {
    await db.update(userAddresses).set({ isDefault: 0 }).where(eq(userAddresses.userId, userId));
  }

  return await db.insert(userAddresses).values({
    userId,
    label: address.label || null,
    recipientName: address.recipient_name,
    phone: '***',
    phoneEncrypted: encrypt(address.phone),
    addressLine: '***',
    addressEncrypted: encrypt(address.address_line),
    city: address.city,
    state: address.state || null,
    postalCode: address.postal_code || null,
    country: address.country || 'Vietnam',
    isDefault: address.is_default ? 1 : 0,
    isEncrypted: 1,
  });
}

// Alias for compatibility
export async function addAddress(userId: number, data: any) {
  return addUserAddress(userId, {
    ...data,
    recipient_name: data.recipient_name || data.name || data.fullName,
    address_line: data.address_line || data.address,
    state: data.state || data.city,
  });
}

export async function updateUserAddress(
  addressId: number,
  userId: number,
  address: {
    label?: string;
    recipient_name?: string;
    phone?: string;
    address_line?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    is_default?: boolean;
  }
) {
  // Nếu đây là địa chỉ mặc định, bỏ default của các địa chỉ khác
  if (address.is_default) {
    await db.update(userAddresses).set({ isDefault: 0 }).where(eq(userAddresses.userId, userId));
  }

  const updateData: any = {};

  if (address.label !== undefined) updateData.label = address.label;
  if (address.recipient_name !== undefined) updateData.recipientName = address.recipient_name;
  if (address.phone !== undefined) {
    updateData.phoneEncrypted = encrypt(address.phone);
    updateData.phone = '***';
    updateData.isEncrypted = 1;
  }
  if (address.address_line !== undefined) {
    updateData.addressEncrypted = encrypt(address.address_line);
    updateData.addressLine = '***';
    updateData.isEncrypted = 1;
  }
  if (address.city !== undefined) updateData.city = address.city;
  if (address.state !== undefined) updateData.state = address.state;
  if (address.postal_code !== undefined) updateData.postalCode = address.postal_code;
  if (address.country !== undefined) updateData.country = address.country;
  if (address.is_default !== undefined) updateData.isDefault = address.is_default ? 1 : 0;

  if (Object.keys(updateData).length === 0) {
    throw new Error('No fields to update');
  }

  await db
    .update(userAddresses)
    .set(updateData)
    .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)));
}

// Alias for compatibility
export async function updateAddress(userId: number, addressId: number, data: any) {
  return updateUserAddress(addressId, userId, {
    ...data,
    recipient_name: data.recipient_name || data.name || data.fullName,
    address_line: data.address_line || data.address,
    state: data.state || data.city,
  });
}

export async function deleteUserAddress(addressId: number, userId: number) {
  await db
    .delete(userAddresses)
    .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)));
}

export const deleteAddress = deleteUserAddress; // Alias

export async function setDefaultAddress(addressId: number, userId: number) {
  // Bỏ default của tất cả địa chỉ
  await db.update(userAddresses).set({ isDefault: 0 }).where(eq(userAddresses.userId, userId));

  // Set địa chỉ này làm mặc định
  await db
    .update(userAddresses)
    .set({ isDefault: 1 })
    .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)));
}

/**
 * Xóa tài khoản người dùng.
 */
export async function deleteUser(userId: number) {
  return await db
    .update(users)
    .set({
      deletedAt: new Date(),
      isActive: 0,
    })
    .where(eq(users.id, userId));
}

// Customer Notes Repository
export async function getCustomerNotes(userId: number) {
  return await db
    .select({
      id: customerNotes.id,
      note: customerNotes.note,
      createdAt: customerNotes.createdAt,
      adminName: adminUsers.fullName,
    })
    .from(customerNotes)
    .leftJoin(adminUsers, eq(customerNotes.adminId, adminUsers.id))
    .where(eq(customerNotes.userId, userId))
    .orderBy(desc(customerNotes.createdAt));
}

export async function addCustomerNote(data: { userId: number; adminId: number; note: string }) {
  return await db.insert(customerNotes).values({
    userId: data.userId,
    adminId: data.adminId,
    note: data.note,
  });
}
