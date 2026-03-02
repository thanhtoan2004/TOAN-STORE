import { ProductsGrid } from '@/components/ui/products';

export default function ShoesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="toan-container py-12">
        <ProductsGrid
          title="Tất Cả Giày"
          showSortOptions={true}
          filterParams={{ category: 'shoes' }}
        />
      </div>
    </div>
  );
}

