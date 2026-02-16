import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { deleteUser } from '@/lib/db/repositories/user';

export async function DELETE(request: Request) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const userId = Number(session.userId);

        // Soft delete the user
        await deleteUser(userId);

        // Create response and clear authentication cookies
        const response = NextResponse.json({
            success: true,
            message: 'Tài khoản của bạn đã được xóa vĩnh viễn.'
        });

        // Clear auth cookies
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');

        return response;
    } catch (error: any) {
        console.error('Error deleting account:', error);
        return NextResponse.json(
            { message: 'Có lỗi xảy ra khi xóa tài khoản', error: error.message },
            { status: 500 }
        );
    }
}
