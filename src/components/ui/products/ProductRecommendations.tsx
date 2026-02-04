
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
        async function fetchRelated() {
            try {
                const res = await fetch(`/api/products/${currentProductId}/related`);
                const data = await res.json();
                if (data.success) {
                    // Map API data to ProductCard expected format (price = Original, sale_price = Discounted)
                    const mappedProducts = data.data.map((p: any) => {
                        const basePrice = Number(p.price);
                        const retailPrice = p.sale_price ? Number(p.sale_price) : 0;

                        // Check for valid discount
                        if (retailPrice && retailPrice > basePrice) {
                            return {
                                ...p,
                                price: retailPrice,
                                sale_price: basePrice
                            };
                        }
                        return {
                            ...p,
                            price: basePrice,
                            sale_price: undefined
                        };
                    });
                    setProducts(mappedProducts);
                }
            } catch (error) {
                console.error('Error fetching related products:', error);
            } finally {
                setLoading(false);
            }
        }

        if (currentProductId) {
            fetchRelated();
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
                        is_new_arrival={false} // API doesn't return this yet, optional
                    />
                ))}
            </div>
        </section>
    );
}
