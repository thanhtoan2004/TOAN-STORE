import { NextResponse } from 'next/server';
import { getAddresses, addAddress } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';

// GET: Fetch user addresses
export async function GET(request: Request) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const userId = Number(session.userId);

        const addresses = await getAddresses(userId);
        return NextResponse.json(addresses);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// POST: Add new address
export async function POST(request: Request) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const userId = Number(session.userId);

        const body = await request.json();
        const { userId: bodyUserId, ...addressData } = body;

        const newAddressId = await addAddress(userId, addressData);
        return NextResponse.json({
            success: true,
            id: newAddressId,
            message: 'Address added successfully'
        });
    } catch (error) {
        console.error('Error adding address:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// DELETE: Delete an address
export async function DELETE(request: Request) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const userId = Number(session.userId);

        const { searchParams } = new URL(request.url);
        const addressId = searchParams.get('addressId');

        if (!addressId) {
            return NextResponse.json(
                { message: 'Address ID is required' },
                { status: 400 }
            );
        }

        const { deleteAddress } = await import('@/lib/db/mysql');
        await deleteAddress(userId, parseInt(addressId));

        return NextResponse.json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting address:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
