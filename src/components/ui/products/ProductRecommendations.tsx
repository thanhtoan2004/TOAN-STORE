
'use client';

import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    sale_price?: number;
    image_url: string;
    slug: string;
    is_new_arrival?: boolean | number;
}

interface ProductRecommendationsProps {
    currentProductId: number;
}

import { useLanguage } from '@/contexts/LanguageContext';

export default function ProductRecommendations({ currentProductId }: ProductRecommendationsProps) {
    const { t, language } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSimilar() {
            try {
                // Try the new AI similarity endpoint first
                const res = await fetch(`/api/products/${currentProductId}/similar`);
                const data = await res.json();

                if (data.success && data.data.length > 0) {
                    setProducts(data.data);
                } else {
                    // Fallback to traditional related products
                    const relRes = await fetch(`/api/products/${currentProductId}/related`);
                    const relData = await relRes.json();
                    if (relData.success) {
                        setProducts(relData.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching recommendations:', error);
            } finally {
                setLoading(false);
            }
        }

        if (currentProductId) {
            fetchSimilar();
        }
    }, [currentProductId]);

    if (loading || products.length === 0) return null;

    const fontClass = language === 'vi' ? 'font-bold' : 'font-nike-futura';

    return (
        <section className="py-12 border-t">
            <h2 className={`text-2xl ${fontClass} mb-6 uppercase`}>{t.product.related_products}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        id={String(product.id)}
                        name={product.name}
                        category={product.category}
                        price={Number(product.price)}
                        sale_price={product.sale_price ? Number(product.sale_price) : undefined}
                        image_url={product.image_url}
                        is_new_arrival={Boolean(product.is_new_arrival)}
                    />
                ))}
            </div>
        </section>
    );
}
