import { NextResponse } from 'next/server';
import { getAddresses, addAddress } from '@/lib/db/mysql'; // Assume mysql.ts has these functions

// GET: Fetch user addresses
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { message: 'User ID is required' },
                { status: 400 }
            );
        }

        const addresses = await getAddresses(parseInt(userId));
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
        const body = await request.json();
        const { userId, ...addressData } = body;

        if (!userId) {
            return NextResponse.json(
                { message: 'User ID is required' },
                { status: 400 }
            );
        }

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
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const addressId = searchParams.get('addressId');

        if (!userId || !addressId) {
            return NextResponse.json(
                { message: 'User ID and Address ID are required' },
                { status: 400 }
            );
        }

        const { deleteAddress } = await import('@/lib/db/mysql');
        await deleteAddress(parseInt(userId), parseInt(addressId));

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
