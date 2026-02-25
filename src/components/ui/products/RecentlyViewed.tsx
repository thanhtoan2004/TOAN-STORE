
'use client';

import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

interface ViewedProduct {
    id: string;
    name: string;
    category: string;
    price: number;
    sale_price?: number;
    image_url: string;
    slug?: string;
    is_new_arrival?: boolean;
}

import { useLanguage } from '@/contexts/LanguageContext';

export default function RecentlyViewed() {
    const { t, language } = useLanguage();
    const [viewedProducts, setViewedProducts] = useState<ViewedProduct[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('recently_viewed');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    // Limit to 4 items and reverse to show newest first
                    setViewedProducts(parsed.slice(0, 4));
                }
            }
        } catch (e) {
            console.error('Error reading recently viewed:', e);
        }
    }, []);

    if (viewedProducts.length === 0) return null;

    const fontClass = language === 'vi' ? 'font-bold' : 'font-nike-futura';

    return (
        <section className="py-12 border-t">
            <h2 className={`text-2xl ${fontClass} mb-6 uppercase`}>{t.product.recently_viewed}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {viewedProducts.map((product) => (
                    <ProductCard
                        key={product.id}
                        id={String(product.id)}
                        slug={product.slug}
                        name={product.name}
                        category={product.category}
                        price={product.price}
                        sale_price={product.sale_price}
                        image_url={product.image_url}
                        is_new_arrival={Boolean(product.is_new_arrival)}
                    />
                ))}
            </div>
        </section>
    );
}
