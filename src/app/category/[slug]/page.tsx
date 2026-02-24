import { Metadata, ResolvingMetadata } from 'next';
import { executeQuery } from '@/lib/db/mysql';
import ProductsGrid from '@/components/ui/products/ProductsGrid';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const slug = (await params).slug;

    // fetch data
    const categories = await executeQuery(
        'SELECT name, description FROM categories WHERE slug = ?',
        [slug]
    ) as any[];

    if (categories.length === 0) {
        return {
            title: 'Category Not Found | TOAN Store',
        };
    }

    const category = categories[0];

    return {
        title: `${category.name} | TOAN Store`,
        description: category.description || `Mua sắm sản phẩm ${category.name} tại TOAN Store.`,
        openGraph: {
            title: `${category.name} | TOAN Store`,
            description: category.description || `Khám phá bộ sưu tập ${category.name} cực hot.`,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/category/${slug}`,
            type: 'website',
        },
    };
}

export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;

    // Verify category existence
    const categories = await executeQuery(
        'SELECT name, description FROM categories WHERE slug = ?',
        [slug]
    ) as any[];

    if (categories.length === 0) {
        return notFound();
    }

    const category = categories[0];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
                <p className="text-gray-600">{category.description || `Tất cả sản phẩm thuộc danh mục ${category.name}`}</p>
            </div>

            <ProductsGrid
                title={`Sản phẩm: ${category.name}`}
                filterParams={{ category: slug }}
            />
        </div>
    );
}
