import { NextRequest } from 'next/server';
import { GET as transactionsGet } from '../../transactions/route';

/**
 * Alias Endpoint cho /api/transactions
 * Truyền trực tiếp NextRequest để handler gốc đọc được searchParams.
 */
export async function GET(req: NextRequest) {
  return await transactionsGet(req);
}
