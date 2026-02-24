'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * CompareProduct: Giao diện chuẩn cho 1 sản phẩm nằm trong danh sách So Sánh.
 * Hỗ trợ các trường động (dynamic key) để UI có thể map các cột so sánh linh hoạt.
 */
export interface CompareProduct {
    id: number | string;
    name: string;
    image_url: string;
    price?: number;
    retail_price?: number;
    category?: string;
    short_description?: string;
    [key: string]: any;
}

/**
 * ComparisonContextType: Tập hợp các thuộc tính và phương thức mà Comparison Provider bung ra cho Component con.
 */
interface ComparisonContextType {
    items: CompareProduct[];                                        // Mảng chứa tối đa 4 sản phẩm đang nằm trong Compare Bar
    addToCompare: (product: any) => void;                           // Lệnh thêm mới sản phẩm
    removeFromCompare: (productId: number | string) => void;        // Lệnh gỡ bỏ sản phẩm theo ID
    clearAll: () => void;                                           // Xóa rỗng danh sách
    isInCompare: (productId: number | string) => boolean;           // Tính toán xem nút Compare nên hiển thị active (màu đen) hay inactive
}

// Khởi tạo Context
const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CompareProduct[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    /**
     * Hook 1: Khôi phục trạng thái (Hydration)
     * Chạy ngay khi Component vừa mount vào DOM. Có nhiệm vụ đọc LocalStorage 
     * để lấy lại danh sách So sánh người dùng đã chọn từ phiên làm việc trước.
     */
    useEffect(() => {
        try {
            const saved = localStorage.getItem('nike_compare_list');
            if (saved) {
                setItems(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách so sánh từ localStorage:', error);
        }
        setIsLoaded(true);
    }, []);

    /**
     * Hook 2: Đồng bộ hóa (Syncing)
     * Kích hoạt mỗi khi mảng `items` thay đổi (do thêm/xóa ảnh). 
     * Tự động ghi đè dữ liệu mới xuống LocalStorage để bảo toàn phiên làm việc.
     */
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem('nike_compare_list', JSON.stringify(items));
            } catch (error) {
                console.error('Lỗi khi lưu danh sách so sánh vào localStorage:', error);
            }
        }
    }, [items, isLoaded]);

    /**
     * Hàm thêm sản phẩm vào danh sách
     * - Chặn thêm trùng lặp
     * - Chặn thêm khi đã đủ 4 sản phẩm
     * - Format gọn gàng chuẩn format CompareProduct để lưu
     */
    const addToCompare = (product: any) => {
        setItems((prev) => {
            if (prev.find((p) => p.id === product.id)) return prev;
            if (prev.length >= 4) {
                alert('Bạn chỉ có thể so sánh tối đa 4 sản phẩm cùng lúc.');
                return prev;
            }

            // Format product to ensure it has image_url if it's from a different structure
            const newCompareItem: CompareProduct = {
                id: product.id,
                name: product.name,
                image_url: product.image_url || product.image || (product.images?.[0]?.url) || '',
                price: product.price || product.base_price,
                sale_price: product.sale_price,
                retail_price: product.retail_price,
                category: product.category?.name || product.category || product.category_id,
                short_description: product.short_description,
                is_new_arrival: product.is_new_arrival,
            };

            return [...prev, newCompareItem];
        });
    };

    const removeFromCompare = (productId: number | string) => {
        setItems((prev) => prev.filter((p) => p.id !== productId));
    };

    const clearAll = () => {
        setItems([]);
    };

    const isInCompare = (productId: number | string) => {
        return items.some((p) => p.id === productId);
    };

    return (
        <ComparisonContext.Provider
            value={{
                items,
                addToCompare,
                removeFromCompare,
                clearAll,
                isInCompare,
            }}
        >
            {children}
        </ComparisonContext.Provider>
    );
}

export function useComparison() {
    const context = useContext(ComparisonContext);
    if (context === undefined) {
        throw new Error('useComparison must be used within a ComparisonProvider');
    }
    return context;
}
