import { ProductsGrid } from '@/components/ui/products';

export default function ClothingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="nike-container py-12">
        <ProductsGrid 
          title="Tất Cả Quần Áo"
          showSortOptions={true}
          filterParams={{ category: 'clothing' }}
        />
      </div>
    </div>
  );
}

