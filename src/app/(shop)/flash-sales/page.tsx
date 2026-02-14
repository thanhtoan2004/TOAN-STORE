
import { Metadata } from 'next';
import { executeQuery } from '@/lib/db/mysql';
import { formatDateForMySQL } from '@/lib/date-utils';
import ProductCard from '@/components/ui/products/ProductCard';
import Link from 'next/link';
import { Clock, Flame } from 'lucide-react';
import FlashSaleTimer from './FlashSaleTimer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Flash Sales | TOAN',
    description: 'Săn ngay các ưu đãi Flash Sale cực sốc tại TOAN. Số lượng có hạn!',
};

async function getActiveFlashSale() {
    const now = new Date();
    const formattedNow = formatDateForMySQL(now);

    // Get active flash sale
    const [flashSale] = await executeQuery<any[]>(
        `SELECT * FROM flash_sales
     WHERE is_active = 1
       AND start_time <= ?
       AND end_time > ?
     ORDER BY start_time DESC
     LIMIT 1`,
        [formattedNow, formattedNow]
    );

    if (!flashSale) return null;

    // Get products
    const products = await executeQuery<any[]>(
        `SELECT 
      fsi.*,
      p.name,
      p.slug,
      p.category_id,
      c.name as category_name,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url,
      p.base_price as original_price,
      p.is_new_arrival
     FROM flash_sale_items fsi
     JOIN products p ON fsi.product_id = p.id
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE fsi.flash_sale_id = ?
       AND p.is_active = 1
     ORDER BY fsi.created_at ASC`,
        [flashSale.id]
    );

    return { ...flashSale, products };
}

export default async function FlashSalesPage() {
    const flashSale = await getActiveFlashSale();

    if (!flashSale) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <Flame className="w-16 h-16 text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Chưa có Flash Sale nào</h1>
                <p className="text-gray-500 mb-6">Hãy quay lại sau để săn các ưu đãi hấp dẫn nhé!</p>
                <Link
                    href="/"
                    className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
                >
                    Tiếp tục mua sắm
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white py-12 px-4 shadow-lg mb-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                            <Flame className="w-10 h-10 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold mb-2">{flashSale.name}</h1>
                            <p className="text-white/90 text-lg">{flashSale.description}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-xl backdrop-blur-md border border-white/20">
                        <Clock className="w-6 h-6" />
                        <span className="text-lg font-medium mr-2">Kết thúc trong:</span>
                        <FlashSaleTimer endTime={flashSale.end_time} />
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {flashSale.products.map((product: any) => (
                        <ProductCard
                            key={product.product_id}
                            id={product.product_id.toString()}
                            name={product.name}
                            category={product.category_name || 'Giày'}
                            price={parseFloat(product.original_price)}
                            sale_price={parseFloat(product.flash_price)}
                            image_url={product.image_url}
                            is_new_arrival={!!product.is_new_arrival}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
