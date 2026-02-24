import { executeQuery } from '../connection';
import { encrypt, decrypt } from '@/lib/encryption';

// Contact message functions
export async function saveContactMessage(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    userId?: number;
}) {
    const query = `
    INSERT INTO contact_messages (name, email, subject, message, user_id, status)
    VALUES (?, ?, ?, ?, ?, 'new')`;

    return executeQuery(query, [
        data.name,
        data.email,
        data.subject,
        data.message,
        data.userId || null
    ]);
}

// Address functions
export async function getAddresses(userId: number) {
    return getUserAddresses(userId);
}

/**
 * Láy danh sách Sổ địa chỉ của người dùng.
 * Bắt buộc phải chạy qua hàm giải mã `decrypt` (AES-256) vì Phone và Địa chỉ là thông tin PII nhạy cảm,
 * database chỉ lưu chuỗi mã hóa không đọc được.
 */
export async function getUserAddresses(userId: number) {
    const addresses = await executeQuery<any[]>(
        `SELECT * FROM user_addresses 
     WHERE user_id = ? 
     ORDER BY is_default DESC, created_at DESC`,
        [userId]
    );

    return addresses.map(addr => ({
        ...addr,
        phone: decrypt(addr.phone),
        address_line: decrypt(addr.address_line)
    }));
}

/**
 * Thêm địa chỉ mới vào Database.
 * Thông tin nhạy cảm (Số điện thoại, Số nhà) đều sẽ bị mã hóa bằng `encrypt()` trước khi chui vào DB.
 * Nếu user set tag `is_default`, hàm này sẽ dập tắt cờ default của tất cả địa chỉ cũ trước khi gán.
 */
export async function addUserAddress(userId: number, address: {
    label?: string;
    recipient_name: string;
    phone: string;
    address_line: string;
    city: string;
    state?: string;
    postal_code?: string;
    country?: string;
    is_default?: boolean;
}) {
    // Nếu đây là địa chỉ mặc định, bỏ default của các địa chỉ khác
    if (address.is_default) {
        await executeQuery(
            'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
            [userId]
        );
    }

    const result = await executeQuery(
        `INSERT INTO user_addresses 
     (user_id, label, recipient_name, phone, address_line, city, state, postal_code, country, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            address.label || null,
            address.recipient_name,
            encrypt(address.phone),
            encrypt(address.address_line),
            address.city,
            address.state || null,
            address.postal_code || null,
            address.country || 'Vietnam',
            address.is_default ? 1 : 0
        ]
    );

    return result;
}

// Alias for compatibility
export async function addAddress(userId: number, data: any) {
    return addUserAddress(userId, {
        ...data,
        recipient_name: data.recipient_name || data.name || data.fullName,
        address_line: data.address_line || data.address,
        state: data.state || data.city
    });
}


export async function updateUserAddress(addressId: number, userId: number, address: {
    label?: string;
    recipient_name?: string;
    phone?: string;
    address_line?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    is_default?: boolean;
}) {
    // Nếu đây là địa chỉ mặc định, bỏ default của các địa chỉ khác
    if (address.is_default) {
        await executeQuery(
            'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
            [userId]
        );
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (address.label !== undefined) {
        fields.push('label = ?');
        values.push(address.label);
    }
    if (address.recipient_name !== undefined) {
        fields.push('recipient_name = ?');
        values.push(address.recipient_name);
    }
    if (address.phone !== undefined) {
        fields.push('phone = ?');
        values.push(encrypt(address.phone));
    }
    if (address.address_line !== undefined) {
        fields.push('address_line = ?');
        values.push(encrypt(address.address_line));
    }
    if (address.city !== undefined) {
        fields.push('city = ?');
        values.push(address.city);
    }
    if (address.state !== undefined) {
        fields.push('state = ?');
        values.push(address.state);
    }
    if (address.postal_code !== undefined) {
        fields.push('postal_code = ?');
        values.push(address.postal_code);
    }
    if (address.country !== undefined) {
        fields.push('country = ?');
        values.push(address.country);
    }
    if (address.is_default !== undefined) {
        fields.push('is_default = ?');
        values.push(address.is_default ? 1 : 0);
    }

    if (fields.length === 0) {
        throw new Error('No fields to update');
    }

    values.push(addressId, userId);

    await executeQuery(
        `UPDATE user_addresses SET ${fields.join(', ')} 
     WHERE id = ? AND user_id = ?`,
        values
    );
}

// Alias for compatibility
export async function updateAddress(userId: number, addressId: number, data: any) {
    return updateUserAddress(addressId, userId, {
        ...data,
        recipient_name: data.recipient_name || data.name || data.fullName,
        address_line: data.address_line || data.address,
        state: data.state || data.city
    });
}

export async function deleteUserAddress(addressId: number, userId: number) {
    await executeQuery(
        'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
        [addressId, userId]
    );
}

export const deleteAddress = deleteUserAddress; // Alias

export async function setDefaultAddress(addressId: number, userId: number) {
    // Bỏ default của tất cả địa chỉ
    await executeQuery(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
    );

    // Set địa chỉ này làm mặc định
    await executeQuery(
        'UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?',
        [addressId, userId]
    );
}

/**
 * Xóa tài khoản người dùng.
 * Sử dụng cơ chế SOFT-DELETE (Xóa Mềm). Chỉ gán cờ `is_active = 0` và lưu ngày tháng xóa,
 * chứ tuyệt đối không `DELETE FROM users` để tránh vỡ ràng buộc khóa ngoại với Đơn hàng / Hóa đơn cũ.
 */
export async function deleteUser(userId: number) {
    return executeQuery(
        'UPDATE users SET deleted_at = NOW(), is_active = 0 WHERE id = ?',
        [userId]
    );
}
