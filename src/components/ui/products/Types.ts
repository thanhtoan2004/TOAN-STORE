// src/types.ts
export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    salePrice?: number;
    image: string;
    colors?: number;
    isNewArrival?: boolean;
  }
  